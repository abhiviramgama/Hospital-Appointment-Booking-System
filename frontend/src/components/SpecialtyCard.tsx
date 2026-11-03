import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Sparkles,
  Bone,
  Baby,
  Brain,
  Smile,
  Stethoscope,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Specialty } from '../types';

interface SpecialtyCardProps {
  specialty: Specialty;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ specialty }) => {
  const navigate = useNavigate();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="w-7 h-7 text-rose-500" />;
      case 'Sparkles': return <Sparkles className="w-7 h-7 text-amber-500" />;
      case 'Bone': return <Bone className="w-7 h-7 text-emerald-500" />;
      case 'Baby': return <Baby className="w-7 h-7 text-pink-500" />;
      case 'Brain': return <Brain className="w-7 h-7 text-indigo-500" />;
      case 'Smile': return <Smile className="w-7 h-7 text-cyan-500" />;
      case 'Activity': return <Activity className="w-7 h-7 text-purple-500" />;
      default: return <Stethoscope className="w-7 h-7 text-brand-600" />;
    }
  };

  return (
    <div
      onClick={() => navigate(`/doctors?specialty=${specialty.slug}`)}
      className="group relative bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-brand-500 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand-50 transition-all duration-200">
          {getIcon(specialty.icon)}
        </div>
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
          {specialty.name}
        </h3>
        <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {specialty.description || `Consult leading certified specialists in ${specialty.name}.`}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
          {specialty.doctor_count} {specialty.doctor_count === 1 ? 'Doctor' : 'Doctors'}
        </span>
        <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Consult <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
