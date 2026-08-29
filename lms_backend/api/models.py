from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('librarian', 'Librarian'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    register_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    max_books_allowed = models.IntegerField(default=3)
    
    def __str__(self):
        return f"{self.username} ({self.role})"

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200, blank=True, null=True)
    publisher = models.CharField(max_length=200, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='books')
    isbn = models.CharField(max_length=50, blank=True, null=True)
    publication_year = models.IntegerField(blank=True, null=True)
    total_copies = models.IntegerField(default=1)
    available_copies = models.IntegerField(default=1)
    rack_location = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.author or 'Unknown'}"

    def save(self, *args, **kwargs):
        if self.pk is None and (self.available_copies is None or self.available_copies > self.total_copies):
            self.available_copies = self.total_copies
        super().save(*args, **kwargs)

class Transaction(models.Model):
    STATUS_CHOICES = (
        ('issued', 'Issued'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField(default=timezone.now)
    return_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='issued')
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    fine_paid = models.BooleanField(default=False)
    remarks = models.CharField(max_length=255, blank=True, null=True)

    def calculate_fine(self, fine_rate_per_day=5.00):
        target_date = self.return_date if self.return_date else timezone.now().date()
        if target_date > self.due_date:
            overdue_days = (target_date - self.due_date).days
            return round(overdue_days * float(fine_rate_per_day), 2)
        return 0.00

    def __str__(self):
        return f"{self.book.title} - {self.user.username} ({self.status})"

class Reservation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('fulfilled', 'Fulfilled'),
        ('cancelled', 'Cancelled'),
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reservations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    request_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Reservation: {self.book.title} for {self.user.username} [{self.status}]"

class SystemSettings(models.Model):
    fine_rate_per_day = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    default_loan_period_days = models.IntegerField(default=14)
    max_books_per_student = models.IntegerField(default=3)

    def __str__(self):
        return f"System Config (Fine: ${self.fine_rate_per_day}/day, Loan: {self.default_loan_period_days} days)"

