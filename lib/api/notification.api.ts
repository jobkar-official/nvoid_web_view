import request, { isNotFoundError } from '../context/client';

export interface NotificationRecord {
    id: number;
    userId: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationApi = {
    getNotificationsByUserId: async (userId: number | string): Promise<NotificationRecord[]> => {
        try {
            const response = await request<NotificationRecord[]>(`/backend/notification/findByUserId/${userId}`, { method: 'GET' })
            if (Array.isArray(response)) return response
            if (Array.isArray((response as any)?.data)) return (response as any).data
            if (Array.isArray((response as any)?.result)) return (response as any).result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    markAsRead: (id: number | string) =>
        request<any>(`/backend/notification/markAsRead/${id}`, {
            method: 'POST',
        }),

    deleteNotification: (id: number | string) =>
        request<any>(`/backend/notification/delete/${id}`, {
            method: 'DELETE',
        }),
};