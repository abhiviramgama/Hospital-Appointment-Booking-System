import datetime
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import DoctorSchedule, Appointment

logger = logging.getLogger(__name__)


def generate_doctor_available_slots(doctor, target_date):
    """
    Computes all potential slots based on doctor's schedule and filters out
    breaks, booked appointments, and past times.
    Returns list of dicts: [{'start_time': '09:00', 'end_time': '09:30', 'is_available': True}, ...]
    """
    day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
    try:
        schedule = DoctorSchedule.objects.get(
            doctor=doctor,
            day_of_week=day_of_week,
            is_active=True
        )
    except DoctorSchedule.DoesNotExist:
        return []

    # Get booked active appointments for this doctor on target_date
    booked_start_times = set(
        Appointment.objects.filter(
            doctor=doctor,
            appointment_date=target_date
        ).exclude(
            status='CANCELLED'
        ).values_list('start_time', flat=True)
    )

    # Current local time for past slot filtering
    now = timezone.localtime(timezone.now())
    is_today = (target_date == now.date())

    slots = []
    slot_delta = datetime.timedelta(minutes=schedule.slot_duration_minutes)

    current_dt = datetime.datetime.combine(target_date, schedule.start_time)
    end_dt = datetime.datetime.combine(target_date, schedule.end_time)

    break_start_dt = None
    break_end_dt = None
    if schedule.break_start_time and schedule.break_end_time:
        break_start_dt = datetime.datetime.combine(target_date, schedule.break_start_time)
        break_end_dt = datetime.datetime.combine(target_date, schedule.break_end_time)

    while current_dt + slot_delta <= end_dt:
        slot_start_time = current_dt.time()
        slot_end_time = (current_dt + slot_delta).time()

        # Check if overlaps with doctor's break
        in_break = False
        if break_start_dt and break_end_dt:
            # Overlaps if slot starts before break ends and ends after break starts
            if current_dt < break_end_dt and (current_dt + slot_delta) > break_start_dt:
                in_break = True

        # Check if past slot
        is_past = False
        if is_today and slot_start_time <= now.time():
            is_past = True

        # Check if already booked
        is_booked = slot_start_time in booked_start_times

        is_available = not in_break and not is_past and not is_booked

        slots.append({
            'start_time': slot_start_time.strftime('%H:%M'),
            'end_time': slot_end_time.strftime('%H:%M'),
            'is_available': is_available,
            'reason': 'Break' if in_break else ('Past' if is_past else ('Booked' if is_booked else 'Available'))
        })

        current_dt += slot_delta

    return slots


def send_appointment_confirmation(appointment):
    """Sends confirmation email to patient."""
    subject = f"Appointment Confirmed: {appointment.reference_no} with {appointment.doctor.full_name}"
    message = f"""Dear {appointment.patient_name},

Your appointment has been successfully confirmed.

Appointment Details:
- Reference Number: {appointment.reference_no}
- Doctor: {appointment.doctor.full_name} ({appointment.doctor.specialty.name})
- Hospital / Clinic: {appointment.doctor.hospital_affiliation}
- Address: {appointment.doctor.address}
- Date: {appointment.appointment_date.strftime('%A, %B %d, %Y')}
- Time: {appointment.start_time.strftime('%I:%M %p')} - {appointment.end_time.strftime('%I:%M %p')}
- Consultation Fee: ₹{appointment.consultation_fee}

Preparation Notes:
- Please arrive 15 minutes prior to your scheduled slot.
- Bring any relevant prior medical records or prescriptions.

Manage or view your appointment anytime on your CarePulse dashboard.

Warm regards,
CarePulse Healthcare Team
"""
    try:
        sent = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[appointment.patient_email],
            fail_silently=False
        )
        return bool(sent)
    except Exception as e:
        logger.error(f"Failed to send confirmation email for {appointment.reference_no}: {e}")
        return False


def send_appointment_cancellation(appointment, reason=''):
    """Sends cancellation notice email to patient."""
    subject = f"Appointment Cancelled: {appointment.reference_no}"
    message = f"""Dear {appointment.patient_name},

Your appointment ({appointment.reference_no}) with {appointment.doctor.full_name} scheduled for {appointment.appointment_date.strftime('%B %d, %Y')} at {appointment.start_time.strftime('%I:%M %p')} has been cancelled.

Reason: {reason if reason else 'Cancelled per patient request'}

You can book a new appointment at your convenience by visiting our website.

Warm regards,
CarePulse Healthcare Team
"""
    try:
        sent = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[appointment.patient_email],
            fail_silently=False
        )
        return bool(sent)
    except Exception as e:
        logger.error(f"Failed to send cancellation email for {appointment.reference_no}: {e}")
        return False


def send_appointment_rescheduled(appointment, old_date, old_time):
    """Sends reschedule notice email to patient."""
    subject = f"Appointment Rescheduled: {appointment.reference_no}"
    message = f"""Dear {appointment.patient_name},

Your appointment has been successfully rescheduled.

Previous Slot:
- Date: {old_date}
- Time: {old_time}

New Appointment Details:
- Reference Number: {appointment.reference_no}
- Doctor: {appointment.doctor.full_name} ({appointment.doctor.specialty.name})
- Hospital / Clinic: {appointment.doctor.hospital_affiliation}
- New Date: {appointment.appointment_date.strftime('%A, %B %d, %Y')}
- New Time: {appointment.start_time.strftime('%I:%M %p')} - {appointment.end_time.strftime('%I:%M %p')}

Manage or view your appointment anytime on your CarePulse dashboard.

Warm regards,
CarePulse Healthcare Team
"""
    try:
        sent = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[appointment.patient_email],
            fail_silently=False
        )
        return bool(sent)
    except Exception as e:
        logger.error(f"Failed to send rescheduled email for {appointment.reference_no}: {e}")
        return False
