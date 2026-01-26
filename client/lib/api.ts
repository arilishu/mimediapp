import { getApiUrl, getAuthToken } from "@/lib/query-client";
import type {
  Child,
  MedicalVisit,
  VisitPhoto,
  Doctor,
  Medication,
  Vaccine,
  VaccineWithChild,
  Appointment,
  Allergy,
  PastDisease,
  Hospital,
} from "@/types";

const apiUrl = getApiUrl();

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(path, apiUrl).toString();
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  
  return response.json();
}

// ==================== CHILDREN API ====================
export const ChildrenAPI = {
  getAll: (userId: string) => 
    fetchJson<Child[]>(`/api/children?userId=${userId}`),
  
  getById: (id: string, userId: string) =>
    fetchJson<Child>(`/api/children/${id}?userId=${userId}`),
  
  create: (data: Omit<Child, "id" | "createdAt">) =>
    fetchJson<Child>("/api/children", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Child>) =>
    fetchJson<Child>(`/api/children/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/children/${id}`, {
      method: "DELETE",
    }),
};

// ==================== MEDICAL VISITS API ====================
export const VisitsAPI = {
  getByChildId: (childId: string) =>
    fetchJson<MedicalVisit[]>(`/api/visits?childId=${childId}`),
  
  create: (data: Omit<MedicalVisit, "id" | "createdAt" | "photos">) =>
    fetchJson<MedicalVisit>("/api/visits", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Omit<MedicalVisit, "photos">>) =>
    fetchJson<MedicalVisit>(`/api/visits/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/visits/${id}`, {
      method: "DELETE",
    }),
};

// ==================== VISIT PHOTOS API ====================
export const VisitPhotosAPI = {
  getByVisitId: (visitId: string) =>
    fetchJson<VisitPhoto[]>(`/api/visit-photos?visitId=${visitId}`),
  
  create: (visitId: string, photoData: string) =>
    fetchJson<VisitPhoto>("/api/visit-photos", {
      method: "POST",
      body: JSON.stringify({ visitId, photoData }),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/visit-photos/${id}`, {
      method: "DELETE",
    }),
};

// ==================== VACCINES API ====================
export const VaccinesAPI = {
  getByChildId: (childId: string) =>
    fetchJson<Vaccine[]>(`/api/vaccines?childId=${childId}`),
  
  getPendingByUser: (userId: string) =>
    fetchJson<VaccineWithChild[]>(`/api/vaccines/user/${userId}`),
  
  create: (data: Omit<Vaccine, "id" | "createdAt">) =>
    fetchJson<Vaccine>("/api/vaccines", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  createBatch: (childId: string, vaccines: { name: string; recommendedAge: string }[]) =>
    fetchJson<Vaccine[]>("/api/vaccines/batch", {
      method: "POST",
      body: JSON.stringify({ childId, vaccines }),
    }),
  
  update: (id: string, data: Partial<Vaccine>) =>
    fetchJson<Vaccine>(`/api/vaccines/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/vaccines/${id}`, {
      method: "DELETE",
    }),
};

// ==================== APPOINTMENTS API ====================
export const AppointmentsAPI = {
  getByChildId: (childId: string) =>
    fetchJson<Appointment[]>(`/api/appointments?childId=${childId}`),
  
  getUpcomingByUser: (userId: string) =>
    fetchJson<Appointment[]>(`/api/appointments/user/${userId}`),
  
  create: (data: Omit<Appointment, "id" | "createdAt">) =>
    fetchJson<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Appointment>) =>
    fetchJson<Appointment>(`/api/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/appointments/${id}`, {
      method: "DELETE",
    }),
};

// ==================== ALLERGIES API ====================
export const AllergiesAPI = {
  getByChildId: (childId: string) =>
    fetchJson<Allergy[]>(`/api/allergies?childId=${childId}`),
  
  create: (data: Omit<Allergy, "id" | "createdAt">) =>
    fetchJson<Allergy>("/api/allergies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Allergy>) =>
    fetchJson<Allergy>(`/api/allergies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/allergies/${id}`, {
      method: "DELETE",
    }),
};

// ==================== PAST DISEASES API ====================
export const DiseasesAPI = {
  getByChildId: (childId: string) =>
    fetchJson<PastDisease[]>(`/api/diseases?childId=${childId}`),
  
  create: (data: Omit<PastDisease, "id" | "createdAt">) =>
    fetchJson<PastDisease>("/api/diseases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<PastDisease>) =>
    fetchJson<PastDisease>(`/api/diseases/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/diseases/${id}`, {
      method: "DELETE",
    }),
};

// ==================== DOCTORS API ====================
export const DoctorsAPI = {
  getAll: (userId: string) =>
    fetchJson<Doctor[]>(`/api/doctors?userId=${userId}`),
  
  create: (data: Omit<Doctor, "id" | "createdAt"> & { ownerId: string }) =>
    fetchJson<Doctor>("/api/doctors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Doctor>) =>
    fetchJson<Doctor>(`/api/doctors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/doctors/${id}`, {
      method: "DELETE",
    }),
};

// ==================== MEDICATIONS API ====================
export const MedicationsAPI = {
  getByChildId: (childId: string) =>
    fetchJson<Medication[]>(`/api/medications?childId=${childId}`),
  
  create: (data: Omit<Medication, "id" | "createdAt">) =>
    fetchJson<Medication>("/api/medications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Medication>) =>
    fetchJson<Medication>(`/api/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/medications/${id}`, {
      method: "DELETE",
    }),
};

// ==================== HOSPITALS API ====================
export const HospitalsAPI = {
  getAll: (userId: string) =>
    fetchJson<Hospital[]>(`/api/hospitals?userId=${userId}`),
  
  create: (data: Omit<Hospital, "id" | "createdAt"> & { ownerId: string }) =>
    fetchJson<Hospital>("/api/hospitals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Hospital>) =>
    fetchJson<Hospital>(`/api/hospitals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/hospitals/${id}`, {
      method: "DELETE",
    }),
};

// ==================== CHILD ACCESS API ====================
export const ChildAccessAPI = {
  create: (childId: string, userId: string, isReadOnly: boolean) =>
    fetchJson<{ success: boolean }>("/api/child-access", {
      method: "POST",
      body: JSON.stringify({ childId, userId, isReadOnly }),
    }),
};
