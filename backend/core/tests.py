import datetime
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Specialty, Doctor, DoctorSchedule, Appointment

User = get_user_model()


class HospitalPlatformBackendTests(APITestCase):

    def setUp(self):
        # Create Patient
        self.patient_password = 'TestPassword123!'
        self.patient = User.objects.create_user(
            email='patient_test@example.com',
            password=self.patient_password,
            first_name='John',
            last_name='Doe',
            phone='+91 99999 88888',
            role='patient'
        )

        # Create Second Patient
        self.patient2 = User.objects.create_user(
            email='other_patient@example.com',
            password=self.patient_password,
            first_name='Alice',
            last_name='Smith',
            phone='+91 77777 66666',
            role='patient'
        )

        # Create Admin
        self.admin = User.objects.create_superuser(
            email='admin_test@hospital.com',
            password=self.patient_password,
            first_name='Super',
            last_name='Admin',
            role='admin'
        )

        # Create Specialty
        self.specialty = Specialty.objects.create(
            name='Cardiology',
            slug='cardiology',
            icon='HeartPulse',
            description='Cardiovascular health'
        )

        # Create Doctor
        self.doctor = Doctor.objects.create(
            full_name='Dr. Test Heart Specialist',
            specialty=self.specialty,
            qualifications='MBBS, MD',
            experience_years=12,
            biography='Expert cardiologist',
            hospital_affiliation='City Heart Clinic',
            consultation_fee=750.00,
            city='Bangalore',
            address='10 Central St',
            is_active=True,
            rating=4.9
        )

        # Create doctor schedule for all days 09:00 - 17:00, break 13:00 - 14:00
        for day in range(7):
            DoctorSchedule.objects.create(
                doctor=self.doctor,
                day_of_week=day,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(17, 0),
                slot_duration_minutes=30,
                break_start_time=datetime.time(13, 0),
                break_end_time=datetime.time(14, 0),
                is_active=True
            )

    # 1. Registration & Login
    def test_patient_registration_and_login(self):
        # Registration
        reg_url = reverse('auth-register')
        reg_data = {
            'first_name': 'Sarah',
            'last_name': 'Connor',
            'email': 'sarah@example.com',
            'phone': '+91 98888 77777',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'terms_accepted': True
        }
        res = self.client.post(reg_url, reg_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['email'], 'sarah@example.com')

        # Login
        login_url = reverse('auth-login')
        login_data = {
            'email': 'sarah@example.com',
            'password': 'SecurePassword123!'
        }
        res = self.client.post(login_url, login_data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_registration_validation_errors(self):
        reg_url = reverse('auth-register')
        # Mismatched password
        res = self.client.post(reg_url, {
            'first_name': 'A',
            'last_name': 'B',
            'email': 'badpass@example.com',
            'password': 'Password123!',
            'confirm_password': 'DifferentPassword123!',
            'terms_accepted': True
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', res.data)

        # Unaccepted terms
        res = self.client.post(reg_url, {
            'first_name': 'A',
            'last_name': 'B',
            'email': 'noterms@example.com',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'terms_accepted': False
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # 2. Doctor Search and Filtering
    def test_doctor_search_and_filtering(self):
        url = reverse('doctor-list')
        # Search by name
        res = self.client.get(url, {'search': 'Heart'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0]['full_name'], 'Dr. Test Heart Specialist')

        # Filter by specialty
        res = self.client.get(url, {'specialty': 'cardiology'})
        results = res.data.get('results', res.data)
        self.assertTrue(len(results) >= 1)

        # Filter by non-existent specialty
        res = self.client.get(url, {'specialty': 'non-existent'})
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 0)

    # 3. Doctor Availability Generation
    def test_doctor_availability_slots(self):
        target_date = timezone.localdate() + datetime.timedelta(days=1)
        url = reverse('doctor-availability', kwargs={'pk': self.doctor.pk})
        res = self.client.get(url, {'date': target_date.strftime('%Y-%m-%d')})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('slots', res.data)
        self.assertTrue(len(res.data['slots']) > 0)

        # Ensure break time (13:00 - 14:00) is marked not available
        break_slots = [s for s in res.data['slots'] if s['start_time'] == '13:00']
        if break_slots:
            self.assertFalse(break_slots[0]['is_available'])
            self.assertEqual(break_slots[0]['reason'], 'Break')

    # 4. Successful Appointment Booking & Double-Booking Prevention
    def test_appointment_booking_and_double_booking_prevention(self):
        self.client.force_authenticate(user=self.patient)
        target_date = timezone.localdate() + datetime.timedelta(days=3)

        book_url = reverse('appointment-create')
        book_data = {
            'doctor_id': self.doctor.id,
            'appointment_date': target_date.strftime('%Y-%m-%d'),
            'start_time': '10:00:00',
            'patient_name': 'John Doe',
            'patient_email': 'patient_test@example.com',
            'patient_phone': '+91 99999 88888',
            'reason_for_visit': 'Chest tightness'
        }

        # First booking succeeds
        res = self.client.post(book_url, book_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('reference_no', res.data)
        ref_no = res.data['reference_no']
        self.assertEqual(res.data['status'], 'CONFIRMED')

        # Second booking for SAME doctor & date & time must fail
        self.client.force_authenticate(user=self.patient2)
        res_conflict = self.client.post(book_url, book_data)
        self.assertEqual(res_conflict.status_code, status.HTTP_400_BAD_REQUEST)

    # 5. Cancelling an Appointment releases the slot
    def test_cancel_appointment_and_release_slot(self):
        self.client.force_authenticate(user=self.patient)
        target_date = timezone.localdate() + datetime.timedelta(days=4)

        # Create appointment
        app = Appointment.objects.create(
            reference_no='APT-CANCEL-TEST',
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=target_date,
            start_time=datetime.time(11, 0),
            end_time=datetime.time(11, 30),
            consultation_fee=750.00,
            status='CONFIRMED',
            patient_name='John Doe',
            patient_email=self.patient.email,
            patient_phone=self.patient.phone
        )

        cancel_url = reverse('appointment-cancel', kwargs={'pk': app.pk})
        res = self.client.post(cancel_url, {'reason': 'Doctor conflict'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        app.refresh_from_db()
        self.assertEqual(app.status, 'CANCELLED')
        self.assertIsNotNone(app.cancelled_at)

        # Another patient should now be able to book the released slot
        self.client.force_authenticate(user=self.patient2)
        book_url = reverse('appointment-create')
        res_new_booking = self.client.post(book_url, {
            'doctor_id': self.doctor.id,
            'appointment_date': target_date.strftime('%Y-%m-%d'),
            'start_time': '11:00:00',
            'patient_name': 'Alice Smith',
            'patient_email': self.patient2.email,
            'patient_phone': self.patient2.phone,
            'reason_for_visit': 'General consultation'
        })
        self.assertEqual(res_new_booking.status_code, status.HTTP_201_CREATED)

    # 6. Rescheduling an appointment
    def test_reschedule_appointment(self):
        self.client.force_authenticate(user=self.patient)
        target_date = timezone.localdate() + datetime.timedelta(days=4)
        new_date = timezone.localdate() + datetime.timedelta(days=5)

        app = Appointment.objects.create(
            reference_no='APT-RESCHEDULE-TEST',
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=target_date,
            start_time=datetime.time(14, 0),
            end_time=datetime.time(14, 30),
            consultation_fee=750.00,
            status='CONFIRMED',
            patient_name='John Doe',
            patient_email=self.patient.email,
            patient_phone=self.patient.phone
        )

        reschedule_url = reverse('appointment-reschedule', kwargs={'pk': app.pk})
        res = self.client.post(reschedule_url, {
            'new_date': new_date.strftime('%Y-%m-%d'),
            'new_start_time': '15:00:00'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        app.refresh_from_db()
        self.assertEqual(app.appointment_date, new_date)
        self.assertEqual(app.start_time, datetime.time(15, 0))

    # 7. Privacy: Patient cannot access or cancel another patient's appointment
    def test_patient_cannot_access_other_patient_appointment(self):
        app = Appointment.objects.create(
            reference_no='APT-SECRET-01',
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.localdate() + datetime.timedelta(days=6),
            start_time=datetime.time(9, 30),
            end_time=datetime.time(10, 0),
            consultation_fee=750.00,
            status='CONFIRMED',
            patient_name='John Doe',
            patient_email=self.patient.email,
            patient_phone=self.patient.phone
        )

        # Authenticate as patient 2
        self.client.force_authenticate(user=self.patient2)
        detail_url = reverse('appointment-detail', kwargs={'pk': app.pk})
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Cancel attempt should also be forbidden
        cancel_url = reverse('appointment-cancel', kwargs={'pk': app.pk})
        res_cancel = self.client.post(cancel_url, {'reason': 'Malicious attempt'})
        self.assertEqual(res_cancel.status_code, status.HTTP_403_FORBIDDEN)

    # 8. Admin-only endpoints
    def test_admin_dashboard_permissions(self):
        admin_url = reverse('admin-dashboard')

        # Anonymous -> 401
        self.client.logout()
        res = self.client.get(admin_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Patient -> 403
        self.client.force_authenticate(user=self.patient)
        res = self.client.get(admin_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin -> 200
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(admin_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_appointments', res.data)
        self.assertIn('total_revenue', res.data)
