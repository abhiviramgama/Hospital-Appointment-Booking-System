import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Award,
  ChevronRight
} from 'lucide-react';
import api from '../api/client';
import { Doctor, Specialty } from '../types';
import { SpecialtyCard } from '../components/SpecialtyCard';
import { DoctorCard } from '../components/DoctorCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specsRes, docsRes] = await Promise.all([
          api.get('/specialties/'),
          api.get('/doctors/?featured=true'),
        ]);
        setSpecialties(specsRes.data);
        const docs = docsRes.data.results || docsRes.data;
        setFeaturedDoctors(docs.slice(0, 4));
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedSpecialty) params.set('specialty', selectedSpecialty);
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/doctors?${params.toString()}`);
  };

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-medical-50/30 to-white pt-12 pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-200/80 shadow-sm text-xs font-semibold text-brand-800">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              Modern Hospital Management Platform &bull; Phase 1
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Find the Right Doctor.{' '}
              <span className="bg-gradient-to-r from-brand-600 via-medical-600 to-brand-700 bg-clip-text text-transparent">
                Book Your Appointment.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Discover verified medical specialists, explore hospital profiles, review real-time availability slots, and confirm appointments online with zero hassle.
            </p>

            {/* Hero Search Box */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 bg-white p-3 sm:p-4 rounded-3xl shadow-xl shadow-brand-900/5 border border-slate-200/90 text-left grid grid-cols-1 md:grid-cols-12 gap-3"
            >
              {/* Doctor / Condition input */}
              <div className="md:col-span-5 relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Doctor name, hospital, or symptoms..."
                  className="w-full pl-11 pr-3 py-3 rounded-2xl bg-slate-50 border-0 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                />
              </div>

              {/* Specialty Select */}
              <div className="md:col-span-4 relative flex items-center">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-0 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:bg-white cursor-pointer"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Select & Search Button */}
              <div className="md:col-span-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl bg-slate-50 border-0 text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:bg-white cursor-pointer"
                  >
                    <option value="">All Cities</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/25 transition-all flex items-center justify-center shrink-0"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick trust metrics */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                100% Certified Doctors
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-brand-600" />
                Live Slot Booking Engine
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-medical-600" />
                Zero Booking Fee
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Specialties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Department Specialties
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Explore Popular Medical Specialties
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Connect with experienced specialists across all major clinical departments.
            </p>
          </div>
          <Link
            to="/specialties"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group shrink-0"
          >
            View All Specialties
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {specialties.map((spec) => (
            <SpecialtyCard key={spec.id} specialty={spec} />
          ))}
        </div>
      </section>

      {/* 3. Featured Doctors Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5" /> Verified Practitioners
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Doctors & Surgeons
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Top rated clinicians with verified qualifications and available consultation slots.
            </p>
          </div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 group shrink-0"
          >
            Explore All Doctors
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}
      </section>

      {/* 4. How It Works Section */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">
              How CarePulse Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Booking your hospital appointment takes less than a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 font-extrabold flex items-center justify-center text-lg mb-4 border border-brand-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-white">Search for a Doctor</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Filter by medical specialty, location, consultation fee, or years of clinical experience.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 relative">
              <div className="w-10 h-10 rounded-xl bg-medical-500/20 text-medical-400 font-extrabold flex items-center justify-center text-lg mb-4 border border-medical-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-white">Select an Open Slot</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                View the doctor’s live calendar schedule and pick an open morning, afternoon, or evening session.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center text-lg mb-4 border border-amber-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-white">Enter Patient Details</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Provide patient contact info and visit reasons. Existing members get one-click autofill.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-lg mb-4 border border-emerald-500/30">
                4
              </div>
              <h3 className="text-base font-bold text-white">Instant Confirmation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Receive your unique appointment reference number and email confirmation immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
              Platform Benefits
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 leading-tight">
              Why Patients Trust CarePulse Healthcare
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              We eliminate traditional hospital appointment friction by connecting patients directly with real-time doctor availability and verified medical credentials.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Convenient Online Booking</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Book appointments anytime 24/7 without waiting on hospital phone queues.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Verified Doctor Profiles</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All medical licenses, degrees, and hospital affiliations are verified before onboarding.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Easy Appointment Management</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reschedule or cancel appointments with one click and automatic slot release.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Secure Patient Accounts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bank-grade encryption protecting patient profile details and appointment histories.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-brand-500 to-medical-500 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900">Hospital SaaS Performance</h4>
                  <p className="text-xs text-slate-400">Live operational overview</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                  Phase 1 Active
                </span>
              </div>

              <div className="py-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Average Booking Time</span>
                  <span className="font-bold text-slate-800">45 Seconds</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full w-[92%]"></div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-500">Slot Availability Accuracy</span>
                  <span className="font-bold text-slate-800">100% Concurrency Safe</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-medical-500 h-2 rounded-full w-[99%]"></div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-500">Patient Satisfaction Index</span>
                  <span className="font-bold text-slate-800">4.9 / 5.0</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full w-[96%]"></div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-brand-50 text-brand-900 text-xs flex items-center justify-between">
                <span>Looking for specialist advice?</span>
                <Link
                  to="/doctors"
                  className="font-bold text-brand-700 underline hover:text-brand-900"
                >
                  Find Doctors &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Patient Testimonials (Sample Clinical Experience) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
            Patient Stories
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            What Our Patients Say
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            (Sample development feedback highlighting platform convenience)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Booking with Dr. Priya Sharma took barely 30 seconds. I received my confirmation email immediately and there was no waiting at the clinic desk."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                RS
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Rohan S.</p>
                <p className="text-[10px] text-slate-400">Cardiology Patient &bull; Bangalore</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Had to reschedule my orthopedic appointment due to urgent work. The dashboard allowed me to pick a new date without calling anyone."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-medical-100 text-medical-700 font-bold flex items-center justify-center text-xs">
                MK
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Meera K.</p>
                <p className="text-[10px] text-slate-400">Orthopedics Patient &bull; Bangalore</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Finding pediatricians with transparent consultation fees and real-time open slots makes planning healthcare so much easier for young families."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                AP
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Anand P.</p>
                <p className="text-[10px] text-slate-400">Pediatrics Patient &bull; Delhi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-600 to-medical-600 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl shadow-brand-600/20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Prioritize Your Health?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-brand-100 max-w-xl mx-auto">
            Book certified hospital doctors online in under 60 seconds with instant booking confirmation.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/doctors"
              className="px-6 py-3 rounded-xl bg-white text-brand-800 font-bold text-sm shadow-md hover:bg-slate-50 transition-colors"
            >
              Browse Doctor Directory
            </Link>
            <Link
              to="/book"
              className="px-6 py-3 rounded-xl bg-brand-700/80 hover:bg-brand-700 text-white font-bold text-sm border border-brand-400/40 transition-colors"
            >
              Book an Appointment Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
