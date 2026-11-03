import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  Users,
  Activity,
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Clock,
  Building,
  Edit2,
  Trash2,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AdminStats, Appointment, Doctor, Specialty } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'doctors'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  // Appointments filter & search
  const [appSearch, setAppSearch] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [appDate, setAppDate] = useState('');

  // New doctor modal state
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    full_name: '',
    specialty: '',
    qualifications: '',
    experience_years: 5,
    biography: '',
    hospital_affiliation: 'CarePulse Super Specialty Hospital',
    consultation_fee: 500,
    city: 'Bangalore',
    address: '104 Healthcare Blvd, Bangalore',
    profile_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    is_active: true,
  });
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Guard: Admin role only
  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        navigate('/login?redirect=/admin');
      }
    }
  }, [authLoading, user, isAdmin, navigate]);

  // Load stats and data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, docsRes, specsRes] = await Promise.all([
        api.get('/admin/dashboard/'),
        api.get('/admin/appointments/'),
        api.get('/doctors/'),
        api.get('/specialties/'),
      ]);
      setStats(statsRes.data);
      setAppointments(appsRes.data.results || appsRes.data);
      setDoctors(docsRes.data.results || docsRes.data);
      setSpecialties(specsRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // Handle appointment cancellation from admin
  const handleAdminCancelAppointment = async (appId: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment as an Administrator?')) return;
    try {
      await api.post(`/appointments/${appId}/cancel/`, {
        reason: 'Administrative schedule adjustment',
      });
      loadAdminData();
    } catch (err) {
      alert('Failed to cancel appointment.');
    }
  };

  // Handle toggle doctor active status
  const handleToggleDoctorStatus = async (doctor: Doctor) => {
    try {
      await api.patch(`/admin/doctors/${doctor.id}/`, {
        is_active: !doctor.is_active,
      });
      loadAdminData();
    } catch (err) {
      alert('Failed to update doctor active status.');
    }
  };

  // Handle create doctor submit
  const handleCreateDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoctor(true);
    try {
      await api.post('/admin/doctors/', doctorForm);
      setDoctorModalOpen(false);
      setDoctorForm({
        full_name: '',
        specialty: '',
        qualifications: '',
        experience_years: 5,
        biography: '',
        hospital_affiliation: 'CarePulse Super Specialty Hospital',
        consultation_fee: 500,
        city: 'Bangalore',
        address: '104 Healthcare Blvd, Bangalore',
        profile_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
        is_active: true,
      });
      loadAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create doctor profile.');
    } finally {
      setSavingDoctor(false);
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((a) => {
    if (appStatus && a.status !== appStatus) return false;
    if (appDate && a.appointment_date !== appDate) return false;
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      const matchRef = a.reference_no.toLowerCase().includes(q);
      const matchDoc = a.doctor_name.toLowerCase().includes(q);
      const matchPatient = a.patient_name.toLowerCase().includes(q);
      const matchEmail = a.patient_email.toLowerCase().includes(q);
      if (!matchRef && !matchDoc && !matchPatient && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <ShieldCheck className="w-4 h-4" /> Platform Administration Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hospital Operations & SaaS Management
          </h1>
          <p className="text-xs text-slate-400">
            Logged in as <strong>{user?.email}</strong> &bull; Superuser Role
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDoctorModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Doctor Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Operations Overview
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'appointments'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'doctors'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Manage Doctors ({doctors.length})
        </button>
      </div>

      {/* TAB 1: Operations Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Total Appointments</span>
              <span className="text-3xl font-black text-slate-900 block mt-1">
                {stats?.total_appointments || 0}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                {stats?.today_appointments || 0} scheduled for today
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Active Clinicians</span>
              <span className="text-3xl font-black text-slate-900 block mt-1">
                {stats?.active_doctors || 0}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                Across {stats?.specialties_count || 8} clinical specialties
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Registered Patients</span>
              <span className="text-3xl font-black text-slate-900 block mt-1">
                {stats?.total_patients || 0}
              </span>
              <span className="text-[10px] text-brand-600 font-medium mt-1 block">
                Active outpatient accounts
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Gross Bookings Value</span>
              <span className="text-3xl font-black text-slate-900 block mt-1">
                ₹{stats?.total_revenue?.toLocaleString('en-IN') || 0}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                Confirmed & completed visits
              </span>
            </div>
          </div>

          {/* Recent Bookings Feed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Recent Hospital Bookings</h3>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View all &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(stats?.recent_bookings || []).map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {app.reference_no}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{app.patient_name}</p>
                      <p className="text-slate-400 text-[11px]">with {app.doctor_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-700">{app.appointment_date} at {app.start_time}</span>
                    <span className="block text-[10px] text-emerald-600 font-bold">{app.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: All Appointments (Search & Filter) */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search ref, patient, doctor, email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value)}
                className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <input
                type="date"
                value={appDate}
                onChange={(e) => setAppDate(e.target.value)}
                className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Ref #</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor & Specialty</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-700">{app.reference_no}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{app.patient_name}</p>
                      <p className="text-[11px] text-slate-400">{app.patient_email} &bull; {app.patient_phone}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{app.doctor_name}</p>
                      <p className="text-[11px] text-brand-600">{app.doctor_specialty}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{app.appointment_date}</p>
                      <p className="text-[11px] text-slate-400">{app.start_time} - {app.end_time}</p>
                    </td>
                    <td className="p-3 font-bold text-slate-900">₹{app.consultation_fee}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : app.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {app.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleAdminCancelAppointment(app.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Manage Doctors */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Medical Clinicians Directory</h3>
              <p className="text-xs text-slate-500">Manage active clinicians, fees, and weekly schedules.</p>
            </div>
            <button
              onClick={() => setDoctorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Doctor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={doc.profile_image}
                    alt={doc.full_name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {doc.specialty_name || (typeof doc.specialty === 'object' ? doc.specialty.name : 'Specialist')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{doc.full_name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{doc.hospital_affiliation}</p>
                    <p className="text-[11px] text-slate-700 font-semibold mt-0.5">₹{doc.consultation_fee} per slot</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      doc.is_active ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {doc.is_active ? 'Active Profile' : 'Deactivated'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleDoctorStatus(doc)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
                    >
                      {doc.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {doctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Add New Doctor Profile</h3>

            <form onSubmit={handleCreateDoctorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Kavita Nair"
                  value={doctorForm.full_name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialty *</label>
                  <select
                    required
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="">Select Specialty</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    value={doctorForm.experience_years}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experience_years: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Qualifications *</label>
                <input
                  type="text"
                  required
                  placeholder="MBBS, MD - Dermatology"
                  value={doctorForm.qualifications}
                  onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={doctorForm.city}
                    onChange={(e) => setDoctorForm({ ...doctorForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                <input
                  type="text"
                  value={doctorForm.hospital_affiliation}
                  onChange={(e) => setDoctorForm({ ...doctorForm, hospital_affiliation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Professional Biography</label>
                <textarea
                  rows={3}
                  value={doctorForm.biography}
                  onChange={(e) => setDoctorForm({ ...doctorForm, biography: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDoctorModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor}
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
                >
                  {savingDoctor ? 'Saving...' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
