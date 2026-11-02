import request from "../context/client";

export interface Skill {
  id: number;
  userId: number;
  skillName: string;
  proficiencyLevel: string;
  year: number;
  month: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveSkillPayload {
  userId: number;
  skillName: string;
  proficiencyLevel: string;
  year: number;
  month: number;
}

export const skillsApi = {
  saveSkill: (data: SaveSkillPayload) =>
    request<any>("/backend/skills/save", { method: "POST", body: data }),

  getSkillsByUserId: async (userId: number | string): Promise<Skill[]> => {
    const response = await request<any>("/backend/skills/byUserId/" + userId, { method: "GET" });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.result)) return response.result;
    return [];
  },

  deleteSkill: (id: number | string) =>
    request<any>("/backend/skills/delete/" + id, { method: "DELETE" })
};
