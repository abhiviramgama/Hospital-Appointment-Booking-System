import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Lock,
  Loader2
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Doctor, Specialty } from '../types';
import { SlotPicker } from '../components/SlotPicker';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Wizard step: 1 = Doctor & Slot, 2 = Patient Details, 3 = Review & Confirm
  const [step, setStep] = useState<number>(1);

  // Doctors list for doctor selection
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(
    searchParams.get('doctor_id') ? Number(searchParams.get('doctor_id')) : null
  );
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Selected date & slot
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get('date') || '');
  const [selectedSlot, setSelectedSlot] = useState<string>(searchParams.get('slot') || '');

  // Patient details form
  const [patientName, setPatientName] = useState<string>(user?.full_name || '');
  const [patientEmail, setPatientEmail] = useState<string>(user?.email || '');
  const [patientPhone, setPatientPhone] = useState<string>(user?.phone || '');
  const [patientDob, setPatientDob] = useState<string>(user?.date_of_birth || '');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-fill user data when user logs in or is authenticated
  useEffect(() => {
    if (user) {
      if (!patientName) setPatientName(user.full_name || `${user.first_name} ${user.last_name}`.trim());
      if (!patientEmail) setPatientEmail(user.email);
      if (!patientPhone && user.phone) setPatientPhone(user.phone);
      if (!patientDob && user.date_of_birth) setPatientDob(user.date_of_birth);
    }
  }, [user]);

  // Fetch doctors for selector
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors/');
        const docs = res.data.results || res.data;
        setDoctors(docs);
        if (selectedDoctorId) {
          const doc = docs.find((d: Doctor) => d.id === selectedDoctorId);
          if (doc) setSelectedDoctor(doc);
        } else if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
          setSelectedDoctor(docs[0]);
        }
      } catch (err) {
        console.error('Failed to load doctors list:', err);
      }
    };

    fetchDoctors();
  }, [selectedDoctorId]);

  const handleDoctorChange = (id: number) => {
    setSelectedDoctorId(id);
    const doc = doctors.find((d) => d.id === id) || null;
    setSelectedDoctor(doc);
    setSelectedSlot('');
  };

  const handleSlotSelected = (slot: string, date: string) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
    setFormError(null);
  };

  const validateStep1 = () => {
    if (!selectedDoctor) {
      setFormError('Please select a doctor.');
      return false;
    }
    if (!selectedDate || !selectedSlot) {
      setFormError('Please select an appointment date and an available time slot.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!patientName.trim()) {
      setFormError('Patient full name is required.');
      return false;
    }
    if (!patientEmail.trim() || !patientEmail.includes('@')) {
      setFormError('A valid patient email address is required for confirmations.');
      return false;
    }
    if (!patientPhone.trim()) {
      setFormError('Patient mobile number is required.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      if (!isAuthenticated) {
        // Save current selection to session and route to login
        sessionStorage.setItem('pending_booking', JSON.stringify({
          doctor_id: selectedDoctor?.id,
          date: selectedDate,
          slot: selectedSlot
        }));
        navigate(`/login?redirect=/book&doctor_id=${selectedDoctor?.id}&date=${selectedDate}&slot=${selectedSlot}`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        start_time: selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot,
        patient_name: patientName.trim(),
        patient_email: patientEmail.trim(),
        patient_phone: patientPhone.trim(),
        patient_dob: patientDob || null,
        reason_for_visit: reasonForVisit.trim(),
      };

      const res = await api.post('/appointments/', payload);
      const appointment = res.data;

      // Navigate to confirmation page
      navigate(`/confirmation/${appointment.reference_no}`, {
        state: { appointment }
      });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.start_time ||
        err.response?.data?.appointment_date ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Unable to confirm appointment. The requested slot may have just been booked. Please choose another slot.';
      setFormError(Array.isArray(errorMsg) ? errorMsg[0] : String(errorMsg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Book Doctor Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Fast, verified, and hassle-free outpatient consultation booking.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
        <div className="grid grid-cols-3 text-center gap-2">
          
          <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold ${
            step >= 1 ? 'bg-brand-50 text-brand-700' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>1</span>
            <span>Doctor & Time</span>
          </div>

          <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold ${
            step >= 2 ? 'bg-brand-50 text-brand-700' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>2</span>
            <span>Patient Info</span>
          </div>

          <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold ${
            step >= 3 ? 'bg-brand-50 text-brand-700' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>3</span>
            <span>Review & Book</span>
          </div>
        </div>
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Doctor & Slot Selection */}
      {step === 1 && (
        <div className="space-y-6">
          
          {/* Doctor Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step 1: Choose Doctor
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleDoctorChange(doc.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3.5 transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={doc.profile_image}
                      alt={doc.full_name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.full_name}</p>
                      <p className="text-[11px] text-brand-700 font-medium truncate">
                        {doc.specialty_name || (typeof doc.specialty === 'object' ? doc.specialty.name : 'Specialist')}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        ₹{doc.consultation_fee} &bull; {doc.city}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slot Picker for Selected Doctor */}
          {selectedDoctor && (
            <div>
              <SlotPicker
                doctorId={selectedDoctor.id}
                initialDate={selectedDate}
                selectedSlot={selectedSlot}
                onSlotSelected={handleSlotSelected}
              />
            </div>
          )}

          {/* Step 1 Actions */}
          <div className="flex items-center justify-between pt-4">
            <Link
              to="/doctors"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              &larr; Browse All Doctors
            </Link>
            <button
              onClick={handleNextStep}
              disabled={!selectedDoctor || !selectedSlot}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all"
            >
              Continue to Patient Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Patient Details */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2: Patient Details</h3>
              <p className="text-xs text-slate-500">
                Please enter the details of the person attending the consultation.
              </p>
            </div>
            {isAuthenticated && (
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                Logged in as {user?.email}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address * (For Confirmation & Updates)
              </label>
              <input
                type="email"
                required
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth (Optional)
              </label>
              <input
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Visit or Symptoms (Optional)
              </label>
              <textarea
                rows={3}
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                placeholder="Briefly describe what you'd like to consult the doctor for..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Time Selection
            </button>
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20"
            >
              Review Booking
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Final Confirmation */}
      {step === 3 && selectedDoctor && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Step 3: Review Appointment Summary</h3>
            <p className="text-xs text-slate-500">
              Please double check all appointment parameters before final confirmation.
            </p>
          </div>

          {/* Doctor & Clinic Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <img
              src={selectedDoctor.profile_image}
              alt={selectedDoctor.full_name}
              className="w-16 h-16 rounded-2xl object-cover border border-brand-100 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-full">
                {selectedDoctor.specialty_name || (typeof selectedDoctor.specialty === 'object' ? selectedDoctor.specialty.name : 'Doctor')}
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">{selectedDoctor.full_name}</h4>
              <p className="text-xs text-slate-500">{selectedDoctor.qualifications}</p>
              <p className="text-xs text-slate-700 font-medium mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {selectedDoctor.hospital_affiliation} &bull; {selectedDoctor.address}
              </p>
            </div>
          </div>

          {/* Appointment Schedule & Patient Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Date & Time
              </span>
              <p className="text-slate-800 font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                {selectedDate}
              </p>
              <p className="text-slate-800 font-bold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                {selectedSlot} (In-Person Consultation)
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Patient Information
              </span>
              <p className="text-slate-800 font-bold">{patientName}</p>
              <p className="text-slate-600">{patientEmail}</p>
              <p className="text-slate-600">{patientPhone}</p>
              {reasonForVisit && (
                <p className="text-slate-500 italic mt-1 line-clamp-1">"{reasonForVisit}"</p>
              )}
            </div>
          </div>

          {/* Consultation Fee Breakdown */}
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-brand-900 block">Total Consultation Fee</span>
              <span className="text-[11px] text-brand-700">Pay directly at hospital reception desk during visit</span>
            </div>
            <span className="text-2xl font-black text-brand-900">
              ₹{Number(selectedDoctor.consultation_fee).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Trust notice */}
          <div className="text-[11px] text-slate-500 flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Instant booking confirmation will be sent to <strong>{patientEmail}</strong> with calendar invite.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              disabled={submitting}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> Edit Patient Details
            </button>
            <button
              disabled={submitting}
              onClick={handleConfirmBooking}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/25 disabled:opacity-50 transition-all"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Confirming with Hospital...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
