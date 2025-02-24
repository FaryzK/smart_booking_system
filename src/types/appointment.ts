export interface TimeSlot {
  start: string;
  end: string;
}

export interface AppointmentFormData {
  name: string;
  email: string;
  phone: string;
  start: string;
  end: string;
}

export interface ApiResponse {
  message?: string;
  error?: string;
  eventId?: string;
} 