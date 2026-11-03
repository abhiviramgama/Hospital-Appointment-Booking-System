import React from 'react';
import { Activity, ShieldCheck, Heart, Users, Award, CheckCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Hero */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Hospital SaaS Phase 1 Platform
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About CarePulse Health Systems
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          CarePulse is architected as Phase 1 of an enterprise Hospital Management Software-as-a-Service (SaaS) suite, bridging patient discovery directly with live hospital outpatient scheduling.
        </p>
      </div>

      {/* Core Mission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Patient-First Access</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Eliminating clinic waiting lines and ambiguous telephone bookings by providing instant, transparent digital slot scheduling.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Clinical Data Integrity</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Strict transactional locking and concurrency management preventing double-bookings and maintaining synchronized schedules.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">SaaS Future-Readiness</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Structured for seamless expansion into multi-hospital tenants, pharmacy inventories, lab management, and telemedicine.
          </p>
        </div>
      </div>

      {/* Compliance & Healthcare Notice */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Healthcare Compliance & Data Security
        </div>
        <h2 className="text-xl font-bold">Designed for Indian Healthcare Data Privacy Standards</h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          CarePulse complies with applicable Indian data protection principles, securing patient confidentiality with tokenized authentication, strict permission checks, and audited database migrations. In accordance with clinical advisory guidelines, synthetic patient records are used in testing environments.
        </p>
      </div>

      {/* Clinical Standards Checklist */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
        <h3 className="text-lg font-bold text-slate-900">Hospital Platform Commitments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Verified doctor qualifications, degrees, and hospital credentials</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Real-time working hours with automated break and holiday exclusion</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Automated instant email notifications for bookings and reschedules</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Zero-wait patient dashboard for flexible self-service slot changes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
