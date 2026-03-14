export interface Specialist {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  vicinity: string;
  opening_hours?: {
    open_now: boolean;
  };
  formatted_phone_number?: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  distance?: number;
  formatted_distance?: string;
}

export interface EmergencyData {
  id: string;
  patientId?: string;
  patientName?: string;
  reporterName?: string;
  reporterPhone?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalConditions?: string[];
  phoneNumber?: string;
  age?: string;
  distance?: number;
  formatted_distance?: string;
  address?: string;
  createdAt?: string;
  doctor?: {
    id: string;
    name: string;
    specialization?: string;
    phone?: string;
    location?: { lat: number; lng: number };
  };
  estimatedArrival?: string;
  acceptedAt?: string;
}

export interface AcceptedDoctor {
  doctorId?: string;
  doctorName?: string;
  specialization?: string;
  phone?: string;
  location?: { lat: number; lng: number };
  status?: string;
  estimatedArrival?: string;
  distance?: number;
}

export type ActiveScreen =
  | "dashboard"
  | "specialist-search"
  | "pharmacy-search"
  | "directions"
  | "emergency-sos"
  | "emergency-response"
  | "profile";

export const SPECIALIST_TYPES = [
  { value: "doctor", label: "All Doctors", keywords: "doctor physician" },
  { value: "cardiologist", label: "Cardiologist", keywords: "cardiologist heart doctor" },
  { value: "dermatologist", label: "Dermatologist", keywords: "dermatologist skin doctor" },
  { value: "pediatrician", label: "Pediatrician", keywords: "pediatrician children doctor" },
  { value: "gynecologist", label: "Gynecologist", keywords: "gynecologist women health doctor" },
  { value: "orthopedic", label: "Orthopedic", keywords: "orthopedic bone doctor surgeon" },
  { value: "neurologist", label: "Neurologist", keywords: "neurologist brain doctor" },
  { value: "psychiatrist", label: "Psychiatrist", keywords: "psychiatrist mental health doctor" },
  { value: "dentist", label: "Dentist", keywords: "dentist dental clinic" },
  { value: "hospital", label: "Hospital", keywords: "hospital medical center clinic" },
] as const;