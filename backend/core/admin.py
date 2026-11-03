from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Specialty, Doctor, DoctorSchedule, Appointment


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'phone', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'role')}),
        ('Patient Details', {'fields': ('date_of_birth', 'gender', 'blood_group', 'emergency_contact', 'address', 'city')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'is_popular', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')
    list_filter = ('is_popular',)


class DoctorScheduleInline(admin.TabularInline):
    model = DoctorSchedule
    extra = 1


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        'full_name', 'specialty', 'hospital_affiliation', 'city',
        'experience_years', 'consultation_fee', 'rating', 'is_active', 'is_featured'
    )
    list_filter = ('specialty', 'city', 'is_active', 'is_featured')
    search_fields = ('full_name', 'hospital_affiliation', 'qualifications', 'city')
    inlines = [DoctorScheduleInline]


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes', 'is_active')
    list_filter = ('day_of_week', 'is_active', 'doctor__specialty')
    search_fields = ('doctor__full_name',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'reference_no', 'patient_name', 'doctor', 'appointment_date',
        'start_time', 'end_time', 'status', 'consultation_fee', 'created_at'
    )
    list_filter = ('status', 'appointment_date', 'doctor__specialty')
    search_fields = ('reference_no', 'patient_name', 'patient_email', 'patient_phone', 'doctor__full_name')
    readonly_fields = ('reference_no', 'created_at', 'updated_at')
    actions = ['mark_completed', 'mark_cancelled']

    def mark_completed(self, request, queryset):
        queryset.update(status='COMPLETED')
    mark_completed.short_description = "Mark selected appointments as Completed"

    def mark_cancelled(self, request, queryset):
        queryset.update(status='CANCELLED')
    mark_cancelled.short_description = "Mark selected appointments as Cancelled"
