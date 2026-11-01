import request, { isNotFoundError, JOBKAR_CHAT_URL } from "../context/client";

export interface ChatParticipant {
    id: string;
    name: string;
    image_url: string | null;
    role_id: string;
    phone: string;
    slug?: string;
}

export interface ChatThread {
    threadId: number;
    lastMsg: string | null;
    lastMsgTime: string | null;
    unreadCount: number;
    chatType: 'private' | 'group';
    participants: ChatParticipant[];
}

const normalizeParticipant = (participant: any): ChatParticipant => ({
    ...participant,
    id: String(participant?.id ?? ''),
    image_url: participant?.image_url ?? participant?.imageUrl ?? null,
    role_id: String(participant?.role_id ?? participant?.roleId ?? ''),
});

const normalizeThread = (thread: any): ChatThread => ({
    ...thread,
    threadId: Number(thread?.threadId ?? thread?.id ?? 0),
    lastMsg: thread?.lastMsg ?? null,
    lastMsgTime: thread?.lastMsgTime ?? null,
    unreadCount: Number(thread?.unreadCount ?? 0),
    chatType: thread?.chatType === 'group' ? 'group' : 'private',
    participants: Array.isArray(thread?.participants)
        ? thread.participants.map(normalizeParticipant)
        : [],
});

const normalizeThreads = (response: any): ChatThread[] => {
    const rawThreads: unknown[] =
        Array.isArray(response)
            ? response
            : Array.isArray(response?.threads)
                ? response.threads
                : Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response?.result)
                        ? response.result
                        : [];

    return rawThreads
        .map(normalizeThread)
        .filter(thread => thread.chatType === 'private' && thread.participants.length > 0)
        .filter(thread => Boolean(thread.lastMsgTime || thread.lastMsg?.trim()))
        .sort((a, b) => {
            const aTime = new Date(a.lastMsgTime || 0).getTime();
            const bTime = new Date(b.lastMsgTime || 0).getTime();
            if (bTime !== aTime) return bTime - aTime;
            return Number(b.threadId) - Number(a.threadId);
        })
        .reduce((unique: ChatThread[], thread: ChatThread) => {
            const partnerId = thread.participants.find(
                participant => participant.id,
            )?.id;

            if (
                partnerId &&
                unique.some(existing =>
                    existing.participants.some(
                        participant => participant.id === partnerId,
                    ),
                )
            ) {
                return unique;
            }

            unique.push(thread);
            return unique;
        }, [] as ChatThread[]);
};

export const messageApi = {

    getThreadsByUserId: async (userId: string | number): Promise<ChatThread[]> => {
        try {
            const response = await request<any>(JOBKAR_CHAT_URL + '/thread/' + userId, {
                method: 'GET',
            });
            return normalizeThreads(response);
        } catch (error) {
            if (isNotFoundError(error)) return [];
            throw error;
        }
    },

    getThreadById: async (threadId: number): Promise<ChatThread | null> => {
        try {
            const response = await request<any>(JOBKAR_CHAT_URL + '/chat/thread/' + threadId, {
                method: 'GET',
            });

            if (!response?.thread) return null;
            return normalizeThread(response.thread);
        } catch (error) {
            if (isNotFoundError(error)) return null;
            throw error;
        }
    },

    createChatRoom: (senderId: number, receiverId: number) => {
        return request<any>(JOBKAR_CHAT_URL + '/chat/thread', {
            method: 'POST',
            body: { participants: [senderId, receiverId] },
        });
    },

    getChatHistory: async (senderId: number, receiverId: number) => {
        try {
            const response = await request<any>(JOBKAR_CHAT_URL + '/chat/' + senderId + '/' + receiverId, {
                method: 'GET',
            })
            if (Array.isArray(response)) return response
            if (Array.isArray(response?.messages)) return response.messages
            if (Array.isArray(response?.data)) return response.data
            if (Array.isArray(response?.result)) return response.result
            return []
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },
}