from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CurrentUserView,
    PatientProfileView,
    SpecialtyListView,
    DoctorListView,
    DoctorDetailView,
    DoctorAvailabilityView,
    AppointmentCreateView,
    MyAppointmentsView,
    AppointmentDetailView,
    AppointmentCancelView,
    AppointmentRescheduleView,
    AdminDashboardStatsView,
    AdminAppointmentListView,
    AdminDoctorCreateView,
    AdminDoctorUpdateView,
    AdminDoctorScheduleView,
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Patient Profile
    path('patients/me/', PatientProfileView.as_view(), name='patient-profile'),

    # Specialties
    path('specialties/', SpecialtyListView.as_view(), name='specialty-list'),

    # Doctors
    path('doctors/', DoctorListView.as_view(), name='doctor-list'),
    path('doctors/<int:pk>/', DoctorDetailView.as_view(), name='doctor-detail'),
    path('doctors/<int:pk>/availability/', DoctorAvailabilityView.as_view(), name='doctor-availability'),

    # Appointments
    path('appointments/', AppointmentCreateView.as_view(), name='appointment-create'),
    path('appointments/my/', MyAppointmentsView.as_view(), name='appointment-my'),
    path('appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('appointments/<int:pk>/cancel/', AppointmentCancelView.as_view(), name='appointment-cancel'),
    path('appointments/<int:pk>/reschedule/', AppointmentRescheduleView.as_view(), name='appointment-reschedule'),

    # Administrator
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
    path('admin/appointments/', AdminAppointmentListView.as_view(), name='admin-appointments'),
    path('admin/doctors/', AdminDoctorCreateView.as_view(), name='admin-doctor-create'),
    path('admin/doctors/<int:pk>/', AdminDoctorUpdateView.as_view(), name='admin-doctor-update'),
    path('admin/doctors/<int:pk>/schedule/', AdminDoctorScheduleView.as_view(), name='admin-doctor-schedule'),
]
