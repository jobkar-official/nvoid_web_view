import request, { isNotFoundError } from '../context/client';

export interface FavouriteJobRecord {
    id: number;
    jobId: number;
    companyId: number;
    title: string;
    experience: string;
    workMode: string;
    jobType: string;
    slug: string;
    companyName: string;
    salaryRange: string;
    totalApplied: number;
    subCategoryId: string;
    currencyType: string;
    state: string;
    city: string;
    requiredSkills: string;
    createdAt: string;
}

export const generalApi = {
    saveFavourite: (data: { userId: number; jobId: number; companyId: number }) =>
        request<any>('/backend/favouriteJobs/save', { method: 'POST', body: data }),
    getFavouriteJobsByUserId: async (userId: number | string): Promise<FavouriteJobRecord[]> => {
        try {
            const response = await request<FavouriteJobRecord[]>(`/backend/favouriteJobs/findByUserId/${userId}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    deleteFavouriteApplication: (id: number | string) =>
        request<FavouriteJobRecord[]>(`/backend/favouriteJobs/delete/${id}`, {
            method: 'DELETE',
        }),
};