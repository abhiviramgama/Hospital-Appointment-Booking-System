import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Phone,
  Mail,
  MapPin,
  Shield,
  Heart,
  Calendar,
  Clock
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-medical-500 flex items-center justify-center text-white shadow-md">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-white">
                  Care<span className="text-brand-400">Pulse</span>
                </span>
                <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-brand-300 border border-slate-700">
                  HOSPITAL SAAS
                </span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              CarePulse is a modern, unified hospital appointment booking platform. Discover certified medical specialists, check live clinic schedules, and reserve outpatient consultations with zero waiting hassle.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-brand-400" />
              <span>Compliant with Indian Healthcare Data Protection Guidelines</span>
            </div>
          </div>

          {/* Patient Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Patients</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/doctors" className="hover:text-brand-400 transition-colors">Find Doctors</Link>
              </li>
              <li>
                <Link to="/specialties" className="hover:text-brand-400 transition-colors">Specialties Directory</Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-brand-400 transition-colors">Book Appointment</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-brand-400 transition-colors">Patient Dashboard</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">Patient Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Medical Specialties */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Specialties</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/doctors?specialty=cardiology" className="hover:text-brand-400 transition-colors">Cardiology</Link>
              </li>
              <li>
                <Link to="/doctors?specialty=dermatology" className="hover:text-brand-400 transition-colors">Dermatology</Link>
              </li>
              <li>
                <Link to="/doctors?specialty=orthopedics" className="hover:text-brand-400 transition-colors">Orthopedics</Link>
              </li>
              <li>
                <Link to="/doctors?specialty=pediatrics" className="hover:text-brand-400 transition-colors">Pediatrics</Link>
              </li>
              <li>
                <Link to="/doctors?specialty=neurology" className="hover:text-brand-400 transition-colors">Neurology</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Support</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>104 Healthcare Blvd, Whitefield, Bangalore, Karnataka</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+91 (080) 4000-8800</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>support@carepulse-hospital.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Mon - Sat: 8:00 AM - 8:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Emergency Notice & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-amber-400 bg-amber-950/40 border border-amber-900/50 px-3 py-1.5 rounded-lg max-w-xl">
            <Heart className="w-4 h-4 shrink-0" />
            <span>Emergency Note: For life-threatening emergencies, please call 112 or visit the nearest hospital emergency room.</span>
          </div>

          <div className="flex items-center gap-6">
            <span>&copy; {new Date().getFullYear()} CarePulse Health Systems. All rights reserved.</span>
            <Link to="/about" className="hover:text-white">Privacy Policy</Link>
            <Link to="/about" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
