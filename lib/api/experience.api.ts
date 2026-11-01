import request, { isNotFoundError } from '../context/client';

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

export interface UpdateExperiencePayload {
    id: number;
    userId: number;
    companyName: string;
    designation: string;
    companyLocation: string;
    startDate: string;
    endDate: string | null;
    isCurrent: number;
}

export const experienceApi = {
    createExperience: (data: CreateExperiencePayload) =>
        request<any>('/backend/experience/create', {
            method: 'POST',
            body: data,
        }),

    getExperienceList: async (userId: number | string): Promise<Experience[]> => {
        try {
            const response = await request<Experience[]>(`/backend/profile/experience/list/${userId}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    updateExperience: (id: number | string, data: UpdateExperiencePayload) =>
        request<any>(`/backend/profile/experience/update/${id}`, {
            method: 'PUT',
            body: data,
        }),

    deleteExperience: (id: number | string) =>
        request<any>(`/backend/profile/experience/delete/${id}`, {
            method: 'DELETE',
        }),
};