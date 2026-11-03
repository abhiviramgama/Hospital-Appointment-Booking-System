import datetime
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q, Count, Sum
from django.utils import timezone
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Specialty, Doctor, DoctorSchedule, Appointment
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    SpecialtySerializer,
    DoctorListSerializer,
    DoctorDetailSerializer,
    DoctorAdminCreateUpdateSerializer,
    DoctorScheduleSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentRescheduleSerializer,
    AppointmentCancelSerializer,
)
from .permissions import IsPlatformAdmin, IsAppointmentOwnerOrAdmin
from .services import (
    generate_doctor_available_slots,
    send_appointment_cancellation,
    send_appointment_rescheduled
)

User = get_user_model()


# -------------------------------------------------------------
# Custom JWT Auth
# -------------------------------------------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Augments standard token response with user profile data."""
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# -------------------------------------------------------------
# Authentication Views
# -------------------------------------------------------------
class RegisterView(generics.CreateAPIView):
    """Register a new patient account."""
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserProfileSerializer(user).data
        return Response({
            'message': 'Registration successful. You can now log in to your account.',
            'user': user_data
        }, status=status.status_code if hasattr(status, 'status_code') else status.HTTP_201_CREATED)


class CurrentUserView(generics.RetrieveAPIView):
    """Retrieve currently authenticated user."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class PatientProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve and update current patient profile."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


# -------------------------------------------------------------
# Specialties Views
# -------------------------------------------------------------
class SpecialtyListView(generics.ListAPIView):
    """List medical specialties."""
    permission_classes = [AllowAny]
    serializer_class = SpecialtySerializer
    queryset = Specialty.objects.all().order_by('name')
    pagination_class = None


# -------------------------------------------------------------
# Doctor Directory Views
# -------------------------------------------------------------
class DoctorListView(generics.ListAPIView):
    """
    Search and filter doctors.
    Supported query params:
    - search: string (matches doctor full name or hospital)
    - specialty: slug or id
    - city: string
    - max_fee: numeric
    - min_experience: numeric
    - ordering: 'experience', '-experience', 'fee', '-fee', 'rating', '-rating'
    """
    permission_classes = [AllowAny]
    serializer_class = DoctorListSerializer

    def get_queryset(self):
        qs = Doctor.objects.filter(is_active=True).select_related('specialty')

        params = self.request.query_params
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(hospital_affiliation__icontains=search) |
                Q(specialty__name__icontains=search) |
                Q(city__icontains=search)
            )

        specialty = params.get('specialty')
        if specialty:
            if specialty.isdigit():
                qs = qs.filter(specialty_id=specialty)
            else:
                qs = qs.filter(specialty__slug=specialty)

        city = params.get('city')
        if city:
            qs = qs.filter(city__iexact=city)

        max_fee = params.get('max_fee')
        if max_fee and max_fee.isdigit():
            qs = qs.filter(consultation_fee__lte=max_fee)

        min_experience = params.get('min_experience')
        if min_experience and min_experience.isdigit():
            qs = qs.filter(experience_years__gte=min_experience)

        featured = params.get('featured')
        if featured and featured.lower() in ('true', '1'):
            qs = qs.filter(is_featured=True)

        ordering = params.get('ordering', '-rating')
        order_map = {
            'rating': '-rating',
            '-rating': '-rating',
            'experience': '-experience_years',
            '-experience': '-experience_years',
            'fee_asc': 'consultation_fee',
            'fee_desc': '-consultation_fee',
            'name': 'full_name',
        }
        qs = qs.order_by(order_map.get(ordering, '-rating'))
        return qs


class DoctorDetailView(generics.RetrieveAPIView):
    """Retrieve full details of a doctor."""
    permission_classes = [AllowAny]
    serializer_class = DoctorDetailSerializer
    queryset = Doctor.objects.all().prefetch_related('schedules', 'specialty')


class DoctorAvailabilityView(views.APIView):
    """
    Returns available time slots for a doctor on a specific date.
    Query param: date=YYYY-MM-DD (defaults to today)
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            doctor = Doctor.objects.get(pk=pk, is_active=True)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found or inactive.'}, status=status.HTTP_404_NOT_FOUND)

        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.localdate()

        slots = generate_doctor_available_slots(doctor, target_date)
        return Response({
            'doctor_id': doctor.id,
            'doctor_name': doctor.full_name,
            'date': target_date.strftime('%Y-%m-%d'),
            'day_name': target_date.strftime('%A'),
            'slots': slots,
            'available_count': sum(1 for s in slots if s['is_available'])
        })


# -------------------------------------------------------------
# Appointment Views
# -------------------------------------------------------------
class AppointmentCreateView(generics.CreateAPIView):
    """Book a new appointment with transaction isolation."""
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        output_data = AppointmentSerializer(appointment).data
        return Response(output_data, status=status.HTTP_201_CREATED)


class MyAppointmentsView(generics.ListAPIView):
    """List appointments belonging to the logged-in patient."""
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.filter(patient=user).select_related('doctor', 'doctor__specialty')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return qs.order_by('-appointment_date', '-start_time')


class AppointmentDetailView(generics.RetrieveAPIView):
    """Get single appointment details (only owner or admin)."""
    permission_classes = [IsAuthenticated, IsAppointmentOwnerOrAdmin]
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.all().select_related('doctor', 'doctor__specialty')


class AppointmentCancelView(views.APIView):
    """Cancel an upcoming appointment and release the slot."""
    permission_classes = [IsAuthenticated, IsAppointmentOwnerOrAdmin]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.select_for_update().get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, appointment)

        if appointment.status == 'CANCELLED':
            return Response({'error': 'Appointment is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        if appointment.status == 'COMPLETED':
            return Response({'error': 'Cannot cancel a completed appointment.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AppointmentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')

        with transaction.atomic():
            appointment.status = 'CANCELLED'
            appointment.cancellation_reason = reason
            appointment.cancelled_at = timezone.now()
            appointment.save()

        # Send cancellation email
        email_sent = send_appointment_cancellation(appointment, reason)

        return Response({
            'message': 'Appointment has been cancelled successfully.',
            'reference_no': appointment.reference_no,
            'email_sent': email_sent,
            'appointment': AppointmentSerializer(appointment).data
        })


class AppointmentRescheduleView(views.APIView):
    """Reschedule an existing confirmed appointment to a new slot."""
    permission_classes = [IsAuthenticated, IsAppointmentOwnerOrAdmin]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.select_for_update().get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, appointment)

        if appointment.status != 'CONFIRMED':
            return Response(
                {'error': f'Cannot reschedule an appointment with status {appointment.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AppointmentRescheduleSerializer(data=request.data, context={'appointment': appointment})
        serializer.is_valid(raise_exception=True)

        new_date = serializer.validated_data['new_date']
        new_start = serializer.validated_data['new_start_time']
        new_end = serializer.validated_data['new_end_time']

        old_date_str = appointment.appointment_date.strftime('%A, %B %d, %Y')
        old_time_str = appointment.start_time.strftime('%I:%M %p')

        with transaction.atomic():
            # Check slot conflict at target time
            conflict = Appointment.objects.filter(
                doctor=appointment.doctor,
                appointment_date=new_date,
                start_time=new_start
            ).exclude(pk=appointment.pk).exclude(status='CANCELLED').exists()

            if conflict:
                return Response(
                    {'error': 'The requested new slot was just booked by another patient. Please choose a different time.'},
                    status=status.HTTP_409_CONFLICT
                )

            appointment.appointment_date = new_date
            appointment.start_time = new_start
            appointment.end_time = new_end
            appointment.save()

        # Send reschedule confirmation email
        email_sent = send_appointment_rescheduled(appointment, old_date_str, old_time_str)

        return Response({
            'message': 'Appointment rescheduled successfully.',
            'email_sent': email_sent,
            'appointment': AppointmentSerializer(appointment).data
        })


# -------------------------------------------------------------
# Admin Views
# -------------------------------------------------------------
class AdminDashboardStatsView(views.APIView):
    """Aggregate stats for administrative dashboard."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def get(self, request):
        today = timezone.localdate()
        total_appointments = Appointment.objects.count()
        today_appointments = Appointment.objects.filter(appointment_date=today).count()
        confirmed_count = Appointment.objects.filter(status='CONFIRMED').count()
        completed_count = Appointment.objects.filter(status='COMPLETED').count()
        cancelled_count = Appointment.objects.filter(status='CANCELLED').count()

        active_doctors = Doctor.objects.filter(is_active=True).count()
        total_patients = User.objects.filter(role='patient').count()
        specialties_count = Specialty.objects.count()

        total_revenue = Appointment.objects.filter(
            status__in=['CONFIRMED', 'COMPLETED']
        ).aggregate(total=Sum('consultation_fee'))['total'] or 0

        # Recent 5 bookings
        recent = Appointment.objects.select_related('doctor', 'doctor__specialty').order_by('-created_at')[:5]

        return Response({
            'total_appointments': total_appointments,
            'today_appointments': today_appointments,
            'confirmed_appointments': confirmed_count,
            'completed_appointments': completed_count,
            'cancelled_appointments': cancelled_count,
            'active_doctors': active_doctors,
            'total_patients': total_patients,
            'specialties_count': specialties_count,
            'total_revenue': float(total_revenue),
            'recent_bookings': AppointmentSerializer(recent, many=True).data
        })


class AdminAppointmentListView(generics.ListAPIView):
    """Admin view for all appointments with rich filtering."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        qs = Appointment.objects.select_related('doctor', 'doctor__specialty', 'patient').all()
        params = self.request.query_params

        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(reference_no__icontains=search) |
                Q(patient_name__icontains=search) |
                Q(patient_email__icontains=search) |
                Q(doctor__full_name__icontains=search)
            )

        status_val = params.get('status')
        if status_val:
            qs = qs.filter(status=status_val.upper())

        doctor_id = params.get('doctor_id')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)

        date_val = params.get('date')
        if date_val:
            qs = qs.filter(appointment_date=date_val)

        return qs.order_by('-appointment_date', '-start_time')


class AdminDoctorCreateView(generics.CreateAPIView):
    """Admin creates a new doctor profile."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = DoctorAdminCreateUpdateSerializer


class AdminDoctorUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Admin updates or deactivates a doctor profile."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = DoctorAdminCreateUpdateSerializer
    queryset = Doctor.objects.all()


class AdminDoctorScheduleView(views.APIView):
    """Admin sets or updates a doctor's weekly schedules."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, pk):
        try:
            doctor = Doctor.objects.get(pk=pk)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        schedules_data = request.data.get('schedules', [])
        if not isinstance(schedules_data, list):
            return Response({'error': 'schedules must be a list of schedule objects.'}, status=status.HTTP_400_BAD_REQUEST)

        created_or_updated = []
        with transaction.atomic():
            for item in schedules_data:
                day_of_week = item.get('day_of_week')
                start_time = item.get('start_time')
                end_time = item.get('end_time')
                slot_duration = item.get('slot_duration_minutes', 30)
                break_start = item.get('break_start_time')
                break_end = item.get('break_end_time')
                is_active = item.get('is_active', True)

                schedule, _ = DoctorSchedule.objects.update_or_create(
                    doctor=doctor,
                    day_of_week=day_of_week,
                    defaults={
                        'start_time': start_time,
                        'end_time': end_time,
                        'slot_duration_minutes': slot_duration,
                        'break_start_time': break_start or None,
                        'break_end_time': break_end or None,
                        'is_active': is_active
                    }
                )
                created_or_updated.append(DoctorScheduleSerializer(schedule).data)

        return Response({
            'message': 'Doctor schedules updated successfully.',
            'schedules': created_or_updated
        })
