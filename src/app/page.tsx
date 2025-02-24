'use client';

import { useState, useEffect } from 'react';
import { TimeSlot, AppointmentFormData, ApiResponse } from '@/types/appointment';
import Image from "next/image";

function formatTimeSlot(date: string) {
  return new Date(date).toLocaleTimeString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export default function Home() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group slots by date for the dropdown
  const availableDates = [...new Set(slots.map(slot => 
    new Date(slot.start).toLocaleDateString()
  ))];

  // Filter time slots for selected date
  const availableTimesForDate = slots.filter(slot => 
    new Date(slot.start).toLocaleDateString() === selectedDate
  );

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

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
        setSelectedDate('');
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
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
              }}
            >
              <option value="">Choose a date</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          {/* Time Selection - Changed from grid to dropdown */}
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
