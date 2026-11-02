import request from "../context/client";

export interface Qualification {
  id: number;
  userId: number;
  qualification: string;
  boardOrUniversity: string;
  completeYear: number;
  startYear: number;
  from: string;
  grade: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveQualificationPayload {
  userId: number;
  qualification: string;
  boardOrUniversity: string;
  completeYear: number;
  startYear: number;
  from: string;
  grade: string;
}

export interface UpdateQualificationPayload extends SaveQualificationPayload {
  id: number;
}

export const qualificationApi = {
  saveQualification: (data: SaveQualificationPayload) =>
    request<any>("/backend/qualifications/save", { method: "POST", body: data }),

  getQualificationsByUserId: async (userId: number | string): Promise<Qualification[]> => {
    const response = await request<any>("/backend/qualifications/byUserId/" + userId, { method: "GET" });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.result)) return response.result;
    return [];
  },

  updateQualification: (id: number | string, data: UpdateQualificationPayload) =>
    request<any>("/backend/qualifications/update/" + id, { method: "PUT", body: data }),

  deleteQualification: (id: number | string) =>
    request<any>("/backend/qualifications/delete/" + id, { method: "DELETE" })
};
