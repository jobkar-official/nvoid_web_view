import request, { isNotFoundError } from '../context/client';


export interface Skill {
    id: number;
    userId: number;
    skillName: string;
    proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | string;
    year: number;
    month: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SaveSkillPayload {
    userId: number;
    skillName: string;
    proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | string;
    year: number;
    month: number;
}


export const skillsApi = {
    saveSkill: (data: SaveSkillPayload) =>
        request<any>('/backend/skills/save', {
            method: 'POST',
            body: data,
        }),


    getSkillsByUserId: async (userId: number | string): Promise<Skill[]> => {
        try {
            const response = await request<Skill[]>(`/backend/skills/byUserId/${userId}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },


    updateSkill: (id: number | string, data: Partial<SaveSkillPayload> & { userId: number }) =>
        request<any>(`/backend/skills/update/${id}`, {
            method: 'PUT',
            body: data,
        }),

    deleteSkill: (id: number | string) =>
        request<any>(`/backend/skills/delete/${id}`, {
            method: 'DELETE',
        }),
};