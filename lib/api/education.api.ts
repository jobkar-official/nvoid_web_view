import request, { isNotFoundError } from '../context/client';

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

export interface UpdateQualificationPayload {
    id: number;
    userId: number;
    qualification: string;
    boardOrUniversity: string;
    completeYear: number;
    startYear: number;
    from: string;
    grade: string;
}

export const qualificationApi = {
    saveQualification: (data: SaveQualificationPayload) =>
        request<any>('/backend/profile/qualifications/save', {
            method: 'POST',
            body: data,
        }),

    getQualificationsByUserId: async (userId: number | string): Promise<Qualification[]> => {
        try {
            const response = await request<Qualification[]>(`/backend/profile/qualifications/byUserId/${userId}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    updateQualification: (id: number | string, data: UpdateQualificationPayload) =>
        request<any>(`/backend/profile/qualifications/update/${id}`, {
            method: 'PUT',
            body: data,
        }),

    deleteQualification: (id: number | string) =>
        request<any>(`/backend/profile/qualifications/delete/${id}`, {
            method: 'DELETE',
        }),
};