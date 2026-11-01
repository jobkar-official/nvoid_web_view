import request, { isNotFoundError } from '../context/client';

export interface UserResume {
    id: number;
    userId: number;
    resume: string;
    createdAt?: string;
    updatedAt?: string;
}

export const resumeApi = {
    getResumesByUserId: async (userId: number | string): Promise<UserResume[]> => {
        try {
            const response = await request<UserResume[]>(`/backend/resumes/byUserId/${userId}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            if ((response as any)?.data?.id && (response as any)?.data?.resume) return [(response as any).data]
            if ((response as any)?.result?.id && (response as any)?.result?.resume) return [(response as any).result]
            if ((response as any)?.id && (response as any)?.resume) return [response as UserResume]
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    uploadResume: (formData: FormData) =>
        request<any>('/backend/profile/resumes/uploadFile', {
            method: 'POST',
            body: formData,
        }),

    deleteResume: (id: number | string) =>
        request<any>(`/backend/profile/resumes/deleteResume/${id}`, {
            method: 'DELETE',
        }),
};