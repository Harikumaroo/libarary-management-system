from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta

from .models import User, Category, Book, Transaction, Reservation, SystemSettings
from .serializers import (
    UserSerializer, CategorySerializer, BookSerializer, 
    TransactionSerializer, ReservationSerializer, SystemSettingsSerializer
)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_id'] = self.user.id
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['role'] = self.user.role
        data['register_number'] = self.user.register_number
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsLibrarianUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'librarian'

class IsAdminOrLibrarian(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'librarian']

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'register_number', 'first_name', 'last_name']

    def get_queryset(self):
        queryset = User.objects.all().order_by('-id')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        if self.request.user.role == 'student':
            return queryset.filter(id=self.request.user.id)
        return queryset

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        reg_num = request.query_params.get('register_number')
        username_query = request.query_params.get('username')

        if not reg_num and not username_query:
            if request.user.register_number:
                reg_num = request.user.register_number
            else:
                reg_num = request.user.username

        user_obj = None
        if reg_num:
            user_obj = User.objects.filter(Q(register_number__iexact=reg_num) | Q(username__iexact=reg_num)).first()
        if not user_obj and username_query:
            user_obj = User.objects.filter(username__iexact=username_query).first()

        if not user_obj:
            return Response({'error': f'No student record found for "{reg_num or username_query}"'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(user_obj)
        txs = Transaction.objects.filter(user=user_obj).order_by('-id')
        tx_serializer = TransactionSerializer(txs, many=True)

        active = [t for t in tx_serializer.data if t['status'] != 'returned']
        returned = [t for t in tx_serializer.data if t['status'] == 'returned']

        return Response({
            'student': serializer.data,
            'transactions': tx_serializer.data,
            'active_loans': active,
            'returned_loans': returned
        })


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminOrLibrarian]
        return [permission() for permission in permission_classes]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-id')
    serializer_class = BookSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author', 'publisher', 'isbn']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminOrLibrarian]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = Book.objects.all().order_by('-id')
        category_id = self.request.query_params.get('category')
        available_only = self.request.query_params.get('available')
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if available_only == 'true':
            queryset = queryset.filter(available_copies__gt=0)
        return queryset

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-id')
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['book__title', 'user__username', 'user__register_number']

    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.all().order_by('-id')
        if user.role == 'student':
            return queryset.filter(user=user)
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrLibrarian])
    def issue_book(self, request):
        book_id = request.data.get('book_id')
        user_id = request.data.get('user_id')
        
        if not book_id or not user_id:
            return Response({'error': 'Both book_id and user_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            book = Book.objects.get(id=book_id)
            target_user = User.objects.get(id=user_id)
        except (Book.DoesNotExist, User.DoesNotExist):
            return Response({'error': 'Book or User not found'}, status=status.HTTP_404_NOT_FOUND)

        if book.available_copies <= 0:
            return Response({'error': 'No available copies for this book'}, status=status.HTTP_400_BAD_REQUEST)

        active_loans = Transaction.objects.filter(user=target_user, status__in=['issued', 'overdue']).count()
        if active_loans >= target_user.max_books_allowed:
            return Response({'error': f'User has reached max allowed books limit ({target_user.max_books_allowed})'}, status=status.HTTP_400_BAD_REQUEST)

        already_borrowed = Transaction.objects.filter(user=target_user, book=book, status__in=['issued', 'overdue']).exists()
        if already_borrowed:
            return Response({'error': 'User has already borrowed a copy of this book'}, status=status.HTTP_400_BAD_REQUEST)

        settings_obj = SystemSettings.objects.first()
        loan_period = settings_obj.default_loan_period_days if settings_obj else 14
        
        issue_date = timezone.now().date()
        due_date = issue_date + timedelta(days=loan_period)

        transaction = Transaction.objects.create(
            book=book,
            user=target_user,
            issue_date=issue_date,
            due_date=due_date,
            status='issued'
        )

        book.available_copies -= 1
        book.save()

        # Fulfill any pending reservation if exists
        Reservation.objects.filter(book=book, user=target_user, status='pending').update(status='fulfilled')

        serializer = self.get_serializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrLibrarian])
    def return_book(self, request):
        transaction_id = request.data.get('transaction_id')
        if not transaction_id:
            return Response({'error': 'transaction_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transaction.objects.get(id=transaction_id)
        except Transaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

        if transaction.status == 'returned':
            return Response({'error': 'Book has already been returned'}, status=status.HTTP_400_BAD_REQUEST)

        settings_obj = SystemSettings.objects.first()
        rate = settings_obj.fine_rate_per_day if settings_obj else 5.00

        transaction.return_date = timezone.now().date()
        fine = transaction.calculate_fine(rate)
        transaction.fine_amount = fine
        transaction.status = 'returned'
        if fine == 0:
            transaction.fine_paid = True
        transaction.save()

        book = transaction.book
        book.available_copies += 1
        if book.available_copies > book.total_copies:
            book.available_copies = book.total_copies
        book.save()

        serializer = self.get_serializer(transaction)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrLibrarian])
    def pay_fine(self, request, pk=None):
        transaction = self.get_object()
        transaction.fine_paid = True
        transaction.save()
        return Response({'message': 'Fine marked as paid successfully', 'transaction': self.get_serializer(transaction).data})

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrLibrarian])
    def overdue(self, request):
        today = timezone.now().date()
        overdue_txs = Transaction.objects.filter(
            Q(status__in=['issued', 'overdue']) & Q(due_date__lt=today)
        ).order_by('due_date')
        
        overdue_txs.update(status='overdue')
        serializer = self.get_serializer(overdue_txs, many=True)
        return Response(serializer.data)

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all().order_by('-id')
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Reservation.objects.filter(user=user).order_by('-id')
        return Reservation.objects.all().order_by('-id')

    def create(self, request, *args, **kwargs):
        book_id = request.data.get('book')
        user = request.user

        if user.role == 'student':
            request.data['user'] = user.id

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        existing = Reservation.objects.filter(book=book, user=user, status='pending').exists()
        if existing:
            return Response({'error': 'You already have a pending reservation for this book'}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

class SystemSettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminUser]

    def list(self, request, *args, **kwargs):
        settings_obj, created = SystemSettings.objects.get_or_create(id=1)
        serializer = self.get_serializer(settings_obj)
        return Response(serializer.data)

class ReportsView(APIView):
    permission_classes = [IsAdminOrLibrarian]
    
    def get(self, request):
        total_books = Book.objects.count()
        total_copies = Book.objects.aggregate(total=Sum('total_copies'))['total'] or 0
        available_copies = Book.objects.aggregate(total=Sum('available_copies'))['total'] or 0
        
        total_students = User.objects.filter(role='student').count()
        total_librarians = User.objects.filter(role='librarian').count()
        
        today = timezone.now().date()
        active_loans = Transaction.objects.filter(status='issued', due_date__gte=today).count()
        overdue_loans = Transaction.objects.filter(
            Q(status='overdue') | (Q(status='issued') & Q(due_date__lt=today))
        ).count()
        total_returned = Transaction.objects.filter(status='returned').count()

        settings_obj = SystemSettings.objects.first()
        rate = settings_obj.fine_rate_per_day if settings_obj else 5.00

        paid_fines = Transaction.objects.filter(fine_paid=True).aggregate(total=Sum('fine_amount'))['total'] or 0.00
        
        unpaid_active = Transaction.objects.filter(status__in=['issued', 'overdue'])
        pending_fines = 0.0
        for tx in unpaid_active:
            pending_fines += float(tx.calculate_fine(rate))
        unpaid_returned = Transaction.objects.filter(status='returned', fine_paid=False)
        for tx in unpaid_returned:
            pending_fines += float(tx.fine_amount)

        category_data = Category.objects.annotate(count=Count('books')).values('name', 'count')

        return Response({
            'total_books': total_books,
            'total_copies': total_copies,
            'available_copies': available_copies,
            'total_students': total_students,
            'total_librarians': total_librarians,
            'active_loans': active_loans,
            'overdue_loans': overdue_loans,
            'total_returned': total_returned,
            'total_fines_collected': round(float(paid_fines), 2),
            'total_fines_pending': round(pending_fines, 2),
            'category_distribution': list(category_data)
        })

