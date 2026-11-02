import request, { isNotFoundError } from "../context/client";

export interface User {
  id: number;
  roleId: number;
  name: string;
  phone: string;
  email: string;
  bio: string | null;
  zipCode?: string | null;
  description: string | null;
  slug: string;
  gender: "MALE" | "FEMALE" | "OTHER" | string | null;
  imageUrl: string | null;
  coverImage?: string | null;
  country: string;
  state: string;
  city: string;
  openToWork?: boolean;
  dob: string | null;
}

export interface RelatedPerson {
  id: number;
  roleId: number;
  name: string;
  slug: string;
  bio: string | null;
  imageUrl: string | null;
}

export interface UpdateSlugPayload {
  slug: string;
  userId: number;
}

export type UpdateProfilePayload = Partial<User> & { id: number };

export const usersApi = {
  getUserDetailBySlug: (slug: string) =>
    request<User>("/backend/users/detailBySlug?slug=" + encodeURIComponent(slug), { method: "GET" }),

  updateSlug: (data: UpdateSlugPayload) =>
    request<any>("/backend/users/updateSlug", { method: "POST", body: data }),

  updateProfile: (userId: number | string, data: UpdateProfilePayload) =>
    request<any>("/backend/users/updateProfile?userId=" + userId, { method: "POST", body: data }),

  updateProfileImage: (userId: number | string, file: File) => {
    const formData = new FormData();
    formData.append("userId", String(userId));
    formData.append("imageUrl", file);
    return request<any>("/users/updateImage", { method: "PATCH", body: formData });
  },

  updateCoverImage: (userId: number | string, file: File) => {
    const formData = new FormData();
    formData.append("userId", String(userId));
    formData.append("imageUrl", file);
    return request<any>("/users/updateCoverImage", { method: "PATCH", body: formData });
  },

  getRelatedPersons: async (userId: number | string, page: number = 1, size: number = 10): Promise<RelatedPerson[]> => {
    try {
      const response = await request<any>("/backend/users/relatedPerson?page=" + page + "&size=" + size + "&userId=" + userId, { method: "GET" });
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response?.result)) return response.result;
      if (Array.isArray(response?.content)) return response.content;
      return [];
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
  }
};
