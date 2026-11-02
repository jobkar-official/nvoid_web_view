import request from "../context/client";

export interface UserResume {
  id: number;
  userId: number;
  resume: string;
  createdAt?: string;
  updatedAt?: string;
}

export const resumeApi = {
  getResumesByUserId: async (userId: number | string): Promise<UserResume[]> => {
    const response = await request<any>("/backend/resumes/byUserId/" + userId, { method: "GET" });
    if (Array.isArray(response)) return response.filter((item: any) => typeof item?.resume === "string" && item.resume.trim());
    if (Array.isArray(response?.data)) return response.data.filter((item: any) => typeof item?.resume === "string" && item.resume.trim());
    if (Array.isArray(response?.result)) return response.result.filter((item: any) => typeof item?.resume === "string" && item.resume.trim());
    const record = response?.data && typeof response.data === "object" ? response.data : response?.result && typeof response.result === "object" ? response.result : response;
    return record && typeof record.resume === "string" && record.resume.trim() ? [record as UserResume] : [];
  },

  uploadResume: (formData: FormData) =>
    request<any>("/backend/resumes/uploadFile", { method: "POST", body: formData }),

  deleteResume: (id: number | string) =>
    request<any>("/backend/resumes/deleteResume/" + id, { method: "DELETE" })
};
