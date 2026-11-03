import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  User,
  ArrowRight,
  Printer,
  Mail,
  Share2,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';
import { Appointment } from '../types';

export const BookingConfirmationPage: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(
    (location.state as any)?.appointment || null
  );
  const [loading, setLoading] = useState(!appointment);

  useEffect(() => {
    if (!appointment && ref) {
      // Fetch appointment by reference or id
      const fetchApp = async () => {
        try {
          // Check user appointments to find matching reference
          const res = await api.get('/appointments/my/');
          const apps = res.data.results || res.data;
          const matched = apps.find((a: Appointment) => a.reference_no === ref);
          if (matched) {
            setAppointment(matched);
          }
        } catch (err) {
          console.error('Failed to load appointment details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchApp();
    }
  }, [ref, appointment]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 mt-4">Generating your appointment slip...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Success Badge Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-4 border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Appointment Confirmed!
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Your hospital consultation slot has been reserved. A confirmation email has been dispatched.
        </p>
      </div>

      {/* Appointment Slip Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6">
        
        {/* Reference header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Appointment Reference No.</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-brand-700 tracking-wider">
              {appointment?.reference_no || ref}
            </span>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            CONFIRMED
          </span>
        </div>

        {/* Doctor Information */}
        <div className="flex items-start gap-4">
          <img
            src={appointment?.doctor_image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'}
            alt="Doctor"
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
              {appointment?.doctor_specialty || 'Medical Specialist'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{appointment?.doctor_name}</h3>
            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {appointment?.doctor_hospital}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{appointment?.doctor_address}</p>
          </div>
        </div>

        {/* Date, Time, Fee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Consultation Date</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              {appointment?.appointment_date}
            </p>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Consultation Time</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              {appointment?.start_time} - {appointment?.end_time}
            </p>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Consultation Fee</span>
            <p className="font-extrabold text-slate-900 text-base mt-0.5">
              ₹{appointment?.consultation_fee ? Number(appointment.consultation_fee).toLocaleString('en-IN') : '--'}
            </p>
          </div>
        </div>

        {/* Patient Details Snapshot */}
        <div className="pt-2 text-xs space-y-2 border-t border-slate-100">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
            Patient Information
          </span>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="text-slate-400">Patient Name:</span>{' '}
              <strong className="text-slate-800">{appointment?.patient_name}</strong>
            </div>
            <div>
              <span className="text-slate-400">Mobile:</span>{' '}
              <strong className="text-slate-800">{appointment?.patient_phone}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Confirmation Sent To:</span>{' '}
              <strong className="text-slate-800">{appointment?.patient_email}</strong>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-2xl bg-medical-50/60 border border-medical-200 text-xs text-medical-900 space-y-1">
          <p className="font-bold">Next Steps for Consultation:</p>
          <ul className="list-disc list-inside space-y-0.5 text-medical-800 text-[11px]">
            <li>Please arrive at the clinic desk 15 minutes before your scheduled slot.</li>
            <li>Present this reference number (<strong>{appointment?.reference_no || ref}</strong>) at reception.</li>
            <li>You can reschedule or cancel this visit anytime via your patient dashboard.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Print Slip
          </button>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all"
            >
              View in Patient Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
