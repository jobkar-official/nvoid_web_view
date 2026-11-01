import request, { isNotFoundError } from '../context/client';

export interface OpenToWorkRecord {
    id?: number;
    userId: number;
    name?: string;
    phoneNumber?: string;
    email?: string;
    noticePeriod: string;
    experienceYears: number;
    experienceMonths: number;
    expectedSalaryMin: number;
    expectedSalaryMax: number;
    highestEducation: string;
    jobTitle: string;
    jobType: string;
    createdAt?: string;
}


export interface JobRecommended {
    jobId: number;
    companyId: number;
    title: string;
    experience: string;
    workMode: 'On-site' | 'Remote' | 'Hybrid' | string;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | string;
    slug: string;
    companyName: string;
    salaryRange: string;
    totalApplied: number;
    isFavorite: boolean;
    currency: string;
    state: string;
    city: string;
    isVerified: boolean;
    createdAt: string;
}

export const openToWorkApi = {
    saveStatus: (data: OpenToWorkRecord) =>
        request<any>('/backend/open_to_work/save', {
            method: 'POST',
            body: data,
        }),

    getByUserId: async (userId: number | string): Promise<OpenToWorkRecord | null> => {
        try {
            return await request<OpenToWorkRecord>(`/backend/open_to_work/byUserId/${userId}`, {
                method: 'GET',
            })
        } catch (error) {
            if (isNotFoundError(error)) return null
            throw error
        }
    },

    
    getRecommendedJobByUserId: async (userId: number | string): Promise<JobRecommended[]> => {
        try {
            const response = await request<JobRecommended[]>(`/backend/job/recommended?userId=${userId}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },


    toggleStatus: (userId: number | string) =>
        request<any>(`/backend/open_to_work/ChangeStatus/${userId}`, {
            method: 'POST',
        }),

    deleteStatus: (id: number | string) =>
        request<any>(`/backend/open_to_work/delete/${id}`, {
            method: 'DELETE',
        }),
};