import request from "../context/client";

export interface UserLanguage {
  id: number;
  userId: number;
  language: string;
  proficiency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveLanguagePayload {
  userId: number;
  language: string;
  proficiency: string;
}

export const languageApi = {
  saveLanguage: (data: SaveLanguagePayload) =>
    request<any>("/backend/language/save", { method: "POST", body: data }),

  getLanguagesByUserId: async (userId: number | string): Promise<UserLanguage[]> => {
    const response = await request<any>("/backend/language/user/" + userId, { method: "GET" });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.result)) return response.result;
    return [];
  },

  deleteLanguage: (id: number | string) =>
    request<any>("/backend/language/delete/" + id, { method: "DELETE" })
};
