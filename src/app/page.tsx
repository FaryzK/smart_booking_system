'use client';

import { useState, useEffect } from 'react';
import { TimeSlot, AppointmentFormData, ApiResponse } from '@/types/appointment';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function formatTimeSlot(date: string) {
  return new Date(date).toLocaleTimeString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Business hours configuration
const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 18,  // 6 PM
  days: [1, 2, 3, 4, 5], // Monday = 1, Friday = 5
};

export default function Home() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter time slots for selected date
  const availableTimesForDate = slots.filter(slot => 
    selectedDate && 
    new Date(slot.start).toLocaleDateString() === selectedDate.toLocaleDateString()
  );

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  // Filter out weekends and past dates
  const filterAvailableDates = (date: Date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Allow only weekdays (Monday = 1, Friday = 5) and dates from today
    return BUSINESS_HOURS.days.includes(day) && date >= today;
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch('/api/available-slots');
      const data = await response.json();
      if (response.ok) {
        setSlots(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const formData = new FormData(e.currentTarget);
    const appointmentData: AppointmentFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      start: selectedSlot.start,
      end: selectedSlot.end,
    };

    try {
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      
      const data: ApiResponse = await response.json();
      
      if (response.ok) {
        alert('Appointment booked successfully!');
        setSelectedSlot(null);
        setSelectedDate(null);
        fetchAvailableSlots(); // Refresh slots
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      setError('Failed to book appointment');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-red-500">Error: {error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="mt-2 text-sm text-gray-600">Select your preferred date and time</p>
        </div>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              filterDate={filterAvailableDates}
              minDate={new Date()}
              maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year from now
              dateFormat="MMMM d, yyyy"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholderText="Choose a date"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Time
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedSlot ? selectedSlot.start : ''}
                onChange={(e) => {
                  const slot = availableTimesForDate.find(s => s.start === e.target.value);
                  setSelectedSlot(slot || null);
                }}
              >
                <option value="">Choose a time</option>
                {availableTimesForDate.map((slot, index) => (
                  <option key={index} value={slot.start}>
                    {formatTimeSlot(slot.start)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Booking Form */}
          {selectedSlot && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book Appointment
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
