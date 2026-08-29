from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from api.models import Category, Book, Transaction, Reservation, SystemSettings

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial LMS data (users, categories, books, settings)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding LMS database...'))

        # 1. System Settings
        settings, _ = SystemSettings.objects.get_or_create(id=1, defaults={
            'fine_rate_per_day': 5.00,
            'default_loan_period_days': 14,
            'max_books_per_student': 3
        })

        # 2. Users
        admin, created = User.objects.get_or_create(username='admin', defaults={
            'email': 'admin@lms.com',
            'first_name': 'System',
            'last_name': 'Administrator',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        })
        if created or not admin.check_password('admin123'):
            admin.set_password('admin123')
            admin.save()

        librarian, created = User.objects.get_or_create(username='librarian', defaults={
            'email': 'librarian@lms.com',
            'first_name': 'Sarah',
            'last_name': 'Connor',
            'role': 'librarian',
            'register_number': 'LIB-2026-001',
            'phone': '+1 555-0199'
        })
        if created or not librarian.check_password('lib123'):
            librarian.set_password('lib123')
            librarian.save()

        student1, created = User.objects.get_or_create(username='student1', defaults={
            'email': 'alex@student.edu',
            'first_name': 'Alex',
            'last_name': 'Rivera',
            'role': 'student',
            'register_number': 'STU-2026-101',
            'phone': '+1 555-0142',
            'max_books_allowed': 3
        })
        if created or not student1.check_password('stud123'):
            student1.set_password('stud123')
            student1.save()

        student2, created = User.objects.get_or_create(username='student2', defaults={
            'email': 'emma@student.edu',
            'first_name': 'Emma',
            'last_name': 'Watson',
            'role': 'student',
            'register_number': 'STU-2026-102',
            'phone': '+1 555-0188',
            'max_books_allowed': 3
        })
        if created or not student2.check_password('stud123'):
            student2.set_password('stud123')
            student2.save()

        # 3. Categories
        cat_cs, _ = Category.objects.get_or_create(name='Computer Science', defaults={'description': 'Software Engineering, AI, Databases'})
        cat_fiction, _ = Category.objects.get_or_create(name='Fiction & Literature', defaults={'description': 'Classic & Contemporary Novels'})
        cat_math, _ = Category.objects.get_or_create(name='Mathematics & Physics', defaults={'description': 'Calculus, Quantum Mechanics, Algebra'})

        # 4. Books
        b1, _ = Book.objects.get_or_create(title='Clean Code', defaults={
            'author': 'Robert C. Martin',
            'publisher': 'Prentice Hall',
            'category': cat_cs,
            'isbn': '978-0132350884',
            'publication_year': 2008,
            'total_copies': 5,
            'available_copies': 4,
            'rack_location': 'Rack A-12'
        })

        b2, _ = Book.objects.get_or_create(title='Design Patterns: Elements of Reusable Object-Oriented Software', defaults={
            'author': 'Erich Gamma et al.',
            'publisher': 'Addison-Wesley',
            'category': cat_cs,
            'isbn': '978-0201633610',
            'publication_year': 1994,
            'total_copies': 3,
            'available_copies': 2,
            'rack_location': 'Rack A-14'
        })

        b3, _ = Book.objects.get_or_create(title='To Kill a Mockingbird', defaults={
            'author': 'Harper Lee',
            'publisher': 'J. B. Lippincott & Co.',
            'category': cat_fiction,
            'isbn': '978-0061120084',
            'publication_year': 1960,
            'total_copies': 4,
            'available_copies': 4,
            'rack_location': 'Rack B-04'
        })

        b4, _ = Book.objects.get_or_create(title='Introduction to Algorithms', defaults={
            'author': 'Thomas H. Cormen',
            'publisher': 'MIT Press',
            'category': cat_cs,
            'isbn': '978-0262033848',
            'publication_year': 2009,
            'total_copies': 4,
            'available_copies': 3,
            'rack_location': 'Rack A-01'
        })

        # 5. Sample Transactions
        today = timezone.now().date()
        if not Transaction.objects.exists():
            # Active normal issue
            Transaction.objects.create(
                book=b1,
                user=student1,
                issue_date=today - timedelta(days=5),
                due_date=today + timedelta(days=9),
                status='issued'
            )
            # Overdue transaction
            t_overdue = Transaction.objects.create(
                book=b2,
                user=student1,
                issue_date=today - timedelta(days=20),
                due_date=today - timedelta(days=6),
                status='overdue'
            )
            t_overdue.fine_amount = t_overdue.calculate_fine(5.00)
            t_overdue.save()

            # Returned transaction
            t_returned = Transaction.objects.create(
                book=b4,
                user=student2,
                issue_date=today - timedelta(days=15),
                due_date=today - timedelta(days=1),
                return_date=today,
                status='returned',
                fine_amount=5.00,
                fine_paid=True
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded LMS data!'))
