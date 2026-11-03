import datetime
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Specialty, Doctor, DoctorSchedule, Appointment
from .services import generate_doctor_available_slots, send_appointment_confirmation

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for patient registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'first_name', 'last_name', 'email', 'phone',
            'password', 'confirm_password', 'terms_accepted'
        )

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the Terms and Conditions and Privacy Policy.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('terms_accepted')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            role='patient',
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Patient/User Profile Serializer."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'date_of_birth', 'gender',
            'blood_group', 'emergency_contact', 'address', 'city',
            'is_staff'
        )
        read_only_fields = ('id', 'email', 'role', 'is_staff', 'full_name')

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.email


class SpecialtySerializer(serializers.ModelSerializer):
    """Medical specialty serializer."""
    doctor_count = serializers.SerializerMethodField()

    class Meta:
        model = Specialty
        fields = ('id', 'name', 'slug', 'icon', 'description', 'is_popular', 'doctor_count')

    def get_doctor_count(self, obj):
        return obj.doctors.filter(is_active=True).count()


class DoctorScheduleSerializer(serializers.ModelSerializer):
    """Doctor working schedule serializer."""
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = (
            'id', 'day_of_week', 'day_name', 'start_time', 'end_time',
            'slot_duration_minutes', 'break_start_time', 'break_end_time', 'is_active'
        )


class DoctorListSerializer(serializers.ModelSerializer):
    """Doctor serializer for listings and cards."""
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    specialty_slug = serializers.CharField(source='specialty.slug', read_only=True)
    next_available_slot = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = (
            'id', 'full_name', 'specialty', 'specialty_name', 'specialty_slug',
            'qualifications', 'experience_years', 'profile_image',
            'hospital_affiliation', 'consultation_fee', 'city', 'address',
            'rating', 'review_count', 'is_active', 'is_featured', 'consultation_type',
            'next_available_slot'
        )

    def get_next_available_slot(self, obj):
        # Quick check for next 7 days
        today = timezone.localdate()
        for offset in range(7):
            target_date = today + datetime.timedelta(days=offset)
            slots = generate_doctor_available_slots(obj, target_date)
            for slot in slots:
                if slot['is_available']:
                    return {
                        'date': target_date.strftime('%Y-%m-%d'),
                        'time': slot['start_time']
                    }
        return None


class DoctorDetailSerializer(serializers.ModelSerializer):
    """Detailed doctor profile serializer with schedules."""
    specialty = SpecialtySerializer(read_only=True)
    schedules = DoctorScheduleSerializer(many=True, read_only=True)
    working_days = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = (
            'id', 'full_name', 'specialty', 'qualifications', 'experience_years',
            'biography', 'profile_image', 'hospital_affiliation',
            'consultation_fee', 'city', 'address', 'consultation_type',
            'rating', 'review_count', 'is_active', 'is_featured',
            'schedules', 'working_days'
        )

    def get_working_days(self, obj):
        schedules = obj.schedules.filter(is_active=True).order_by('day_of_week')
        return [
            {
                'day': s.get_day_of_week_display(),
                'hours': f"{s.start_time.strftime('%I:%M %p')} - {s.end_time.strftime('%I:%M %p')}",
                'slot_duration': s.slot_duration_minutes
            }
            for s in schedules
        ]


class DoctorAdminCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Admin adding or editing doctor."""
    class Meta:
        model = Doctor
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for viewing appointments."""
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty.name', read_only=True)
    doctor_hospital = serializers.CharField(source='doctor.hospital_affiliation', read_only=True)
    doctor_address = serializers.CharField(source='doctor.address', read_only=True)
    doctor_image = serializers.CharField(source='doctor.profile_image', read_only=True)
    patient_email = serializers.EmailField(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'reference_no', 'patient', 'doctor', 'doctor_name',
            'doctor_specialty', 'doctor_hospital', 'doctor_address', 'doctor_image',
            'appointment_date', 'start_time', 'end_time', 'consultation_fee',
            'status', 'patient_name', 'patient_email', 'patient_phone',
            'patient_dob', 'reason_for_visit', 'cancellation_reason',
            'cancelled_at', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'reference_no', 'patient', 'doctor_name', 'doctor_specialty',
            'doctor_hospital', 'doctor_address', 'doctor_image', 'consultation_fee',
            'created_at', 'updated_at'
        )


class AppointmentCreateSerializer(serializers.Serializer):
    """Serializer for creating an appointment with strict slot validation and locking."""
    doctor_id = serializers.IntegerField()
    appointment_date = serializers.DateField()
    start_time = serializers.TimeField()
    patient_name = serializers.CharField(max_length=150)
    patient_email = serializers.EmailField()
    patient_phone = serializers.CharField(max_length=20)
    patient_dob = serializers.DateField(required=False, allow_null=True)
    reason_for_visit = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_appointment_date(self, value):
        today = timezone.localdate()
        if value < today:
            raise serializers.ValidationError("Cannot book an appointment in the past.")
        if value > today + datetime.timedelta(days=90):
            raise serializers.ValidationError("Appointments can only be booked up to 90 days in advance.")
        return value

    def validate(self, attrs):
        doctor_id = attrs['doctor_id']
        app_date = attrs['appointment_date']
        start_t = attrs['start_time']

        try:
            doctor = Doctor.objects.get(id=doctor_id, is_active=True)
        except Doctor.DoesNotExist:
            raise serializers.ValidationError({"doctor_id": "Doctor does not exist or is inactive."})

        # Calculate end time based on doctor schedule
        day_of_week = app_date.weekday()
        try:
            schedule = DoctorSchedule.objects.get(doctor=doctor, day_of_week=day_of_week, is_active=True)
        except DoctorSchedule.DoesNotExist:
            raise serializers.ValidationError(
                {"appointment_date": f"Dr. {doctor.full_name} is not available on {app_date.strftime('%A')}."}
            )

        # Verify time slot is in schedule bounds
        if start_t < schedule.start_time or start_t >= schedule.end_time:
            raise serializers.ValidationError(
                {"start_time": f"Requested time is outside doctor's working hours ({schedule.start_time} - {schedule.end_time})."}
            )

        # Check if overlaps with break
        slot_dt = datetime.datetime.combine(app_date, start_t)
        end_slot_dt = slot_dt + datetime.timedelta(minutes=schedule.slot_duration_minutes)
        end_t = end_slot_dt.time()

        if schedule.break_start_time and schedule.break_end_time:
            break_start = datetime.datetime.combine(app_date, schedule.break_start_time)
            break_end = datetime.datetime.combine(app_date, schedule.break_end_time)
            if slot_dt < break_end and end_slot_dt > break_start:
                raise serializers.ValidationError({"start_time": "Selected time falls within doctor's break period."})

        # Check if today and past time
        now = timezone.localtime(timezone.now())
        if app_date == now.date() and start_t <= now.time():
            raise serializers.ValidationError({"start_time": "Cannot book a slot that has already passed."})

        attrs['doctor'] = doctor
        attrs['end_time'] = end_t
        attrs['consultation_fee'] = doctor.consultation_fee
        return attrs

    def create(self, validated_data):
        patient = self.context['request'].user
        doctor = validated_data['doctor']
        app_date = validated_data['appointment_date']
        start_t = validated_data['start_time']
        end_t = validated_data['end_time']
        fee = validated_data['consultation_fee']

        # Enforce atomic transaction and lock checking
        with transaction.atomic():
            # Check for conflict
            conflict = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=app_date,
                start_time=start_t
            ).exclude(status='CANCELLED').select_for_update().exists()

            if conflict:
                raise serializers.ValidationError(
                    {"start_time": "This appointment slot was just booked by another patient. Please choose another time."}
                )

            appointment = Appointment.objects.create(
                reference_no=Appointment.generate_reference(),
                patient=patient,
                doctor=doctor,
                appointment_date=app_date,
                start_time=start_t,
                end_time=end_t,
                consultation_fee=fee,
                status='CONFIRMED',
                patient_name=validated_data['patient_name'],
                patient_email=validated_data['patient_email'],
                patient_phone=validated_data['patient_phone'],
                patient_dob=validated_data.get('patient_dob'),
                reason_for_visit=validated_data.get('reason_for_visit', '')
            )

        # Trigger confirmation email in background/safe block
        send_appointment_confirmation(appointment)

        return appointment


class AppointmentRescheduleSerializer(serializers.Serializer):
    """Serializer for rescheduling an appointment."""
    new_date = serializers.DateField()
    new_start_time = serializers.TimeField()

    def validate_new_date(self, value):
        today = timezone.localdate()
        if value < today:
            raise serializers.ValidationError("Cannot reschedule to a past date.")
        return value

    def validate(self, attrs):
        appointment = self.context['appointment']
        doctor = appointment.doctor
        new_date = attrs['new_date']
        new_start = attrs['new_start_time']

        day_of_week = new_date.weekday()
        try:
            schedule = DoctorSchedule.objects.get(doctor=doctor, day_of_week=day_of_week, is_active=True)
        except DoctorSchedule.DoesNotExist:
            raise serializers.ValidationError({"new_date": f"Dr. {doctor.full_name} is not available on {new_date.strftime('%A')}."})

        # Calculate new end time
        slot_dt = datetime.datetime.combine(new_date, new_start)
        end_slot_dt = slot_dt + datetime.timedelta(minutes=schedule.slot_duration_minutes)
        new_end = end_slot_dt.time()

        if new_start < schedule.start_time or new_start >= schedule.end_time:
            raise serializers.ValidationError({"new_start_time": "Requested time is outside working hours."})

        if schedule.break_start_time and schedule.break_end_time:
            b_start = datetime.datetime.combine(new_date, schedule.break_start_time)
            b_end = datetime.datetime.combine(new_date, schedule.break_end_time)
            if slot_dt < b_end and end_slot_dt > b_start:
                raise serializers.ValidationError({"new_start_time": "Requested time falls in doctor's break."})

        now = timezone.localtime(timezone.now())
        if new_date == now.date() and new_start <= now.time():
            raise serializers.ValidationError({"new_start_time": "Cannot reschedule to a past time slot."})

        attrs['new_end_time'] = new_end
        return attrs


class AppointmentCancelSerializer(serializers.Serializer):
    """Serializer for cancelling an appointment."""
    reason = serializers.CharField(required=False, allow_blank=True, default='')
