import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../api/client';
import { TimeSlot, DoctorAvailability } from '../types';

interface SlotPickerProps {
  doctorId: number;
  initialDate?: string;
  selectedSlot?: string;
  onSlotSelected: (slot: string, date: string) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  doctorId,
  initialDate,
  selectedSlot,
  onSlotSelected,
}) => {
  // Generate next 14 calendar days
  const today = new Date();
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isSunday: d.getDay() === 0,
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || dateOptions[0].dateString
  );
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/doctors/${doctorId}/availability/?date=${selectedDate}`);
        if (isMounted) {
          setAvailability(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to retrieve available slots for this date.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [doctorId, selectedDate]);

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.is_available) {
      onSlotSelected(slot.start_time, selectedDate);
    }
  };

  // Group slots into Morning (< 12:00), Afternoon (12:00 - 16:00), Evening (>= 16:00)
  const slots = availability?.slots || [];
  const morningSlots = slots.filter((s) => parseInt(s.start_time.split(':')[0]) < 12);
  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.start_time.split(':')[0]);
    return hour >= 12 && hour < 16;
  });
  const eveningSlots = slots.filter((s) => parseInt(s.start_time.split(':')[0]) >= 16);

  const formatSlotDisplay = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${m} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          Choose Appointment Date & Time
        </h4>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
          In-Person Visit
        </span>
      </div>

      {/* Date Horizontal Carousel */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
          {dateOptions.map((opt) => {
            const isSelected = opt.dateString === selectedDate;
            return (
              <button
                key={opt.dateString}
                onClick={() => handleDateClick(opt.dateString)}
                className={`snap-start shrink-0 flex flex-col items-center justify-center w-16 sm:w-20 py-2.5 px-1 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20 scale-105'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-400 hover:bg-brand-50/50'
                }`}
              >
                <span className={`text-[11px] font-medium uppercase ${isSelected ? 'text-brand-100' : 'text-slate-500'}`}>
                  {opt.dayName}
                </span>
                <span className="text-lg font-bold my-0.5">{opt.dayNumber}</span>
                <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                  {opt.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Section */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-medium">Checking live doctor availability...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : slots.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h5 className="text-sm font-semibold text-slate-700">No Clinic Hours On This Day</h5>
          <p className="text-xs text-slate-400 mt-1">
            The doctor does not have working hours scheduled for this day. Please pick another date above.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-700">
              {availability?.available_count || 0} Open Slots Available
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Booked / Break
              </span>
            </div>
          </div>

          {/* Morning Slots */}
          {morningSlots.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Morning Sessions
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {morningSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.start_time;
                  return (
                    <button
                      key={slot.start_time}
                      disabled={!slot.is_available}
                      onClick={() => handleSlotClick(slot)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white ring-2 ring-brand-600 ring-offset-2 shadow-sm'
                          : slot.is_available
                          ? 'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-600 hover:text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                      }`}
                      title={slot.is_available ? 'Available' : slot.reason || 'Unavailable'}
                    >
                      {formatSlotDisplay(slot.start_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Afternoon Slots */}
          {afternoonSlots.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-medical-500" /> Afternoon Sessions
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {afternoonSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.start_time;
                  return (
                    <button
                      key={slot.start_time}
                      disabled={!slot.is_available}
                      onClick={() => handleSlotClick(slot)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white ring-2 ring-brand-600 ring-offset-2 shadow-sm'
                          : slot.is_available
                          ? 'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-600 hover:text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                      }`}
                      title={slot.is_available ? 'Available' : slot.reason || 'Unavailable'}
                    >
                      {formatSlotDisplay(slot.start_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evening Slots */}
          {eveningSlots.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Evening Sessions
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {eveningSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.start_time;
                  return (
                    <button
                      key={slot.start_time}
                      disabled={!slot.is_available}
                      onClick={() => handleSlotClick(slot)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white ring-2 ring-brand-600 ring-offset-2 shadow-sm'
                          : slot.is_available
                          ? 'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-600 hover:text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                      }`}
                      title={slot.is_available ? 'Available' : slot.reason || 'Unavailable'}
                    >
                      {formatSlotDisplay(slot.start_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
