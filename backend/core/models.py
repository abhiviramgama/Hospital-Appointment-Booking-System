import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """Custom user manager supporting email as primary identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model for Patients, Doctors, and Platform Admins."""
    
    ROLE_CHOICES = (
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
    )

    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    )

    email = models.EmailField(_('email address'), unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient', db_index=True)
    
    # Patient Profile Fields
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default='')
    blood_group = models.CharField(max_length=10, blank=True, default='')
    emergency_contact = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email


class Specialty(models.Model):
    """Medical specialty/department."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    icon = models.CharField(max_length=50, default='Stethoscope', help_text='Lucide icon identifier')
    description = models.TextField(blank=True, default='')
    is_popular = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Specialties'
        ordering = ['name']

    def __str__(self):
        return self.name


class Doctor(models.Model):
    """Doctor profile."""
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doctor_profile'
    )
    full_name = models.CharField(max_length=150)
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        related_name='doctors'
    )
    qualifications = models.CharField(max_length=255, help_text="e.g. MBBS, MD - Cardiology, FACC")
    experience_years = models.PositiveIntegerField(default=5)
    biography = models.TextField()
    profile_image = models.URLField(
        max_length=500,
        blank=True,
        default='https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'
    )
    hospital_affiliation = models.CharField(
        max_length=255,
        default='CarePulse Super Specialty Hospital'
    )
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    city = models.CharField(max_length=100, default='Bangalore', db_index=True)
    address = models.TextField(default='124 Healthcare Avenue, Whitefield, Bangalore')
    consultation_type = models.CharField(max_length=50, default='in-person')
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.85)
    review_count = models.PositiveIntegerField(default=95)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-rating', '-experience_years']

    def __str__(self):
        return f"{self.full_name} ({self.specialty.name})"


class DoctorSchedule(models.Model):
    """Working schedule for a doctor by day of week."""
    DAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='schedules'
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)
    break_start_time = models.TimeField(null=True, blank=True)
    break_end_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('doctor', 'day_of_week')
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.doctor.full_name} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"


class Appointment(models.Model):
    """Appointment booked by a patient."""
    STATUS_CHOICES = (
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
        ('NO_SHOW', 'No-show'),
    )

    reference_no = models.CharField(max_length=32, unique=True, db_index=True)
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    appointment_date = models.DateField(db_index=True)
    start_time = models.TimeField(db_index=True)
    end_time = models.TimeField()
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED', db_index=True)
    
    # Snapshot of patient contact info at booking
    patient_name = models.CharField(max_length=150)
    patient_email = models.EmailField()
    patient_phone = models.CharField(max_length=20)
    patient_dob = models.DateField(null=True, blank=True)
    reason_for_visit = models.TextField(blank=True, default='')
    
    # Cancellation tracking
    cancellation_reason = models.TextField(blank=True, default='')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-appointment_date', '-start_time']
        constraints = [
            # Ensure no double-booking for the same doctor at the same date and time slot
            models.UniqueConstraint(
                fields=['doctor', 'appointment_date', 'start_time'],
                condition=~models.Q(status='CANCELLED'),
                name='unique_active_doctor_slot'
            )
        ]

    def __str__(self):
        return f"{self.reference_no} - {self.doctor.full_name} with {self.patient_name} on {self.appointment_date} {self.start_time}"

    @classmethod
    def generate_reference(cls):
        """Generates a readable unique reference like APT-20261027-A1B2."""
        short_id = uuid.uuid4().hex[:6].upper()
        return f"APT-{short_id}"
