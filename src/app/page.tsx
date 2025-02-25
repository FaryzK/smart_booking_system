'use client';

import { useState, useEffect } from 'react';
import { TimeSlot, AppointmentFormData, ApiResponse, MEDICAL_SERVICES } from '@/types/appointment';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Toaster, toast } from 'react-hot-toast';

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
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');

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

  const fetchAvailableSlots = async (date?: Date) => {
    try {
      setSlotsLoading(true);
      const queryDate = date ? date.toISOString() : new Date().toISOString();
      const response = await fetch(`/api/available-slots?date=${queryDate}`);
      const data = await response.json();
      if (response.ok) {
        setSlots(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch available slots');
    } finally {
      setSlotsLoading(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const loadingToast = toast.loading('Booking your appointment...');

    const formData = new FormData(e.currentTarget);
    const appointmentData: AppointmentFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      service: selectedService,
      start: selectedSlot.start,
      end: selectedSlot.end,
      message: formData.get('message') as string || undefined,
    };

    try {
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      
      const data: ApiResponse = await response.json();
      
      if (response.ok) {
        // Success toast
        toast.success('Appointment booked successfully!', {
          id: loadingToast,
          duration: 5000,
          icon: '✅',
        });
        setSelectedSlot(null);
        setSelectedDate(null);
        setSelectedService('');
        fetchAvailableSlots();
      } else {
        // Error toast
        toast.error(data.error || 'Failed to book appointment', {
          id: loadingToast,
          duration: 5000,
        });
        setError(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      // Error toast
      toast.error('Failed to book appointment', {
        id: loadingToast,
        duration: 5000,
      });
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
    <div className="min-h-screen bg-gray-50">
      {/* Add Toaster component at the top level */}
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            style: {
              background: '#10B981',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#EF4444',
              color: 'white',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
              color: 'white',
            },
          },
        }}
      />

      {/* Clinic Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            {/* You can replace this with the clinic's logo */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">Singapore Medical Clinic</h1>
              <p className="text-sm text-gray-500">Your Health, Our Priority</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Operating Hours:</p>
            <p>Mon-Fri: 9:00 AM - 6:00 PM</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Clinic Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">About Our Clinic</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Providing quality healthcare services with experienced doctors and modern facilities.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Services</h3>
                <ul className="mt-2 text-sm text-gray-500 space-y-1">
                  <li>• General Medical Consultation</li>
                  <li>• Health Screening</li>
                  <li>• Vaccinations</li>
                  <li>• Minor Surgical Procedures</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Contact</h3>
                <div className="mt-2 text-sm text-gray-500 space-y-1">
                  <p>📍 123 Medical Centre</p>
                  <p>📞 +65 6789 0123</p>
                  <p>✉️ contact@sgmedical.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Book an Appointment</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Schedule your consultation with our experienced doctors
                </p>
              </div>

              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                      fetchAvailableSlots(date);
                    }}
                    filterDate={filterAvailableDates}
                    minDate={new Date()}
                    maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                    dateFormat="MMMM d, yyyy"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholderText="Select your preferred date"
                  />
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Preferred Time
                    </label>
                    {slotsLoading ? (
                      <div className="mt-2 flex justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <select
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                          !selectedSlot?.start ? 'placeholder' : ''
                        }`}
                        value={selectedSlot ? selectedSlot.start : ''}
                        onChange={(e) => {
                          const slot = availableTimesForDate.find(s => s.start === e.target.value);
                          setSelectedSlot(slot || null);
                        }}
                      >
                        <option value="">Select your preferred time</option>
                        {availableTimesForDate.map((slot, index) => (
                          <option key={index} value={slot.start}>
                            {formatTimeSlot(slot.start)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Service Type */}
                {selectedSlot && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Service Type
                    </label>
                    <select
                      name="service"
                      required
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        !selectedService ? 'placeholder' : ''
                      }`}
                    >
                      <option value="">Select a service</option>
                      {MEDICAL_SERVICES.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Patient Information Form */}
                {selectedService && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Enter your full name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="Enter your email address"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="Enter your phone number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Message (Optional)
                      </label>
                      <textarea
                        name="message"
                        rows={3}
                        placeholder="Any additional information or special requests"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Confirm Appointment
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-4">
                      By booking an appointment, you agree to our terms and conditions.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
