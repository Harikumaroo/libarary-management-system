from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, BookViewSet, CategoryViewSet, TransactionViewSet, 
    ReservationViewSet, SystemSettingsViewSet, ReportsView, CustomTokenObtainPairView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'books', BookViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'settings', SystemSettingsViewSet)

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('reports/', ReportsView.as_view(), name='reports'),
    path('', include(router.urls)),
]
