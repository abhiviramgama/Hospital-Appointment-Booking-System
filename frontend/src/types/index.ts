export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: UserRole;
  date_of_birth?: string | null;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
  address?: string;
  city?: string;
  is_staff?: boolean;
}

export interface Specialty {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  is_popular: boolean;
  doctor_count: number;
}

export interface DoctorSchedule {
  id: number;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time?: string | null;
  break_end_time?: string | null;
  is_active: boolean;
}

export interface WorkingDayInfo {
  day: string;
  hours: string;
  slot_duration: number;
}

export interface Doctor {
  id: number;
  full_name: string;
  specialty: number | Specialty;
  specialty_name?: string;
  specialty_slug?: string;
  qualifications: string;
  experience_years: number;
  biography?: string;
  profile_image: string;
  hospital_affiliation: string;
  consultation_fee: string | number;
  city: string;
  address: string;
  consultation_type: string;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  next_available_slot?: {
    date: string;
    time: string;
  } | null;
  schedules?: DoctorSchedule[];
  working_days?: WorkingDayInfo[];
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
}

export interface DoctorAvailability {
  doctor_id: number;
  doctor_name: string;
  date: string;
  day_name: string;
  slots: TimeSlot[];
  available_count: number;
}

export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Appointment {
  id: number;
  reference_no: string;
  patient: number;
  doctor: number;
  doctor_name: string;
  doctor_specialty: string;
  doctor_hospital: string;
  doctor_address: string;
  doctor_image: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  consultation_fee: string | number;
  status: AppointmentStatus;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_dob?: string | null;
  reason_for_visit?: string;
  cancellation_reason?: string;
  cancelled_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AdminStats {
  total_appointments: number;
  today_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  active_doctors: number;
  total_patients: number;
  specialties_count: number;
  total_revenue: number;
  recent_bookings: Appointment[];
}
