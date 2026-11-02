import request from "../context/client";

export interface Experience {
  id: number;
  userId: number;
  companyName: string;
  designation: string;
  companyLocation: string;
  startDate: string;
  endDate: string | null;
  isCurrent: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExperiencePayload {
  userId: number;
  companyName: string;
  designation: string;
  companyLocation: string;
  startDate: string;
  endDate: string | null;
  isCurrent: number;
}

export interface UpdateExperiencePayload extends CreateExperiencePayload {
  id: number;
}

export const experienceApi = {
  createExperience: (data: CreateExperiencePayload) =>
    request<any>("/backend/experience/create", { method: "POST", body: data }),

  getExperienceList: async (userId: number | string): Promise<Experience[]> => {
    const response = await request<any>("/backend/experience/list/" + userId, { method: "GET" });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.result)) return response.result;
    return [];
  },

  updateExperience: (id: number | string, data: UpdateExperiencePayload) =>
    request<any>("/backend/experience/update/" + id, { method: "PUT", body: data }),

  deleteExperience: (id: number | string) =>
    request<any>("/backend/experience/delete/" + id, { method: "DELETE" })
};
