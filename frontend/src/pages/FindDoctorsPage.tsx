import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';
import { Doctor, Specialty } from '../types';
import { DoctorCard } from '../components/DoctorCard';

export const FindDoctorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [maxFee, setMaxFee] = useState(searchParams.get('max_fee') || '1500');
  const [minExp, setMinExp] = useState(searchParams.get('min_experience') || '0');
  const [ordering, setOrdering] = useState(searchParams.get('ordering') || '-rating');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch specialties once
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await api.get('/specialties/');
        setSpecialties(res.data);
      } catch (err) {
        console.error('Failed to load specialties:', err);
      }
    };
    fetchSpecialties();
  }, []);

  // Fetch doctors whenever filters change
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (search.trim()) params.search = search.trim();
        if (selectedSpecialty) params.specialty = selectedSpecialty;
        if (selectedCity) params.city = selectedCity;
        if (maxFee && Number(maxFee) < 1500) params.max_fee = maxFee;
        if (minExp && Number(minExp) > 0) params.min_experience = minExp;
        if (ordering) params.ordering = ordering;

        const res = await api.get('/doctors/', { params });
        const data = res.data.results || res.data;
        setDoctors(data);
        setTotalCount(res.data.count || data.length);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDoctors();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, selectedSpecialty, selectedCity, maxFee, minExp, ordering]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSpecialty('');
    setSelectedCity('');
    setMaxFee('1500');
    setMinExp('0');
    setOrdering('-rating');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Doctors & Medical Specialists
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse verified doctors, filter by medical specialty and location, and schedule your visit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6 sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                Filter Doctors
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Specialty Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Specialty
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">All Specialties</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name} ({s.doctor_count})
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                City / Location
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">All Cities</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            {/* Max Consultation Fee Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Max Fee
                </label>
                <span className="text-xs font-bold text-brand-700">₹{maxFee}</span>
              </div>
              <input
                type="range"
                min="400"
                max="1500"
                step="50"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹400</span>
                <span>₹1,500</span>
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Minimum Experience
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 5, 10, 15].map((years) => (
                  <button
                    key={years}
                    type="button"
                    onClick={() => setMinExp(String(years))}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                      minExp === String(years)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {years === 0 ? 'Any' : `${years}+ Yrs`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search bar & Sort Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by doctor or hospital name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter toggle button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">Sort by:</span>
                <select
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="-rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="fee_asc">Fee: Low to High</option>
                  <option value="fee_desc">Fee: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedSpecialty || selectedCity || search || Number(maxFee) < 1500 || Number(minExp) > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-medium">Active Filters:</span>
              {selectedSpecialty && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Specialty: {selectedSpecialty}
                  <button onClick={() => setSelectedSpecialty('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedCity && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-medical-50 text-medical-700 border border-medical-200">
                  City: {selectedCity}
                  <button onClick={() => setSelectedCity('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {Number(maxFee) < 1500 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Under ₹{maxFee}
                  <button onClick={() => setMaxFee('1500')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {Number(minExp) > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {minExp}+ Yrs Exp
                  <button onClick={() => setMinExp('0')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:underline font-semibold ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Doctors Listing */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 bg-slate-100 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No doctors match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try loosening your filters or resetting the search term to view all available medical specialists.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-500 font-medium">
                Showing <strong>{doctors.length}</strong> {doctors.length === 1 ? 'doctor' : 'doctors'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-80 h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-slate-900">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="">All Specialties</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="">All Cities</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Max Fee</span>
                <span className="text-brand-600">₹{maxFee}</span>
              </div>
              <input
                type="range"
                min="400"
                max="1500"
                step="50"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
                className="w-full accent-brand-600"
              />
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
