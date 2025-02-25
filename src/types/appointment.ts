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
  service: string;
}

export interface ApiResponse {
  message?: string;
  error?: string;
  eventId?: string;
}

export const MEDICAL_SERVICES = [
  'General Medical Consultation',
  'Health Screening',
  'Vaccinations',
  'Minor Surgical Procedures',
  'Others'
] as const;

export type MedicalService = typeof MEDICAL_SERVICES[number]; 