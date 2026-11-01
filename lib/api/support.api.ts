import request, { isNotFoundError } from '../context/client';


export interface SupportTicket {
    id: number;
    userId: number;
    subject: string;
    description: string;
    status: 'OPEN' | 'CLOSED' | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTicketPayload {
    userId: number;
    subject: string;
    description: string;
}

export interface CloseTicketPayload {
    userId: number;
    subject: string;
    description: string;
}


export const supportApi = {

    createTicket: (data: CreateTicketPayload) =>
        request<any>('/backend/support/create', {
            method: 'POST',
            body: data,
        }),


    closeTicket: (ticketId: number | string, data: CloseTicketPayload) =>
        request<any>(`/backend/support/closed/${ticketId}`, {
            method: 'PUT',
            body: data,
        }),


    getTicketsByStatus: (status: 'OPEN' | 'CLOSED' | string, page: number = 0, size: number = 10) =>
        request<SupportTicket[]>(`/backend/support/status?page=${page}&size=${size}&status=${status}`, {
            method: 'GET',
        }),


    getTicketsByUserId: async (userId: number | string, page: number = 0, size: number = 10): Promise<SupportTicket[]> => {
        try {
            const response = await request<SupportTicket[]>(`/backend/support/user/${userId}?page=${page}&size=${size}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },
};