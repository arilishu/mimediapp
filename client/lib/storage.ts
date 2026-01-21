import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import type {
  Child,
  MedicalVisit,
  Doctor,
  Medication,
  Vaccine,
  Appointment,
  Allergy,
  PastDisease,
  Hospital,
  ShareCode,
} from "@/types";

const KEYS = {
  CHILDREN: "@mipediapp_children",
  VISITS: "@mipediapp_visits",
  DOCTORS: "@mipediapp_doctors",
  MEDICATIONS: "@mipediapp_medications",
  VACCINES: "@mipediapp_vaccines",
  APPOINTMENTS: "@mipediapp_appointments",
  ALLERGIES: "@mipediapp_allergies",
  DISEASES: "@mipediapp_diseases",
  HOSPITALS: "@mipediapp_hospitals",
  SHARE_CODES: "@mipediapp_share_codes",
};

async function getItems<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting items from ${key}:`, error);
    return [];
  }
}

async function setItems<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error setting items to ${key}:`, error);
    throw error;
  }
}

export const ChildStorage = {
  getAll: () => getItems<Child>(KEYS.CHILDREN),
  getById: async (id: string) => {
    const children = await getItems<Child>(KEYS.CHILDREN);
    return children.find((c) => c.id === id);
  },
  create: async (data: Omit<Child, "id" | "createdAt">) => {
    const children = await getItems<Child>(KEYS.CHILDREN);
    const newChild: Child = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.CHILDREN, [...children, newChild]);
    return newChild;
  },
  update: async (id: string, data: Partial<Child>) => {
    const children = await getItems<Child>(KEYS.CHILDREN);
    const index = children.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Child not found");
    children[index] = { ...children[index], ...data };
    await setItems(KEYS.CHILDREN, children);
    return children[index];
  },
  delete: async (id: string) => {
    const children = await getItems<Child>(KEYS.CHILDREN);
    await setItems(
      KEYS.CHILDREN,
      children.filter((c) => c.id !== id)
    );
  },
};

export const VisitStorage = {
  getAll: () => getItems<MedicalVisit>(KEYS.VISITS),
  getByChildId: async (childId: string) => {
    const visits = await getItems<MedicalVisit>(KEYS.VISITS);
    return visits
      .filter((v) => v.childId === childId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  create: async (data: Omit<MedicalVisit, "id" | "createdAt">) => {
    const visits = await getItems<MedicalVisit>(KEYS.VISITS);
    const newVisit: MedicalVisit = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.VISITS, [...visits, newVisit]);
    return newVisit;
  },
  update: async (id: string, data: Partial<MedicalVisit>) => {
    const visits = await getItems<MedicalVisit>(KEYS.VISITS);
    const index = visits.findIndex((v) => v.id === id);
    if (index === -1) throw new Error("Visit not found");
    visits[index] = { ...visits[index], ...data };
    await setItems(KEYS.VISITS, visits);
    return visits[index];
  },
  delete: async (id: string) => {
    const visits = await getItems<MedicalVisit>(KEYS.VISITS);
    await setItems(
      KEYS.VISITS,
      visits.filter((v) => v.id !== id)
    );
  },
};

export const DoctorStorage = {
  getAll: () => getItems<Doctor>(KEYS.DOCTORS),
  getById: async (id: string) => {
    const doctors = await getItems<Doctor>(KEYS.DOCTORS);
    return doctors.find((d) => d.id === id);
  },
  create: async (data: Omit<Doctor, "id" | "createdAt">) => {
    const doctors = await getItems<Doctor>(KEYS.DOCTORS);
    const newDoctor: Doctor = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.DOCTORS, [...doctors, newDoctor]);
    return newDoctor;
  },
  update: async (id: string, data: Partial<Doctor>) => {
    const doctors = await getItems<Doctor>(KEYS.DOCTORS);
    const index = doctors.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Doctor not found");
    doctors[index] = { ...doctors[index], ...data };
    await setItems(KEYS.DOCTORS, doctors);
    return doctors[index];
  },
  delete: async (id: string) => {
    const doctors = await getItems<Doctor>(KEYS.DOCTORS);
    await setItems(
      KEYS.DOCTORS,
      doctors.filter((d) => d.id !== id)
    );
  },
};

export const MedicationStorage = {
  getAll: () => getItems<Medication>(KEYS.MEDICATIONS),
  getByChildId: async (childId: string) => {
    const medications = await getItems<Medication>(KEYS.MEDICATIONS);
    return medications
      .filter((m) => m.childId === childId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },
  create: async (data: Omit<Medication, "id" | "createdAt">) => {
    const medications = await getItems<Medication>(KEYS.MEDICATIONS);
    const newMedication: Medication = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.MEDICATIONS, [...medications, newMedication]);
    return newMedication;
  },
  update: async (id: string, data: Partial<Medication>) => {
    const medications = await getItems<Medication>(KEYS.MEDICATIONS);
    const index = medications.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Medication not found");
    medications[index] = { ...medications[index], ...data };
    await setItems(KEYS.MEDICATIONS, medications);
    return medications[index];
  },
  delete: async (id: string) => {
    const medications = await getItems<Medication>(KEYS.MEDICATIONS);
    await setItems(
      KEYS.MEDICATIONS,
      medications.filter((m) => m.id !== id)
    );
  },
};

export const VaccineStorage = {
  getAll: () => getItems<Vaccine>(KEYS.VACCINES),
  getByChildId: async (childId: string) => {
    const vaccines = await getItems<Vaccine>(KEYS.VACCINES);
    return vaccines.filter((v) => v.childId === childId);
  },
  create: async (data: Omit<Vaccine, "id" | "createdAt">) => {
    const vaccines = await getItems<Vaccine>(KEYS.VACCINES);
    const newVaccine: Vaccine = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.VACCINES, [...vaccines, newVaccine]);
    return newVaccine;
  },
  update: async (id: string, data: Partial<Vaccine>) => {
    const vaccines = await getItems<Vaccine>(KEYS.VACCINES);
    const index = vaccines.findIndex((v) => v.id === id);
    if (index === -1) throw new Error("Vaccine not found");
    vaccines[index] = { ...vaccines[index], ...data };
    await setItems(KEYS.VACCINES, vaccines);
    return vaccines[index];
  },
  delete: async (id: string) => {
    const vaccines = await getItems<Vaccine>(KEYS.VACCINES);
    await setItems(
      KEYS.VACCINES,
      vaccines.filter((v) => v.id !== id)
    );
  },
};

export const AppointmentStorage = {
  getAll: () => getItems<Appointment>(KEYS.APPOINTMENTS),
  getByChildId: async (childId: string) => {
    const appointments = await getItems<Appointment>(KEYS.APPOINTMENTS);
    return appointments
      .filter((a) => a.childId === childId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
  getUpcoming: async () => {
    const appointments = await getItems<Appointment>(KEYS.APPOINTMENTS);
    const now = new Date();
    return appointments
      .filter((a) => new Date(a.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
  create: async (data: Omit<Appointment, "id" | "createdAt">) => {
    const appointments = await getItems<Appointment>(KEYS.APPOINTMENTS);
    const newAppointment: Appointment = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.APPOINTMENTS, [...appointments, newAppointment]);
    return newAppointment;
  },
  update: async (id: string, data: Partial<Appointment>) => {
    const appointments = await getItems<Appointment>(KEYS.APPOINTMENTS);
    const index = appointments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Appointment not found");
    appointments[index] = { ...appointments[index], ...data };
    await setItems(KEYS.APPOINTMENTS, appointments);
    return appointments[index];
  },
  delete: async (id: string) => {
    const appointments = await getItems<Appointment>(KEYS.APPOINTMENTS);
    await setItems(
      KEYS.APPOINTMENTS,
      appointments.filter((a) => a.id !== id)
    );
  },
};

export const AllergyStorage = {
  getAll: () => getItems<Allergy>(KEYS.ALLERGIES),
  getByChildId: async (childId: string) => {
    const allergies = await getItems<Allergy>(KEYS.ALLERGIES);
    return allergies
      .filter((a) => a.childId === childId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },
  create: async (data: Omit<Allergy, "id" | "createdAt">) => {
    const allergies = await getItems<Allergy>(KEYS.ALLERGIES);
    const newAllergy: Allergy = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.ALLERGIES, [...allergies, newAllergy]);
    return newAllergy;
  },
  update: async (id: string, data: Partial<Allergy>) => {
    const allergies = await getItems<Allergy>(KEYS.ALLERGIES);
    const index = allergies.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Allergy not found");
    allergies[index] = { ...allergies[index], ...data };
    await setItems(KEYS.ALLERGIES, allergies);
    return allergies[index];
  },
  delete: async (id: string) => {
    const allergies = await getItems<Allergy>(KEYS.ALLERGIES);
    await setItems(
      KEYS.ALLERGIES,
      allergies.filter((a) => a.id !== id)
    );
  },
};

export const DiseaseStorage = {
  getAll: () => getItems<PastDisease>(KEYS.DISEASES),
  getByChildId: async (childId: string) => {
    const diseases = await getItems<PastDisease>(KEYS.DISEASES);
    return diseases
      .filter((d) => d.childId === childId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  create: async (data: Omit<PastDisease, "id" | "createdAt">) => {
    const diseases = await getItems<PastDisease>(KEYS.DISEASES);
    const newDisease: PastDisease = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.DISEASES, [...diseases, newDisease]);
    return newDisease;
  },
  update: async (id: string, data: Partial<PastDisease>) => {
    const diseases = await getItems<PastDisease>(KEYS.DISEASES);
    const index = diseases.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Disease not found");
    diseases[index] = { ...diseases[index], ...data };
    await setItems(KEYS.DISEASES, diseases);
    return diseases[index];
  },
  delete: async (id: string) => {
    const diseases = await getItems<PastDisease>(KEYS.DISEASES);
    await setItems(
      KEYS.DISEASES,
      diseases.filter((d) => d.id !== id)
    );
  },
};

export const HospitalStorage = {
  getAll: () => getItems<Hospital>(KEYS.HOSPITALS),
  getById: async (id: string) => {
    const hospitals = await getItems<Hospital>(KEYS.HOSPITALS);
    return hospitals.find((h) => h.id === id);
  },
  create: async (data: Omit<Hospital, "id" | "createdAt">) => {
    const hospitals = await getItems<Hospital>(KEYS.HOSPITALS);
    const newHospital: Hospital = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.HOSPITALS, [...hospitals, newHospital]);
    return newHospital;
  },
  update: async (id: string, data: Partial<Hospital>) => {
    const hospitals = await getItems<Hospital>(KEYS.HOSPITALS);
    const index = hospitals.findIndex((h) => h.id === id);
    if (index === -1) throw new Error("Hospital not found");
    hospitals[index] = { ...hospitals[index], ...data };
    await setItems(KEYS.HOSPITALS, hospitals);
    return hospitals[index];
  },
  delete: async (id: string) => {
    const hospitals = await getItems<Hospital>(KEYS.HOSPITALS);
    await setItems(
      KEYS.HOSPITALS,
      hospitals.filter((h) => h.id !== id)
    );
  },
};

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const ShareCodeStorage = {
  getAll: () => getItems<ShareCode>(KEYS.SHARE_CODES),
  getByChildId: async (childId: string) => {
    const codes = await getItems<ShareCode>(KEYS.SHARE_CODES);
    return codes.find((c) => c.childId === childId);
  },
  getByCode: async (code: string) => {
    const codes = await getItems<ShareCode>(KEYS.SHARE_CODES);
    return codes.find((c) => c.code === code.toUpperCase());
  },
  create: async (data: Omit<ShareCode, "id" | "code" | "createdAt">) => {
    const codes = await getItems<ShareCode>(KEYS.SHARE_CODES);
    const existingCode = codes.find((c) => c.childId === data.childId);
    if (existingCode) {
      return existingCode;
    }
    const newCode: ShareCode = {
      ...data,
      id: uuidv4(),
      code: generateShareCode(),
      createdAt: new Date().toISOString(),
    };
    await setItems(KEYS.SHARE_CODES, [...codes, newCode]);
    return newCode;
  },
  update: async (childId: string, data: Partial<ShareCode>) => {
    const codes = await getItems<ShareCode>(KEYS.SHARE_CODES);
    const index = codes.findIndex((c) => c.childId === childId);
    if (index === -1) throw new Error("Share code not found");
    codes[index] = { ...codes[index], ...data };
    await setItems(KEYS.SHARE_CODES, codes);
    return codes[index];
  },
  delete: async (childId: string) => {
    const codes = await getItems<ShareCode>(KEYS.SHARE_CODES);
    await setItems(
      KEYS.SHARE_CODES,
      codes.filter((c) => c.childId !== childId)
    );
  },
};
