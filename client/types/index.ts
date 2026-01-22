export interface Child {
  id: string;
  name: string;
  birthDate: string;
  sex: "male" | "female";
  avatarIndex: number;
  createdAt: string;
  ownerId?: string;
  isShared?: boolean;
  isReadOnly?: boolean;
  sharedFromCode?: string;
}

export interface ShareCode {
  id: string;
  childId: string;
  code: string;
  ownerId: string;
  isReadOnly: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface MedicalVisit {
  id: string;
  childId: string;
  doctorId: string;
  date: string;
  weight?: number;
  height?: number;
  headCircumference?: number;
  notes?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  childId: string;
  name: string;
  symptom?: string;
  dose: string;
  category: string;
  recommendedDose?: string;
  createdAt: string;
}

export interface Vaccine {
  id: string;
  childId: string;
  name: string;
  recommendedAge: string;
  appliedDate?: string;
  isApplied: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  childId: string;
  childName?: string;
  doctorId?: string;
  date: string;
  time: string;
  notes?: string;
  createdAt: string;
}

export interface VaccineWithChild extends Vaccine {
  childName?: string;
}

export interface Allergy {
  id: string;
  childId: string;
  name: string;
  severity?: "mild" | "moderate" | "severe";
  notes?: string;
  createdAt: string;
}

export interface PastDisease {
  id: string;
  childId: string;
  name: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  specialties: string[];
  createdAt: string;
}

export const VACCINE_SCHEDULE = [
  { name: "BCG", recommendedAge: "Nacimiento" },
  { name: "Hepatitis B - 1ra dosis", recommendedAge: "Nacimiento" },
  { name: "Hepatitis B - 2da dosis", recommendedAge: "2 meses" },
  { name: "Pentavalente - 1ra dosis", recommendedAge: "2 meses" },
  { name: "Rotavirus - 1ra dosis", recommendedAge: "2 meses" },
  { name: "Neumococo - 1ra dosis", recommendedAge: "2 meses" },
  { name: "Pentavalente - 2da dosis", recommendedAge: "4 meses" },
  { name: "Rotavirus - 2da dosis", recommendedAge: "4 meses" },
  { name: "Neumococo - 2da dosis", recommendedAge: "4 meses" },
  { name: "Pentavalente - 3ra dosis", recommendedAge: "6 meses" },
  { name: "Hepatitis B - 3ra dosis", recommendedAge: "6 meses" },
  { name: "Influenza - 1ra dosis", recommendedAge: "6 meses" },
  { name: "Neumococo - 3ra dosis", recommendedAge: "12 meses" },
  { name: "Triple Viral (SRP)", recommendedAge: "12 meses" },
  { name: "Varicela - 1ra dosis", recommendedAge: "12 meses" },
  { name: "Hepatitis A - 1ra dosis", recommendedAge: "12 meses" },
  { name: "DPT - 1er refuerzo", recommendedAge: "18 meses" },
  { name: "Polio - 1er refuerzo", recommendedAge: "18 meses" },
  { name: "Triple Viral - 2da dosis", recommendedAge: "4 años" },
  { name: "DPT - 2do refuerzo", recommendedAge: "4 años" },
  { name: "Polio - 2do refuerzo", recommendedAge: "4 años" },
  { name: "Varicela - 2da dosis", recommendedAge: "4 años" },
];

export const MEDICATION_CATEGORIES = [
  "Dermatologia",
  "Oftalmologia",
  "Pediatria General",
  "Otorrinolaringologia",
  "Gastroenterologia",
  "Neumologia",
  "Neurologia",
  "Cardiologia",
  "Otro",
];
