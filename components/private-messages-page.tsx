"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, FileText, Loader2, MessageCircle, Plus, Search, Send, Wifi, WifiOff, X } from "lucide-react";
import { messageApi, type ChatParticipant, type ChatThread } from "../lib/api/message.api";
import { resumeApi, type UserResume } from "../lib/api/resume.api";

type Session = { roleId: 3 | 4 | 7; user: { id?: string; name?: string; fullName?: string; email?: string; slug?: string } };
type ChatMessage = { id?: number | string; senderId: number; receiverId?: number; chatThreadId: number; message: string; messageType?: string; createdAt?: string | number; isRead?: boolean };
type SocketClient = {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  on: (event: string, handler: (...args: any[]) => void) => SocketClient;
  off: (event?: string, handler?: (...args: any[]) => void) => SocketClient;
  emit: (event: string, ...args: any[]) => SocketClient;
};
type WindowWithSocket = Window & { io?: (url?: string, options?: Record<string, unknown>) => SocketClient };

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "wss://chat.jobkar.in";
const SOCKET_HTTP_ORIGIN = SOCKET_URL.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/+$/, "");
const S3_URL = process.env.NEXT_PUBLIC_S3_URL || "https://jobkar-buckets.s3.us-east-1.amazonaws.com/";

function loadSocketClient(): Promise<(url?: string, options?: Record<string, unknown>) => SocketClient> {
  return new Promise((resolve, reject) => {
    const win = window as WindowWithSocket;
    if (win.io) {
      resolve(win.io);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-nvoid-socket-client="true"]');
    if (existing) {
      existing.addEventListener("load", () => win.io ? resolve(win.io) : reject(new Error("Socket.IO client failed to initialize.")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load the chat client.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SOCKET_HTTP_ORIGIN + "/socket.io/socket.io.js";
    script.async = true;
    script.dataset.nvoidSocketClient = "true";
    script.onload = () => win.io ? resolve(win.io) : reject(new Error("Socket.IO client failed to initialize."));
    script.onerror = () => reject(new Error("Could not load the chat client."));
    document.head.appendChild(script);
  });
}

function otherParticipant(thread: ChatThread, userId: number): ChatParticipant | null {
  return thread.participants.find(person => Number(person.id) !== userId) || null;
}

function initials(name?: string | null) {
  return (name?.trim() || "Member").split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "M";
}

function messageKey(message: ChatMessage) {
  return message.id ?? [message.chatThreadId, message.senderId, message.createdAt, message.message].join("-");
}

function messageTime(value?: string | number) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function threadTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function assetUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return SOCKET_HTTP_ORIGIN + (value.startsWith("/") ? value : "/" + value);
}

function safeResumeUrl(value?: string | null) {
  if (!value?.trim()) return null;
  try {
    const normalized = value.trim();
    const url = /^https?:\/\//i.test(normalized) ? new URL(normalized) : new URL(normalized.replace(/^\/+/, ""), S3_URL);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function PrivateMessagesPage({ initialSession }: { initialSession: Session }) {
  const userId = Number(initialSession.user.id || 0);
  const userName = initialSession.user.fullName || initialSession.user.name || "Member";
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [pendingThread, setPendingThread] = useState<ChatThread | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [resume, setResume] = useState<UserResume | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeRequested, setResumeRequested] = useState(false);
  const [resumeRequesting, setResumeRequesting] = useState(false);
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);

  const socketRef = useRef<SocketClient | null>(null);
  const activeThreadIdRef = useRef<number | null>(null);
  const threadsRef = useRef<ChatThread[]>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const sortedThreads = useCallback((items: ChatThread[]) => [...items].sort((a, b) => {
    const aTime = new Date(a.lastMsgTime || 0).getTime();
    const bTime = new Date(b.lastMsgTime || 0).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return Number(b.threadId) - Number(a.threadId);
  }), []);

  const refreshThreads = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await messageApi.getThreadsByUserId(userId);
      setThreads(sortedThreads(result));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load conversations.");
    } finally {
      setLoading(false);
    }
  }, [sortedThreads, userId]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const joinThread = useCallback((threadId: number) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    setOpening(true);
    socket.emit("joinRoom", { chatThreadId: threadId }, (result: { ok?: boolean; error?: string; messages?: ChatMessage[] }) => {
      setOpening(false);
      if (!result?.ok) {
        setError(result?.error || "Could not open this conversation.");
        return;
      }
      const history = Array.isArray(result.messages) ? result.messages : [];
      setMessages(history);
      socket.emit("readMessages", { chatThreadId: threadId });
      setThreads(current => current.map(thread => thread.threadId === threadId ? { ...thread, unreadCount: 0 } : thread));
    });
  }, []);

  const openThread = useCallback((thread: ChatThread) => {
    setError("");
    setPendingThread(thread);
    setActiveThreadId(thread.threadId);
    activeThreadIdRef.current = thread.threadId;
    setMobileConversationOpen(true);
    setMessages([]);
    setResume(null);
    setResumeRequested(false);
    if (socketRef.current?.connected) {
      joinThread(thread.threadId);
    } else {
      setOpening(true);
    }
  }, [joinThread]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Your account ID was not returned by authentication. Messaging cannot load without it.");
      return;
    }

    let disposed = false;
    let socket: SocketClient | null = null;

    const initialize = async () => {
      try {
        await refreshThreads();
        const credentialResponse = await fetch("/api/auth/socket-token", { cache: "no-store", credentials: "same-origin" });
        const credential = await credentialResponse.json().catch(() => ({}));
        if (!credentialResponse.ok || typeof credential.token !== "string" || !credential.token) {
          throw new Error(credential.error || "Your chat session could not be authenticated. Please sign in again.");
        }
        const io = await loadSocketClient();
        if (disposed) return;

        socket = io(SOCKET_URL, {
          autoConnect: false,
          auth: { token: credential.token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 8,
          reconnectionDelay: 1000,
          timeout: 10000
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          if (disposed || !socket) return;
          setConnected(true);
          setError("");
          socket.emit("register", (result: { ok?: boolean; error?: string }) => {
            if (!result?.ok) {
              setError(result?.error || "Chat registration failed.");
              return;
            }
            const currentThread = activeThreadIdRef.current;
            if (currentThread) joinThread(currentThread);
          });
        });

        socket.on("chatHistory", (payload: { chatThreadId?: number; messages?: ChatMessage[] }) => {
          if (!payload.chatThreadId || Number(payload.chatThreadId) !== activeThreadIdRef.current) return;
          setMessages(Array.isArray(payload.messages) ? payload.messages : []);
          setOpening(false);
        });

        socket.on("newMessage", (payload: { message?: ChatMessage }) => {
          const message = payload?.message;
          if (!message) return;
          const threadId = Number(message.chatThreadId);
          const exists = threadsRef.current.some(thread => thread.threadId === threadId);
          setThreads(current => sortedThreads(current.map(thread => thread.threadId === threadId ? {
            ...thread,
            lastMsg: message.message,
            lastMsgTime: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString()
          } : thread)));
          if (!exists) void refreshThreads();
          if (threadId !== activeThreadIdRef.current) return;
          setMessages(current => current.some(item => String(messageKey(item)) === String(messageKey(message))) ? current : [...current, message]);
        });

        socket.on("messageNotification", (payload: { chatThreadId?: number; message?: string; unreadCount?: number }) => {
          const threadId = Number(payload?.chatThreadId || 0);
          if (!threadId) return;
          setThreads(current => sortedThreads(current.map(thread => thread.threadId === threadId ? {
            ...thread,
            lastMsg: payload.message || thread.lastMsg,
            unreadCount: threadId === activeThreadIdRef.current ? 0 : Number(payload.unreadCount || 0),
            lastMsgTime: new Date().toISOString()
          } : thread)));
          if (!threadsRef.current.some(thread => thread.threadId === threadId)) void refreshThreads();
        });

        socket.on("unreadCountUpdate", (payload: { chatThreadId?: number; unreadCount?: number }) => {
          const threadId = Number(payload?.chatThreadId || 0);
          if (!threadId) return;
          setThreads(current => current.map(thread => thread.threadId === threadId ? {
            ...thread,
            unreadCount: threadId === activeThreadIdRef.current ? 0 : Number(payload.unreadCount || 0)
          } : thread));
        });

        socket.on("authExpired", () => {
          setConnected(false);
          setError("Your chat session expired. Please sign in again.");
        });

        socket.on("connect_error", (cause: Error) => {
          setConnected(false);
          setError(cause.message || "Live messaging is unavailable.");
        });

        socket.on("disconnect", () => {
          if (!disposed) setConnected(false);
        });

        socket.connect();
      } catch (cause) {
        if (!disposed) {
          setLoading(false);
          setError(cause instanceof Error ? cause.message : "Could not initialize messaging.");
        }
      }
    };

    void initialize();

    return () => {
      disposed = true;
      socket?.off();
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [joinThread, refreshThreads, sortedThreads, userId]);

  const activeThread = useMemo(() => threads.find(thread => thread.threadId === activeThreadId) || (pendingThread?.threadId === activeThreadId ? pendingThread : null), [activeThreadId, pendingThread, threads]);
  const partner = activeThread ? otherParticipant(activeThread, userId) : null;

  useEffect(() => {
    let active = true;
    const loadResume = async () => {
      if (!partner?.id) {
        setResume(null);
        setResumeLoading(false);
        return;
      }
      setResumeLoading(true);
      setResume(null);
      try {
        const records = await resumeApi.getResumesByUserId(partner.id);
        if (active) setResume(records[0] || null);
      } catch {
        if (active) setResume(null);
      } finally {
        if (active) setResumeLoading(false);
      }
    };
    void loadResume();
    return () => { active = false; };
  }, [partner?.id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter(thread => {
      const person = otherParticipant(thread, userId);
      return [person?.name, person?.slug, thread.lastMsg].some(value => String(value || "").toLowerCase().includes(query));
    });
  }, [search, threads, userId]);

  const totalUnread = useMemo(() => threads.reduce((sum, thread) => sum + Number(thread.unreadCount || 0), 0), [threads]);

  const createConversation = async () => {
    const targetId = Number(newUserId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      setError("Enter a valid Jobkar user ID.");
      return;
    }
    if (targetId === userId) {
      setError("You cannot message yourself.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const response = await messageApi.createChatRoom(userId, targetId);
      const threadId = Number(response?.thread?.id ?? response?.thread?.threadId ?? response?.id ?? 0);
      if (!threadId) throw new Error("The chat room was created without a valid thread ID.");
      const thread = await messageApi.getThreadById(threadId);
      if (!thread) throw new Error("The new conversation could not be loaded.");
      setThreads(current => sortedThreads([thread, ...current.filter(item => item.threadId !== thread.threadId)]));
      setPendingThread(thread);
      openThread(thread);
      setNewUserId("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create this conversation.");
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = () => {
    const text = draft.trim();
    const socket = socketRef.current;
    if (!text || !socket?.connected || !activeThread || sending) return;
    if (!partner?.id) {
      setError("The conversation participant could not be identified.");
      return;
    }
    setSending(true);
    socket.emit("privateMessage", {
      receiverId: Number(partner.id),
      message: text,
      chatThreadId: activeThread.threadId
    }, (result: { ok?: boolean; error?: string }) => {
      setSending(false);
      if (!result?.ok) {
        setError(result?.error || "Message could not be sent.");
        return;
      }
      setDraft("");
    });
  };

  const requestResume = () => {
    const socket = socketRef.current;
    if (!socket?.connected || !activeThread || !partner || resumeRequesting || resumeRequested) return;
    setResumeRequesting(true);
    const partnerName = partner.name?.trim() || "there";
    socket.emit("privateMessage", {
      receiverId: Number(partner.id),
      message: "Hi " + partnerName + ", I would like to review your latest resume for an opportunity. Please upload your current resume to your Jobkar profile so I can view it here. Thank you.",
      chatThreadId: activeThread.threadId
    }, (result: { ok?: boolean; error?: string }) => {
      setResumeRequesting(false);
      if (!result?.ok) {
        setError(result?.error || "Could not send the resume request.");
        return;
      }
      setResumeRequested(true);
    });
  };

  if (!userId) return <div className="nv-chat-page nv-private-page"><div className="nv-chat-error">Your account information is unavailable. Sign in again to use Messages.</div></div>;

  return (
    <div className="nv-chat-page">
      <div className="nv-chat-heading">
        <div><span>WORKSPACE · COMMUNICATION</span><h1>Messages</h1><p>Keep your professional conversations moving.</p></div>
        <div className="nv-chat-heading-meta">
          <span className={"nv-chat-connection " + (connected ? "is-online" : "is-offline")}>{connected ? <Wifi size={13} /> : <WifiOff size={13} />}{connected ? "Live" : "Connecting"}</span>
          {totalUnread > 0 && <span className="nv-chat-unread-total">{totalUnread > 99 ? "99+" : totalUnread} unread</span>}
        </div>
      </div>

      {error && <div className="nv-chat-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={15} /></button></div>}

      <section className="nv-chat-layout">
        <aside className={"nv-chat-inbox" + (mobileConversationOpen ? " is-hidden-mobile" : "")}>
          <div className="nv-chat-inbox-tools">
            <label className="nv-chat-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations" /></label>
            <div className="nv-chat-new">
              <input value={newUserId} onChange={event => setNewUserId(event.target.value.replace(/\D/g, ""))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void createConversation(); } }} inputMode="numeric" placeholder="Jobkar user ID" aria-label="Jobkar user ID" />
              <button type="button" onClick={() => void createConversation()} disabled={creating || !newUserId}><Plus size={15} />{creating ? "Opening" : "New chat"}</button>
            </div>
          </div>
          <div className="nv-chat-thread-list">
            {loading ? <div className="nv-chat-list-state"><Loader2 size={20} />Loading conversations</div> : filteredThreads.length === 0 ? (
              <div className="nv-chat-list-empty"><MessageCircle size={22} /><strong>{search ? "No matching conversations" : "No conversations yet"}</strong><p>{search ? "Try another name or message." : "Start a new chat using a Jobkar user ID."}</p></div>
            ) : filteredThreads.map(thread => {
              const person = otherParticipant(thread, userId);
              const active = thread.threadId === activeThreadId;
              return <button type="button" key={thread.threadId} className={"nv-chat-thread" + (active ? " is-active" : "")} onClick={() => openThread(thread)}>
                {person?.image_url ? <img className="nv-chat-avatar" src={person.image_url} alt="" /> : <span className="nv-chat-avatar nv-chat-avatar-fallback">{initials(person?.name)}</span>}
                <span className="nv-chat-thread-copy"><span className="nv-chat-thread-top"><strong>{person?.name || "Jobkar member"}</strong><time>{threadTime(thread.lastMsgTime)}</time></span><span className="nv-chat-thread-bottom"><small>{thread.lastMsg || "Start a conversation"}</small>{thread.unreadCount > 0 && <i>{thread.unreadCount > 99 ? "99+" : thread.unreadCount}</i>}</span></span>
              </button>;
            })}
          </div>
          <div className="nv-chat-inbox-footer"><span>{userName}</span><span>{threads.length} conversation{threads.length === 1 ? "" : "s"}</span></div>
        </aside>

        {activeThread ? (
          <section className={"nv-chat-conversation" + (!mobileConversationOpen ? " is-hidden-mobile" : "")}>
            <header className="nv-chat-conversation-header">
              <button type="button" className="nv-chat-back" onClick={() => setMobileConversationOpen(false)} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
              {partner?.image_url ? <img className="nv-chat-avatar nv-chat-avatar-large" src={partner.image_url} alt="" /> : <span className="nv-chat-avatar nv-chat-avatar-fallback nv-chat-avatar-large">{initials(partner?.name)}</span>}
              <div className="nv-chat-person"><strong>{partner?.name || "Jobkar member"}</strong><small>{partner?.slug ? "@" + partner.slug : "Private conversation"}</small></div>
              <span className={"nv-chat-connection" + (connected ? " is-online" : " is-offline")}>{connected ? <Wifi size={12} /> : <WifiOff size={12} />}{connected ? "Live" : "Offline"}</span>
            </header>

            <div className="nv-chat-resume">
              <span className="nv-chat-resume-icon"><FileText size={17} /></span>
              <div><strong>Candidate resume</strong><small>{resumeLoading ? "Checking profile…" : resume ? "Resume is available on this profile." : "No resume uploaded to this profile yet."}</small></div>
              {!resumeLoading && resume && safeResumeUrl(resume.resume) ? <a href={safeResumeUrl(resume.resume) || undefined} target="_blank" rel="noopener noreferrer"><FileText size={14} /> View resume <ExternalLink size={12} /></a> : !resumeLoading && !resume ? <button type="button" onClick={requestResume} disabled={!connected || resumeRequesting || resumeRequested}>{resumeRequesting ? <Loader2 size={13} /> : <Send size={13} />}{resumeRequested ? "Request sent" : "Request resume"}</button> : null}
            </div>

            <div className="nv-chat-messages">
              {opening ? <div className="nv-chat-list-state"><Loader2 size={20} />Loading messages</div> : messages.length === 0 ? (
                <div className="nv-chat-start"><span><MessageCircle size={23} /></span><strong>Start the conversation</strong><p>Send a message to start chatting with this person.</p></div>
              ) : messages.map((message, index) => {
                const own = Number(message.senderId) === userId;
                const type = message.messageType || "text";
                return <div className={"nv-chat-message-row" + (own ? " is-own" : "")} key={String(messageKey(message) || index)}>
                  <article className={"nv-chat-bubble" + (own ? " is-own" : "")}>
                    {type === "image" ? <img src={assetUrl(message.message)} alt="Shared image" /> : type === "video" ? <video src={assetUrl(message.message)} controls preload="metadata" /> : type === "audio" ? <audio src={assetUrl(message.message)} controls preload="metadata" /> : type === "file" ? <a href={assetUrl(message.message)} target="_blank" rel="noopener noreferrer"><FileText size={16} />{decodeURIComponent(message.message.split("/").pop() || "Attachment").replace(/^[0-9a-f-]{36}-/, "")}<ExternalLink size={12} /></a> : <p>{message.message}</p>}
                    <small><time>{messageTime(message.createdAt)}</time>{own && <Check size={11} />}</small>
                  </article>
                </div>;
              })}
              <div ref={messageEndRef} />
            </div>

            <footer className="nv-chat-composer">
              <input value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} disabled={!connected || sending} placeholder={connected ? "Write a message…" : "Connecting to chat…"} aria-label="Write a message" />
              <button type="button" onClick={sendMessage} disabled={!connected || !draft.trim() || sending} aria-label="Send message">{sending ? <Loader2 size={17} /> : <Send size={17} />}</button>
            </footer>
          </section>
        ) : (
          <div className={"nv-chat-placeholder" + (mobileConversationOpen ? " is-hidden-mobile" : "")}><span><MessageCircle size={25} /></span><strong>Your conversations</strong><p>Select a conversation or enter a Jobkar user ID to start a new chat.</p></div>
        )}
      </section>
    </div>
  );
}
