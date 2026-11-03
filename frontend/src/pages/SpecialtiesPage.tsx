import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Specialty } from '../types';
import { SpecialtyCard } from '../components/SpecialtyCard';
import { Sparkles } from 'lucide-react';

export const SpecialtiesPage: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await api.get('/specialties/');
        setSpecialties(res.data);
      } catch (err) {
        console.error('Failed to load specialties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" /> Medical Departments
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Specialties Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore medical domains and find certified clinical practitioners for your care.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {specialties.map((s) => (
            <SpecialtyCard key={s.id} specialty={s} />
          ))}
        </div>
      )}
    </div>
  );
};
