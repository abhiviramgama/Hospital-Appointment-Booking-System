import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  ArrowLeft,
  Share2,
  ShieldAlert,
  Stethoscope,
  Briefcase
} from 'lucide-react';
import api from '../api/client';
import { Doctor } from '../types';
import { SlotPicker } from '../components/SlotPicker';

export const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${id}/`);
        setDoctor(res.data);
      } catch (err) {
        console.error('Failed to load doctor profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  const handleSlotSelected = (slot: string, date: string) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
  };

  const handleProceedToBooking = () => {
    if (!doctor) return;
    const params = new URLSearchParams();
    params.set('doctor_id', String(doctor.id));
    if (selectedDate) params.set('date', selectedDate);
    if (selectedSlot) params.set('slot', selectedSlot);
    navigate(`/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-4">Loading clinician profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Doctor Profile Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested medical professional may be inactive or does not exist.
        </p>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
        </Link>
      </div>
    );
  }

  const specialtyName =
    typeof doctor.specialty === 'object' ? doctor.specialty.name : doctor.specialty_name || 'Specialist';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>

      {/* Doctor Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          
          {/* Portrait */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <img
              src={doctor.profile_image}
              alt={doctor.full_name}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl object-cover border-4 border-brand-50 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
              }}
            />
            <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-md" title="Verified Medical License">
              <CheckCircle2 className="w-5 h-5 stroke-[3]" />
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wide">
                {specialtyName}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Profile
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {doctor.full_name}
            </h1>

            <p className="text-sm font-semibold text-slate-600">
              {doctor.qualifications}
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-brand-600" />
                <span><strong>{doctor.experience_years}+ Years</strong> Experience</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-brand-600" />
                <span>{doctor.hospital_affiliation}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>{doctor.city}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-bold">{doctor.rating}</span>
                <span className="text-[10px] text-amber-700">({doctor.review_count} Reviews)</span>
              </div>
            </div>
          </div>

          {/* Fee & Action Box */}
          <div className="w-full md:w-64 bg-slate-50 rounded-2xl p-5 border border-slate-200 shrink-0 text-center md:text-left space-y-3">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Consultation Fee</span>
              <span className="text-2xl font-black text-slate-900">
                ₹{Number(doctor.consultation_fee).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Per outpatient visit</span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span>Mode:</span>
                <span className="font-semibold text-slate-800 capitalize">{doctor.consultation_type || 'In-Person'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Wait Time:</span>
                <span className="font-semibold text-slate-800">&lt; 15 Mins</span>
              </div>
            </div>

            <button
              onClick={handleProceedToBooking}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Bio & Schedule, Right Live Slot Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Biography & Schedule */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Biography */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-brand-600" />
              Professional Biography
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {doctor.biography}
            </p>
          </div>

          {/* Hospital Address & Clinic Info */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              Hospital Affiliation & Location
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <p className="font-bold text-slate-800 text-sm">{doctor.hospital_affiliation}</p>
              <p className="text-slate-600">{doctor.address}</p>
              <p className="text-slate-500 font-medium">City: {doctor.city}, India</p>
            </div>
          </div>

          {/* Working Days & Hours Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Weekly Clinic Hours
            </h3>

            {doctor.working_days && doctor.working_days.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {doctor.working_days.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{item.day}</span>
                    <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium">
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Regular clinic hours: Monday to Saturday (9:00 AM - 5:00 PM).</p>
            )}
          </div>
        </div>

        {/* Right Column: Live Slot Picker */}
        <div className="lg:col-span-5 space-y-4">
          <SlotPicker
            doctorId={doctor.id}
            selectedSlot={selectedSlot}
            onSlotSelected={handleSlotSelected}
          />

          {selectedSlot && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-brand-700 block font-medium">Selected Slot</span>
                <span className="text-sm font-bold text-brand-900">
                  {selectedDate} at {selectedSlot}
                </span>
              </div>
              <button
                onClick={handleProceedToBooking}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Proceed to Book &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
