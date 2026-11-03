import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Edit3,
  Building,
  PlusCircle,
  Check,
  Loader2
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Appointment } from '../types';
import { CancelModal } from '../components/CancelModal';
import { RescheduleModal } from '../components/RescheduleModal';

export const PatientDashboardPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'appointments';

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL'); // ALL, CONFIRMED, COMPLETED, CANCELLED

  // Modals state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);

  // Profile edit form state
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    blood_group: user?.blood_group || '',
    emergency_contact: user?.emergency_contact || '',
    address: user?.address || '',
    city: user?.city || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/dashboard');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Update profileForm when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        blood_group: user.blood_group || '',
        emergency_contact: user.emergency_contact || '',
        address: user.address || '',
        city: user.city || '',
      });
    }
  }, [user]);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my/');
      const data = res.data.results || res.data;
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated]);

  const handleCancelClick = (app: Appointment) => {
    setSelectedApp(app);
    setCancelModalOpen(true);
  };

  const handleRescheduleClick = (app: Appointment) => {
    setSelectedApp(app);
    setRescheduleModalOpen(true);
  };

  const handleAppointmentUpdated = (updatedApp: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
    );
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const res = await updateProfile(profileForm);
    if (res.success) {
      setProfileSuccessMsg('Profile updated successfully.');
    } else {
      setProfileErrorMsg(res.error || 'Failed to update profile.');
    }
    setProfileSaving(false);
  };

  // Metrics
  const upcomingCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;

  const filteredAppointments = appointments.filter((a) => {
    if (selectedFilter === 'ALL') return true;
    return a.status === selectedFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-brand-600 to-medical-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-brand-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-100">
            Patient Portal &bull; Medical Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.first_name || 'Patient'}!
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-1">
            Manage your hospital consultations, check schedules, or reschedule appointments.
          </p>
        </div>

        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Book New Appointment
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Upcoming Visits</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{upcomingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Completed Visits</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{completedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Cancelled Visits</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{cancelledCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSearchParams({ tab: 'appointments' })}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'appointments'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Patient Profile Details
        </button>
      </div>

      {/* TAB 1: Appointments List */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          
          {/* Status Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedFilter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'ALL' ? 'All Bookings' : f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have no consultations listed under the selected filter.
              </p>
              <Link
                to="/book"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
              >
                Book Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-card hover:border-brand-200 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={app.doctor_image}
                      alt={app.doctor_name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {app.reference_no}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            app.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">{app.doctor_name}</h4>
                      <p className="text-xs font-semibold text-brand-700">{app.doctor_specialty}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {app.doctor_hospital} &bull; {app.doctor_address}
                      </p>
                    </div>
                  </div>

                  {/* Slot & Fee Info */}
                  <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between w-full md:w-auto gap-2 text-xs">
                    <div className="text-left md:text-right">
                      <span className="text-slate-400 font-medium block">Scheduled For</span>
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 md:justify-end">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        {app.appointment_date}
                      </span>
                      <span className="text-slate-600 font-medium flex items-center gap-1.5 md:justify-end mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-brand-600" />
                        {app.start_time} - {app.end_time}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{Number(app.consultation_fee).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Action buttons (only for CONFIRMED upcoming appointments) */}
                    {app.status === 'CONFIRMED' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleRescheduleClick(app)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelClick(app)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {app.status === 'CANCELLED' && app.cancellation_reason && (
                      <p className="text-[11px] text-rose-600 italic">
                        Cancelled: "{app.cancellation_reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Patient Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Patient Profile Details</h3>
            <p className="text-xs text-slate-500">
              Keep your contact and emergency details updated for clinical coordination.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Primary ID)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <input
                  type="text"
                  placeholder="e.g. O+, A+, B+, AB-"
                  value={profileForm.blood_group}
                  onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  placeholder="+91 Emergency Phone"
                  value={profileForm.emergency_contact}
                  onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        appointment={selectedApp}
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        onSuccess={handleAppointmentUpdated}
      />

      {/* Cancel Modal */}
      <CancelModal
        appointment={selectedApp}
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={handleAppointmentUpdated}
      />
    </div>
  );
};
