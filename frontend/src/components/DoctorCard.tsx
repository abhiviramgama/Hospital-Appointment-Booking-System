import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  Building
} from 'lucide-react';
import { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          
          {/* Doctor Image with fallback */}
          <div className="relative shrink-0">
            <img
              src={doctor.profile_image}
              alt={doctor.full_name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-brand-100 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback medical placeholder
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
              }}
            />
            <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full shadow-sm" title="Verified Medical Practitioner">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>

          {/* Core Doctor Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 truncate">
                {doctor.specialty_name || (typeof doctor.specialty === 'object' ? doctor.specialty.name : 'Specialist')}
              </span>

              {/* Rating */}
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="text-xs font-bold text-amber-900">{doctor.rating || 4.9}</span>
                <span className="text-[10px] text-amber-700">({doctor.review_count || 120})</span>
              </div>
            </div>

            <Link
              to={`/doctors/${doctor.id}`}
              className="mt-1.5 block text-lg font-bold text-slate-900 hover:text-brand-600 transition-colors truncate"
            >
              {doctor.full_name}
            </Link>

            <p className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5">
              {doctor.qualifications}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <Award className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span><strong>{doctor.experience_years}+ Years</strong> Experience</span>
            </div>
          </div>
        </div>

        {/* Hospital & Location info */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-700">{doctor.hospital_affiliation}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.city} &bull; {doctor.address}</span>
          </div>
        </div>

        {/* Next Available Slot Indicator */}
        <div className="mt-3.5 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span>Next Available:</span>
          </div>
          <span className="font-semibold text-brand-700">
            {doctor.next_available_slot
              ? `${doctor.next_available_slot.date} at ${doctor.next_available_slot.time}`
              : 'Available Tomorrow'}
          </span>
        </div>
      </div>

      {/* Card Footer: Consultation Fee & Actions */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Consultation Fee</span>
          <span className="text-lg font-bold text-slate-900">
            ₹{Number(doctor.consultation_fee).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/doctors/${doctor.id}`}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            View Profile
          </Link>
          <button
            onClick={() => navigate(`/book?doctor_id=${doctor.id}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Slot
          </button>
        </div>
      </div>
    </div>
  );
};
