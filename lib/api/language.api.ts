import request, { isNotFoundError } from "../context/client";

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

export interface DeleteLanguagePayload {
  userId: number;
  language: string;
}

export const languageApi = {
  saveLanguage: (data: SaveLanguagePayload) =>
    request<any>("/backend/language/save", {
      method: "POST",
      body: data
    }),

  getLanguagesByUserId: async (userId: number | string): Promise<UserLanguage[]> => {
    try {
      const response = await request<UserLanguage[]>(`/backend/language/user/${userId}`, { method: "GET" });
      if (Array.isArray(response)) return response;
      if (Array.isArray((response as any)?.data)) return (response as any).data;
      if (Array.isArray((response as any)?.result)) return (response as any).result;
      return [];
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
  },

  deleteLanguage: (id: number | string, data: DeleteLanguagePayload) =>
    request<any>(`/backend/language/delete/${id}`, {
      method: "DELETE",
      body: data
    })
};
