/* ================================================================
   LIVEMAP EMERGENCY — Shared TypeScript Types
   ================================================================ */

// ── User Types ──────────────────────────────────────────────────

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: "user" | "doctor" | "paramedic" | "nurse" | "emergency-patient";
  avatar?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContacts?: { name: string; phone: string; relation: string }[];
  medicalCertifications?: string[];
  specialization?: string;
  hospital?: string;
  licenseNumber?: string;
  experience?: number;
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  availableForEmergency?: boolean;
  maxRadius?: number;
  location?: { type: "Point"; coordinates: [number, number] };
  isAvailable?: boolean;
  isOnline?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDoctor extends IUser {
  role: "doctor";
  specialization: string;
  hospital?: string;
  licenseNumber: string;
  experience: number;
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  availableForEmergency: boolean;
  maxRadius: number;
}

// ── Chat & Message Types ────────────────────────────────────────

export interface IMessage {
  _id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: "text" | "location" | "profile" | "emergency" | "image";
  metadata?: {
    latitude?: number;
    longitude?: number;
    profileData?: Partial<IUser>;
  };
  createdAt?: Date;
}

export interface IChat {
  _id?: string;
  type: "public" | "private" | "emergency";
  name?: string;
  participants: string[];
  participantNames?: string[];
  emergencyId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt?: Date;
}

// ── Emergency Types ─────────────────────────────────────────────

export interface IEmergency {
  _id?: string;
  reportedBy: string;
  reporterName: string;
  reporterPhone: string;
  location: { type: "Point"; coordinates: [number, number] };
  address?: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "accepted" | "en-route" | "arrived" | "in-progress" | "responded" | "resolved" | "cancelled";
  acceptedBy?: string;
  acceptedAt?: Date;
  enRouteAt?: Date;
  arrivedAt?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  healthData?: {
    bloodGroup?: string;
    allergies?: string[];
    conditions?: string[];
  };
  notifiedDoctors: string[];
  respondedDoctors: string[];
  chatId?: string;
  radius: number;
  createdAt?: Date;
}

// ── Notification Types ──────────────────────────────────────────

export interface INotification {
  _id?: string;
  userId: string;
  type: "status" | "chat" | "system";
  title: string;
  message: string;
  icon: string;
  color: string;
  read: boolean;
  emergencyId?: string;
  chatId?: string;
  fromUserId?: string;
  fromUserName?: string;
  status?: string;
  createdAt?: Date;
}

// ── Places / Map Types ──────────────────────────────────────────

export interface IPlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  opening_hours?: { open_now: boolean };
  types: string[];
  icon?: string;
  distance?: number;
}

export type MapCenter = { lat: number; lng: number };

// ── Frontend Component Types ────────────────────────────────────

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
  status?: string;
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
  severity?: string;

  // Doctor info (from accepted-sos endpoint)
  doctor?: {
    id?: string;
    _id?: string;
    name: string;
    specialization?: string;
    phone?: string;
    location?: { lat: number; lng: number };
  };
  estimatedArrival?: string;
  acceptedAt?: string;

  // Status timestamps
  enRouteAt?: string;
  arrivedAt?: string;
  resolvedAt?: string;
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

// ── Screen Routing ──────────────────────────────────────────────

export type ActiveScreen =
  | "dashboard"
  | "specialist-search"
  | "pharmacy-search"
  | "directions"
  | "emergency-sos"
  | "emergency-response"
  | "profile";

// ── Specialist Search Categories ────────────────────────────────

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

// ── Medical Roles Helper ────────────────────────────────────────

export const MEDICAL_ROLES = ["doctor", "nurse", "paramedic"] as const;
export type MedicalRole = (typeof MEDICAL_ROLES)[number];

export function isMedicalRole(role: string): role is MedicalRole {
  return MEDICAL_ROLES.includes(role as MedicalRole);
}