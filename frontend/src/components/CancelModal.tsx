import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import api from '../api/client';
import { Appointment } from '../types';

interface CancelModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedAppointment: Appointment) => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/appointments/${appointment.id}/cancel/`, {
        reason: reason.trim() || 'Patient personal schedule conflict',
      });
      onSuccess(res.data.appointment);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Cancel Appointment?</h3>
        <p className="text-xs text-slate-500 mt-1">
          Are you sure you want to cancel appointment <strong>{appointment.reference_no}</strong> with{' '}
          <strong>{appointment.doctor_name}</strong> on {appointment.appointment_date} at {appointment.start_time}?
        </p>

        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
          This slot will be immediately released back to the general clinic pool. A cancellation confirmation email will be sent to your registered address.
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleCancel} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better, relocated..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Keep Appointment
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Cancellation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
