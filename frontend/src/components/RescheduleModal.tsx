import React, { useState } from 'react';
import { Calendar, X, Loader2, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Appointment } from '../types';
import { SlotPicker } from './SlotPicker';

interface RescheduleModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedAppointment: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleSlotSelected = (slot: string, date: string) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
    setError(null);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please choose a new date and time slot from the schedule.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/appointments/${appointment.id}/reschedule/`, {
        new_date: selectedDate,
        new_start_time: selectedSlot,
      });
      onSuccess(res.data.appointment);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reschedule. The slot may have just been booked.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500">
              Ref: <strong className="text-slate-700">{appointment.reference_no}</strong> with {appointment.doctor_name}
            </p>
          </div>
        </div>

        {/* Current Slot Info */}
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Current Slot</span>
            <span className="font-semibold text-slate-800">
              {appointment.appointment_date} at {appointment.start_time}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="text-right">
            <span className="text-slate-400 block">New Selected Slot</span>
            <span className="font-semibold text-brand-700">
              {selectedDate && selectedSlot ? `${selectedDate} at ${selectedSlot}` : 'None Selected'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Interactive SlotPicker for doctor */}
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          <SlotPicker
            doctorId={appointment.doctor}
            selectedSlot={selectedSlot}
            onSlotSelected={handleSlotSelected}
          />
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Rescheduling instantly releases your old time slot.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !selectedDate || !selectedSlot}
              onClick={handleConfirmReschedule}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Reschedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
