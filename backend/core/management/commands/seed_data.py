import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import Specialty, Doctor, DoctorSchedule, Appointment

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds database with realistic healthcare data: admin, patient, specialties, doctors, schedules, and appointments.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database seeding...")

        # 1. Admin User
        admin_user, created = User.objects.get_or_create(
            email='admin@hospital.com',
            defaults={
                'username': 'admin@hospital.com',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'phone': '+91 90000 00001'
            }
        )
        if created:
            admin_user.set_password('AdminPassword123!')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created admin user: admin@hospital.com / AdminPassword123!"))

        # 2. Sample Patient User
        patient_user, created = User.objects.get_or_create(
            email='patient@example.com',
            defaults={
                'username': 'patient@example.com',
                'first_name': 'Aarav',
                'last_name': 'Sharma',
                'role': 'patient',
                'phone': '+91 98765 43210',
                'city': 'Bangalore',
                'date_of_birth': datetime.date(1992, 5, 14),
                'blood_group': 'O+',
                'gender': 'male',
                'address': '42 Sunrise Enclave, Indiranagar, Bangalore'
            }
        )
        if created:
            patient_user.set_password('PatientPassword123!')
            patient_user.save()
            self.stdout.write(self.style.SUCCESS("Created sample patient: patient@example.com / PatientPassword123!"))

        # 3. Specialties
        specialties_data = [
            {
                'name': 'Cardiology',
                'slug': 'cardiology',
                'icon': 'HeartPulse',
                'description': 'Comprehensive heart care, preventive cardiology, angiography, and cardiovascular surgery.',
                'is_popular': True
            },
            {
                'name': 'Dermatology',
                'slug': 'dermatology',
                'icon': 'Sparkles',
                'description': 'Advanced medical dermatology, skin disease treatments, laser therapy, and clinical skincare.',
                'is_popular': True
            },
            {
                'name': 'Orthopedics',
                'slug': 'orthopedics',
                'icon': 'Bone',
                'description': 'Bone and joint care, robotic joint replacement, sports injury treatment, and spine therapy.',
                'is_popular': True
            },
            {
                'name': 'Pediatrics',
                'slug': 'pediatrics',
                'icon': 'Baby',
                'description': 'Compassionate healthcare for infants, children, and adolescents, including developmental care.',
                'is_popular': True
            },
            {
                'name': 'Neurology',
                'slug': 'neurology',
                'icon': 'Brain',
                'description': 'Diagnosis and treatment for disorders of the nervous system, brain, stroke, and epilepsy.',
                'is_popular': True
            },
            {
                'name': 'Dentistry',
                'slug': 'dentistry',
                'icon': 'Smile',
                'description': 'Preventive dental care, smile design, restorative orthodontics, and maxillofacial surgery.',
                'is_popular': True
            },
            {
                'name': 'General Medicine',
                'slug': 'general-medicine',
                'icon': 'Stethoscope',
                'description': 'Primary healthcare, chronic disease management, fever, infections, and executive health checks.',
                'is_popular': True
            },
            {
                'name': 'Gynecology',
                'slug': 'gynecology',
                'icon': 'Activity',
                'description': "Women's wellness, prenatal and postnatal care, fertility consulting, and laparoscopic surgeries.",
                'is_popular': True
            },
        ]

        specialty_map = {}
        for sp in specialties_data:
            s_obj, _ = Specialty.objects.get_or_create(slug=sp['slug'], defaults=sp)
            specialty_map[sp['slug']] = s_obj

        self.stdout.write(self.style.SUCCESS(f"Configured {len(specialty_map)} medical specialties."))

        # 4. Doctors
        doctors_data = [
            {
                'full_name': 'Dr. Priya V. Sharma',
                'specialty_slug': 'cardiology',
                'qualifications': 'MBBS, MD (Gen Med), DM (Cardiology), FACC',
                'experience_years': 16,
                'biography': 'Dr. Priya Sharma is a senior interventional cardiologist with over 16 years of clinical excellence. She specializes in complex coronary angioplasties, preventive cardiology, heart failure rehabilitation, and cardiac imaging.',
                'profile_image': 'https://images.unsplash.com/photo-1594824813512-881a79058b45?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'CarePulse Heart Institute & Research Centre',
                'consultation_fee': 850.00,
                'city': 'Bangalore',
                'address': '104 Healthcare Boulevard, Indiranagar, Bangalore',
                'is_featured': True,
                'rating': 4.95,
                'review_count': 184
            },
            {
                'full_name': 'Dr. Rajesh Mukherjee',
                'specialty_slug': 'orthopedics',
                'qualifications': 'MBBS, MS (Ortho), MCh (Ortho - UK), Fellowship in Robotic Joint Surgery',
                'experience_years': 19,
                'biography': 'Dr. Rajesh Mukherjee is an internationally trained orthopedic surgeon known for minimally invasive total knee and hip replacements, arthroscopic sports injury treatments, and trauma reconstruction.',
                'profile_image': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'Metro Bone & Joint Specialty Hospital',
                'consultation_fee': 900.00,
                'city': 'Bangalore',
                'address': '34 Ring Road, Koramangala 4th Block, Bangalore',
                'is_featured': True,
                'rating': 4.91,
                'review_count': 142
            },
            {
                'full_name': 'Dr. Ananya Sen',
                'specialty_slug': 'dermatology',
                'qualifications': 'MBBS, MD (Dermatology, Venereology & Leprosy)',
                'experience_years': 11,
                'biography': 'Dr. Ananya Sen is a consultant dermatologist focused on clinical dermatology, autoimmune skin disorders, acne management, and cosmetic laser treatments with evidence-based protocols.',
                'profile_image': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'SkinHealth Multispecialty Clinic',
                'consultation_fee': 700.00,
                'city': 'Bangalore',
                'address': '78 100ft Road, Defence Colony, Indiranagar, Bangalore',
                'is_featured': True,
                'rating': 4.88,
                'review_count': 98
            },
            {
                'full_name': 'Dr. Vikramaditya Joshi',
                'specialty_slug': 'neurology',
                'qualifications': 'MBBS, MD, DM (Neurology), Fellowship in Stroke (Harvard)',
                'experience_years': 15,
                'biography': 'Dr. Joshi is a renowned neurologist specializing in acute stroke intervention, neuromuscular disorders, Parkinson’s disease management, and refractory migraine care.',
                'profile_image': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'NeuroCare Institute of Medical Sciences',
                'consultation_fee': 1000.00,
                'city': 'Mumbai',
                'address': '12 Marine Lines Medical Enclave, Mumbai',
                'is_featured': True,
                'rating': 4.97,
                'review_count': 210
            },
            {
                'full_name': 'Dr. Neha Kapoor',
                'specialty_slug': 'pediatrics',
                'qualifications': 'MBBS, DCH, DNB (Pediatrics), MNAMS',
                'experience_years': 10,
                'biography': 'Dr. Neha Kapoor has dedicated her career to pediatric well-being, newborn care, developmental assessments, childhood allergy management, and adolescent healthcare.',
                'profile_image': 'https://images.unsplash.com/photo-1594824813512-881a79058b45?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'Little Angels Childrens Hospital',
                'consultation_fee': 600.00,
                'city': 'Delhi',
                'address': '45 Saket Institutional Area, New Delhi',
                'is_featured': True,
                'rating': 4.89,
                'review_count': 130
            },
            {
                'full_name': 'Dr. Sameer Patel',
                'specialty_slug': 'general-medicine',
                'qualifications': 'MBBS, MD (General Medicine)',
                'experience_years': 14,
                'biography': 'Dr. Sameer Patel is a compassionate physician experienced in adult disease diagnosis, diabetes mellitus, hypertension, lifestyle disorders, and geriatric health management.',
                'profile_image': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'CarePulse Super Specialty Hospital',
                'consultation_fee': 500.00,
                'city': 'Bangalore',
                'address': '124 Healthcare Avenue, Whitefield, Bangalore',
                'is_featured': False,
                'rating': 4.82,
                'review_count': 85
            },
            {
                'full_name': 'Dr. Rohini Deshmukh',
                'specialty_slug': 'gynecology',
                'qualifications': 'MBBS, MS (OBG), Fellowship in Minimal Access Surgery',
                'experience_years': 18,
                'biography': 'Dr. Rohini Deshmukh is an esteemed obstetrician and gynecologist specializing in high-risk pregnancies, operative hysteroscopy, laparoscopy, and reproductive endocrine health.',
                'profile_image': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'Matrika Mother & Child Healthcare',
                'consultation_fee': 800.00,
                'city': 'Pune',
                'address': '89 FC Road, Shivajinagar, Pune',
                'is_featured': True,
                'rating': 4.93,
                'review_count': 165
            },
            {
                'full_name': 'Dr. Siddharth Verma',
                'specialty_slug': 'dentistry',
                'qualifications': 'BDS, MDS (Prosthodontics & Implantology)',
                'experience_years': 12,
                'biography': 'Dr. Siddharth Verma is a distinguished dental surgeon specializing in advanced dental implants, cosmetic veneers, full-mouth oral rehabilitation, and painless root canal treatments.',
                'profile_image': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600',
                'hospital_affiliation': 'Apex Dental Care & Implant Center',
                'consultation_fee': 500.00,
                'city': 'Hyderabad',
                'address': '22 Jubilee Hills Road No. 36, Hyderabad',
                'is_featured': False,
                'rating': 4.86,
                'review_count': 92
            },
        ]

        created_doctors = []
        for d in doctors_data:
            sp = specialty_map[d.pop('specialty_slug')]
            doc, _ = Doctor.objects.get_or_create(
                full_name=d['full_name'],
                defaults={
                    'specialty': sp,
                    **d
                }
            )
            created_doctors.append(doc)

            # Create weekly schedules: Monday through Saturday (0 to 5)
            # 09:00 to 17:00, lunch break 13:00 to 14:00, 30 min slots
            for day in range(6):  # Mon-Sat
                DoctorSchedule.objects.get_or_create(
                    doctor=doc,
                    day_of_week=day,
                    defaults={
                        'start_time': datetime.time(9, 0),
                        'end_time': datetime.time(17, 0),
                        'slot_duration_minutes': 30,
                        'break_start_time': datetime.time(13, 0),
                        'break_end_time': datetime.time(14, 0),
                        'is_active': True
                    }
                )

        self.stdout.write(self.style.SUCCESS(f"Configured {len(created_doctors)} doctors with full weekly schedules."))

        # 5. Create initial synthetic appointments for sample patient
        today = timezone.localdate()
        doc1 = created_doctors[0]
        doc2 = created_doctors[1]
        doc3 = created_doctors[2]

        # Upcoming appointment 1
        upcoming_date1 = today + datetime.timedelta(days=2)
        # Make sure day is not Sunday (weekday < 6)
        if upcoming_date1.weekday() == 6:
            upcoming_date1 += datetime.timedelta(days=1)

        Appointment.objects.get_or_create(
            reference_no='APT-PREVIEW-01',
            defaults={
                'patient': patient_user,
                'doctor': doc1,
                'appointment_date': upcoming_date1,
                'start_time': datetime.time(10, 0),
                'end_time': datetime.time(10, 30),
                'consultation_fee': doc1.consultation_fee,
                'status': 'CONFIRMED',
                'patient_name': 'Aarav Sharma',
                'patient_email': patient_user.email,
                'patient_phone': patient_user.phone,
                'reason_for_visit': 'Routine cardiovascular health screening and blood pressure review.'
            }
        )

        # Upcoming appointment 2
        upcoming_date2 = today + datetime.timedelta(days=5)
        if upcoming_date2.weekday() == 6:
            upcoming_date2 += datetime.timedelta(days=1)

        Appointment.objects.get_or_create(
            reference_no='APT-PREVIEW-02',
            defaults={
                'patient': patient_user,
                'doctor': doc3,
                'appointment_date': upcoming_date2,
                'start_time': datetime.time(14, 30),
                'end_time': datetime.time(15, 0),
                'consultation_fee': doc3.consultation_fee,
                'status': 'CONFIRMED',
                'patient_name': 'Aarav Sharma',
                'patient_email': patient_user.email,
                'patient_phone': patient_user.phone,
                'reason_for_visit': 'Skin allergy consultation and evaluation.'
            }
        )

        # Past completed appointment
        past_date = today - datetime.timedelta(days=10)
        Appointment.objects.get_or_create(
            reference_no='APT-PREVIEW-03',
            defaults={
                'patient': patient_user,
                'doctor': doc2,
                'appointment_date': past_date,
                'start_time': datetime.time(11, 0),
                'end_time': datetime.time(11, 30),
                'consultation_fee': doc2.consultation_fee,
                'status': 'COMPLETED',
                'patient_name': 'Aarav Sharma',
                'patient_email': patient_user.email,
                'patient_phone': patient_user.phone,
                'reason_for_visit': 'Post-exercise knee joint stiffness checkup.'
            }
        )

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
