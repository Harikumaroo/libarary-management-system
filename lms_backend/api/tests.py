from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from api.models import Category, Book, Transaction, Reservation, SystemSettings

User = get_user_model()

class LMSComprehensiveQASuite(APITestCase):
    def setUp(self):
        self.settings = SystemSettings.objects.create(
            fine_rate_per_day=5.00,
            default_loan_period_days=14,
            max_books_per_student=3
        )

        self.admin = User.objects.create_superuser(
            username='admin_qa', email='admin@qa.com', password='password123', role='admin'
        )
        self.librarian = User.objects.create_user(
            username='librarian_qa', email='lib@qa.com', password='password123', role='librarian', register_number='LIB-QA-01'
        )
        self.student1 = User.objects.create_user(
            username='student_qa1', email='stu1@qa.com', password='password123', role='student', register_number='STU-QA-101', max_books_allowed=3
        )
        self.student2 = User.objects.create_user(
            username='student_qa2', email='stu2@qa.com', password='password123', role='student', register_number='STU-QA-102', max_books_allowed=3
        )

        self.category = Category.objects.create(name='Software Architecture', description='Design & Patterns')
        
        self.book1 = Book.objects.create(
            title='Clean Code', author='Robert Martin', category=self.category, isbn='978-0132350884', total_copies=2, available_copies=2
        )
        self.book2 = Book.objects.create(
            title='Design Patterns', author='Gang of Four', category=self.category, isbn='978-0201633610', total_copies=1, available_copies=0
        )
        self.book3 = Book.objects.create(
            title='Domain Driven Design', author='Eric Evans', category=self.category, isbn='978-0321125217', total_copies=5, available_copies=5
        )

    # 1. AUTHENTICATION & TOKEN ISSUANCE
    def test_auth_login_jwt(self):
        response = self.client.post('/api/auth/login/', {'username': 'admin_qa', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['role'], 'admin')

    # 2. ROLE SECURITY BOUNDARY AUDIT
    def test_student_unauthorized_issue_book(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.post('/api/transactions/issue_book/', {'book_id': self.book1.id, 'user_id': self.student1.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # 3. CIRCULATION: ISSUE BOOK SUCCESS & STOCK DECREMENT
    def test_librarian_issue_book_success(self):
        self.client.force_authenticate(user=self.librarian)
        response = self.client.post('/api/transactions/issue_book/', {'book_id': self.book1.id, 'user_id': self.student1.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.book1.refresh_from_db()
        self.assertEqual(self.book1.available_copies, 1)

    # 4. CIRCULATION: ISSUE OUT OF STOCK BOOK FAILS
    def test_issue_out_of_stock_fails(self):
        self.client.force_authenticate(user=self.librarian)
        response = self.client.post('/api/transactions/issue_book/', {'book_id': self.book2.id, 'user_id': self.student1.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No available copies', response.data['error'])

    # 5. CIRCULATION: MAX ALLOWED LIMIT ENFORCEMENT
    def test_issue_max_limit_exceeded(self):
        self.client.force_authenticate(user=self.librarian)
        today = timezone.now().date()
        due = today + timedelta(days=14)
        
        # Create 3 existing active loans (max limit)
        for i in range(3):
            b = Book.objects.create(title=f'Test Book {i}', total_copies=2, available_copies=1)
            Transaction.objects.create(book=b, user=self.student1, issue_date=today, due_date=due, status='issued')

        # Try issuing 4th book
        response = self.client.post('/api/transactions/issue_book/', {'book_id': self.book3.id, 'user_id': self.student1.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('max allowed books limit', response.data['error'])

    # 6. CIRCULATION: DUPLICATE LOAN PREVENTION
    def test_issue_duplicate_book_fails(self):
        self.client.force_authenticate(user=self.librarian)
        today = timezone.now().date()
        Transaction.objects.create(book=self.book1, user=self.student1, issue_date=today, due_date=today + timedelta(days=14), status='issued')

        response = self.client.post('/api/transactions/issue_book/', {'book_id': self.book1.id, 'user_id': self.student1.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already borrowed', response.data['error'])

    # 7. OVERDUE FINE ACCURACY & RETURN WORKFLOW
    def test_return_overdue_book_fine_calculation(self):
        self.client.force_authenticate(user=self.librarian)
        today = timezone.now().date()
        past_due = today - timedelta(days=4) # 4 days overdue * $5.00/day = $20.00 fine
        
        tx = Transaction.objects.create(
            book=self.book1, user=self.student1, issue_date=today - timedelta(days=18), due_date=past_due, status='issued'
        )
        self.book1.available_copies = 1
        self.book1.save()

        response = self.client.post('/api/transactions/return_book/', {'transaction_id': tx.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['fine_amount']), 20.00)
        self.assertEqual(response.data['status'], 'returned')

        self.book1.refresh_from_db()
        self.assertEqual(self.book1.available_copies, 2)

    # 8. FINE PAYMENT SETTLEMENT
    def test_pay_fine_settlement(self):
        self.client.force_authenticate(user=self.librarian)
        today = timezone.now().date()
        tx = Transaction.objects.create(
            book=self.book1, user=self.student1, issue_date=today - timedelta(days=20), due_date=today - timedelta(days=5), return_date=today, status='returned', fine_amount=25.00, fine_paid=False
        )

        response = self.client.post(f'/api/transactions/{tx.id}/pay_fine/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        tx.refresh_from_db()
        self.assertTrue(tx.fine_paid)

    # 9. REGISTER NUMBER LOOKUP API AUDIT
    def test_student_lookup_by_register_number(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.get('/api/users/lookup/?register_number=STU-QA-101')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student']['register_number'], 'STU-QA-101')

    # 10. SYSTEM REPORTS SUMMARY AUDIT
    def test_reports_summary_analytics(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_books', response.data)
        self.assertIn('total_students', response.data)
        self.assertIn('total_fines_collected', response.data)
