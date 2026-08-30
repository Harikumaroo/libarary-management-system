from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import User, Category, Book, Transaction, Reservation, SystemSettings

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    active_loans_count = serializers.SerializerMethodField()
    total_fines_due = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'password', 'role', 'register_number', 'phone', 
            'max_books_allowed', 'is_active', 'active_loans_count', 'total_fines_due'
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def get_active_loans_count(self, obj):
        return obj.transactions.filter(status__in=['issued', 'overdue']).count()

    def get_total_fines_due(self, obj):
        settings = SystemSettings.objects.first()
        rate = settings.fine_rate_per_day if settings else 5.00
        active_txs = obj.transactions.filter(status__in=['issued', 'overdue'])
        total_fine = 0.0
        for tx in active_txs:
            total_fine += float(tx.calculate_fine(rate))
        unpaid_returned = obj.transactions.filter(status='returned', fine_paid=False)
        for tx in unpaid_returned:
            total_fine += float(tx.fine_amount)
        return round(total_fine, 2)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password("default123")
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class CategorySerializer(serializers.ModelSerializer):
    book_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'book_count']

    def get_book_count(self, obj):
        return obj.books.count()

class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'publisher', 'category', 'category_name',
            'isbn', 'publication_year', 'total_copies', 'available_copies',
            'rack_location', 'created_at', 'is_available'
        ]

    def get_is_available(self, obj):
        return obj.available_copies > 0

class TransactionSerializer(serializers.ModelSerializer):
    book_title = serializers.ReadOnlyField(source='book.title')
    book_isbn = serializers.ReadOnlyField(source='book.isbn')
    user_name = serializers.ReadOnlyField(source='user.username')
    user_register_number = serializers.ReadOnlyField(source='user.register_number')
    calculated_fine = serializers.SerializerMethodField()
    overdue_days = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'book', 'book_title', 'book_isbn', 'user', 'user_name', 
            'user_register_number', 'issue_date', 'due_date', 'return_date', 
            'status', 'fine_amount', 'fine_paid', 'remarks', 
            'calculated_fine', 'overdue_days'
        ]

    def get_calculated_fine(self, obj):
        settings = SystemSettings.objects.first()
        rate = settings.fine_rate_per_day if settings else 5.00
        if obj.status in ['issued', 'overdue']:
            return obj.calculate_fine(rate)
        return float(obj.fine_amount)

    def get_overdue_days(self, obj):
        target_date = obj.return_date if obj.return_date else timezone.now().date()
        if target_date > obj.due_date:
            return (target_date - obj.due_date).days
        return 0

class ReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.ReadOnlyField(source='book.title')
    book_author = serializers.ReadOnlyField(source='book.author')
    user_name = serializers.ReadOnlyField(source='user.username')
    user_register_number = serializers.ReadOnlyField(source='user.register_number')

    class Meta:
        model = Reservation
        fields = [
            'id', 'book', 'book_title', 'book_author', 'user', 'user_name',
            'user_register_number', 'request_date', 'status', 'notes'
        ]

class SystemSettingsSerializer(serializers.ModelSerializer):
    currency_symbol = serializers.ReadOnlyField()

    class Meta:
        model = SystemSettings
        fields = ['id', 'fine_rate_per_day', 'default_loan_period_days', 'max_books_per_student', 'currency', 'currency_symbol']


