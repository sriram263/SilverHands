import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle2, Save, Sparkles } from 'lucide-react';
import { updateProviderMe } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';

export const AvailabilityManager = ({ currentAvailability, onUpdated }) => {
  const { showToast } = useNotifications();
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const [selectedDays, setSelectedDays] = useState(
    currentAvailability?.days || currentAvailability?.available_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );
  const [startTime, setStartTime] = useState(currentAvailability?.start_time || '09:00');
  const [endTime, setEndTime] = useState(currentAvailability?.end_time || '18:00');
  const [slotDuration, setSlotDuration] = useState(currentAvailability?.duration || 60);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) {
        showToast('Please keep at least one available working day', 'warning');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        days: selectedDays,
        available_days: selectedDays,
        start_time: startTime,
        end_time: endTime,
        duration: parseInt(slotDuration, 10)
      };
      await updateProviderMe({ availability: payload });
      showToast('Weekly availability & work hours saved!', 'success');
      if (onUpdated) onUpdated(payload);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save availability', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-surface p-6 sm:p-8 space-y-6 border border-warmgray-200 shadow-warm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-warmgray-100">
        <div>
          <h3 className="font-heading font-bold text-lg text-warmgray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-saffron" />
            <span>Weekly Work Schedule & Availability</span>
          </h3>
          <p className="text-xs text-warmgray-500 mt-0.5">
            Configure your active working days and appointment time slots.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Working Days Selector */}
        <div>
          <label className="block text-xs font-bold text-warmgray-700 mb-2">
            Select Active Working Days:
          </label>
          <div className="flex flex-wrap gap-2">
            {allDays.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-saffron text-white shadow-warm-sm border border-saffron'
                      : 'bg-cream-100 text-warmgray-600 hover:bg-cream-200 border border-warmgray-200'
                  }`}
                >
                  {day} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Daily Work Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">
              Start Time (Daily)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">
              End Time (Daily)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
            />
          </div>
        </div>

        {/* 3. Slot Duration */}
        <div>
          <label className="block text-xs font-bold text-warmgray-700 mb-1">
            Default Appointment Duration
          </label>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
          >
            <option value={30}>30 Minutes</option>
            <option value={45}>45 Minutes</option>
            <option value={60}>60 Minutes (1 Hour)</option>
            <option value={90}>90 Minutes (1.5 Hours)</option>
            <option value={120}>120 Minutes (2 Hours)</option>
          </select>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs !py-2.5 !px-6 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Schedule...' : 'Save Work Schedule'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
