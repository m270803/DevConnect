
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Check,
  Circle,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smile,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "../lib/api";
import VideoCall from "../components/VideoCall";

type AnyRecord = Record<string, any>;
type SocketAckResponse = { success?: boolean; message?: string };

type ChatMessage = {
  _id?: string;
  id?: string;
  conversationId?: string | AnyRecord;
  conversation?: string | AnyRecord;
  senderId?: string | AnyRecord;
  sender?: string | AnyRecord;
  content?: string;
  text?: string;
  body?: string;
  createdAt?: string;
};

type Conversation = {
  _id?: string;
  id?: string;
  clientId?: AnyRecord;
  professionalId?: AnyRecord;
  participants?: AnyRecord[];
  members?: AnyRecord[];
  project?: AnyRecord;
  projectId?: AnyRecord;
  lastMessage?: ChatMessage | string;
  updatedAt?: string;
};

function unwrap(result: any): any {
  return result?.data?.data ?? result?.data ?? result;
}

function getId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id ?? value.id ?? "");
}

function getConversationRecipientId(
  conversation: Conversation,
  currentUserId: string
): string {
  const clientId = getId(conversation.clientId);
  const professionalId = getId(conversation.professionalId);

  if (currentUserId === clientId) return professionalId;
  if (currentUserId === professionalId) return clientId;

  const participants = conversation.participants ?? conversation.members ?? [];
  return getId(
    participants.find((participant) => getId(participant) !== currentUserId)
  );
}

function getMessageText(message: ChatMessage | string | undefined): string {
  if (typeof message === "string") return message;
  return message?.content ?? message?.text ?? message?.body ?? "";
}

function getMessageSender(message: ChatMessage): string {
  return getId(message.senderId ?? message.sender);
}

function getConversationName(
  conversation: Conversation,
  currentUserId: string
): string {
  const participants = conversation.participants ?? conversation.members ?? [];
  const other = participants.find(
    (person) => getId(person) !== currentUserId
  );

  if (other) {
    return (
      other.name ??
      other.fullName ??
      other.username ??
      other.email ??
      "SkillConnect member"
    );
  }

  const project = conversation.project ?? conversation.projectId;
  if (project && typeof project === "object") {
    return project.title ?? project.name ?? "Project conversation";
  }

  return "SkillConnect member";
}

function getProjectTitle(conversation: Conversation): string {
  const project = conversation.project ?? conversation.projectId;

  if (project && typeof project === "object") {
    return project.title ?? project.name ?? "";
  }

  return "";
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "SC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatTime(value?: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatConversationTime(value?: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return formatTime(value);
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function formatDateLabel(value?: string): string {
  if (!value) return "Earlier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year:
      date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function sortMessages(list: ChatMessage[]): ChatMessage[] {
  return [...list].sort((a, b) => {
    const first = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const second = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return first - second;
  });
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const deepLinkHandledRef = useRef(false);
  const selectedId = getId(selected);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const selectedName = selected
    ? getConversationName(selected, currentUserId)
    : "";

  const selectedProject = selected ? getProjectTitle(selected) : "";

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    const list = conversations.filter((conversation) => {
      if (!query) return true;

      const name = getConversationName(conversation, currentUserId);
      const project = getProjectTitle(conversation);

      return (
        name.toLowerCase().includes(query) ||
        project.toLowerCase().includes(query) ||
        getMessageText(
          typeof conversation.lastMessage === "object"
            ? conversation.lastMessage
            : conversation.lastMessage
        )
          .toLowerCase()
          .includes(query)
      );
    });

    return list.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations, currentUserId, search]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);

    try {
      const result: any = await apiRequest(
        `/messages/${conversationId}?page=1&limit=50`
      );

      const payload = unwrap(result);
      const list = Array.isArray(payload)
        ? payload
        : payload?.messages ?? payload?.items ?? [];

      if (Array.isArray(list)) {
        setMessages(sortMessages(list));
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load messages."
      );
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [conversationResult, userResult]: any = await Promise.all([
        apiRequest("/conversations/mine"),
        apiRequest("/users/me"),
      ]);

      const conversationPayload = unwrap(conversationResult);
      const conversationList = Array.isArray(conversationPayload)
        ? conversationPayload
        : conversationPayload?.conversations ??
          conversationPayload?.items ??
          [];

      const userPayload = unwrap(userResult);
      const user = userPayload?.user ?? userPayload;
      const userId = getId(user);


setCurrentUserId(userId);
setConversations(Array.isArray(conversationList) ? conversationList : []);

const requestedConversationId = new URLSearchParams(
  window.location.search
).get("conversationId");

const requestedConversation =
  !deepLinkHandledRef.current && requestedConversationId
    ? conversationList.find(
        (item: Conversation) =>
          getId(item) === requestedConversationId
      )
    : undefined;

// Handle the URL selection only on the initial inbox load.
deepLinkHandledRef.current = true;

if (Array.isArray(conversationList) && conversationList.length > 0) {
  if (requestedConversation) {
    setSelected(requestedConversation);
    setShowMobileChat(true);
  } else {
    setSelected((previous) => {
      if (previous) {
        const existing = conversationList.find(
          (item: Conversation) => getId(item) === getId(previous)
        );

        return existing ?? conversationList[0];
      }

      return conversationList[0];
    });
  }
} else {
  setSelected(null);
  setMessages([]);
}

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your conversations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  // Create one socket connection and keep it for the lifetime of the page.
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:5000";

    const socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
    });

    socketRef.current = socket;
    setChatSocket(socket);

    const joinSelectedConversation = () => {
      setSocketConnected(true);

      const conversationId = selectedIdRef.current;
      if (conversationId) {
        socket.emit(
          "conversation:join",
          { conversationId },
          (response: SocketAckResponse) => {
            if (!response?.success) {
              setError(response?.message || "Could not join conversation.");
            }
          }
        );
      }
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleIncomingMessage = (eventData: any) => {
      const incoming: ChatMessage =
        eventData?.message ??
        eventData?.data?.message ??
        eventData;

      const incomingConversationId = getId(
        incoming?.conversationId ?? incoming?.conversation
      );

      if (
        !incomingConversationId ||
        incomingConversationId !== selectedIdRef.current
      ) {
        return;
      }

      setMessages((previous) => {
        const incomingId = getId(incoming);

        if (
          incomingId &&
          previous.some((message) => getId(message) === incomingId)
        ) {
          return previous;
        }

        // Avoid duplicating a just-sent message if the server event and
        // REST response arrive in quick succession.
        const incomingSender = getMessageSender(incoming);
        const incomingText = getMessageText(incoming);

        const matchingOptimisticMessage = previous.find(
          (message) =>
            !getId(message) &&
            getMessageSender(message) === incomingSender &&
            getMessageText(message) === incomingText
        );

        if (matchingOptimisticMessage) {
          return previous.map((message) =>
            message === matchingOptimisticMessage ? incoming : message
          );
        }

        return sortMessages([...previous, incoming]);
      });
    };

    socket.on("connect", joinSelectedConversation);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setSocketConnected(false);
    });
    socket.on("message:new", handleIncomingMessage);

    if (socket.connected) {
      joinSelectedConversation();
    }

    return () => {
      socket.off("connect", joinSelectedConversation);
      socket.off("disconnect", handleDisconnect);
      socket.off("message:new", handleIncomingMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join each newly selected conversation, including after a reconnect.
  useEffect(() => {
    if (!selectedId || !socketRef.current?.connected) return;

    socketRef.current.emit(
      "conversation:join",
      { conversationId: selectedId },
      (response: SocketAckResponse) => {
        if (!response?.success) {
          setError(response?.message || "Could not join conversation.");
        }
      }
    );
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedId]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || !selectedId || sending) return;

    setSending(true);
    setError("");

    try {
      const result: any = await apiRequest(`/messages/${selectedId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      const payload = unwrap(result);
      const savedMessage: ChatMessage | undefined =
        payload?.message ?? payload?.data?.message ?? payload;

      if (savedMessage && typeof savedMessage === "object") {
        setMessages((previous) => {
          const id = getId(savedMessage);

          if (id && previous.some((message) => getId(message) === id)) {
            return previous;
          }

          return sortMessages([...previous, savedMessage]);
        });
      } else {
        await loadMessages(selectedId);
      }

      setDraft("");

      // Refresh previews/order so the conversation list can reflect the
      // latest activity if the API updates its updatedAt/lastMessage fields.
      void loadConversations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#f6f7fb] text-slate-900">
      {/* Top navigation */}
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <MessageCircle size={21} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              Messages
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Your work, all in one conversation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex ${
              socketConnected
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {socketConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {socketConnected ? "Live connection" : "Connecting"}
          </div>

          <button
            type="button"
            onClick={() => void loadConversations()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-3 mt-3 flex shrink-0 items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main chat workspace */}
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 gap-0 p-0 sm:gap-4 sm:p-4 lg:gap-5 lg:p-5">
        {/* Conversation sidebar */}
        <aside
          className={`${
            showMobileChat && selected ? "hidden" : "flex"
          } w-full min-h-0 flex-col overflow-hidden border-slate-200 bg-white sm:rounded-2xl sm:border md:flex md:w-[320px] md:shrink-0 lg:w-[360px]`}
        >
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold">Inbox</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {conversations.length} conversation
                  {conversations.length === 1 ? "" : "s"}
                </p>
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <MessageCircle size={18} />
              </span>
            </div>

            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-50">
              <Search size={17} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex animate-pulse gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-2/3 rounded bg-slate-100" />
                      <div className="h-3 w-full rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  {search ? <Search size={24} /> : <MessageCircle size={25} />}
                </div>

                <h3 className="mt-4 font-bold">
                  {search ? "No matching conversations" : "Your inbox is empty"}
                </h3>

                <p className="mt-2 max-w-[230px] text-sm leading-6 text-slate-500">
                  {search
                    ? "Try another name, project title, or message."
                    : "When you connect with a client or professional, your conversations will appear here."}
                </p>

                {!search && (
                  <Link
                    href="/projects"
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    Explore projects
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((conversation) => {
                  const id = getId(conversation);
                  const active = id === selectedId;
                  const name = getConversationName(conversation, currentUserId);
                  const lastMessage = getMessageText(conversation.lastMessage);
                  const time =
                    (typeof conversation.lastMessage === "object"
                      ? conversation.lastMessage?.createdAt
                      : undefined) ?? conversation.updatedAt;

                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => {
                        setSelected(conversation);
                        setShowMobileChat(true);
                        setError("");
                      }}
                      className={`group mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                        active
                          ? "bg-indigo-50 ring-1 ring-indigo-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${
                          active
                            ? "bg-indigo-600 text-white"
                            : "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700"
                        }`}
                      >
                        {getInitials(name)}
                        {/* <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" /> */}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-800">
                            {name}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-slate-400">
                            {formatConversationTime(time)}
                          </span>
                        </span>

                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {getProjectTitle(conversation) || "SkillConnect chat"}
                        </span>

                        <span className="mt-1 block truncate text-xs text-slate-400">
                          {lastMessage || "Start a conversation"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden border-t border-slate-100 px-4 py-3 sm:block">
            <div className="flex items-center gap-2 text-[11px] leading-5 text-slate-400">
              <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
              Keep project communication in SkillConnect.
            </div>
          </div>
        </aside>

        {/* Active chat */}
        <section
          className={`${
            showMobileChat && selected ? "flex" : "hidden"
          } min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-slate-200 bg-white sm:rounded-2xl sm:border md:flex`}
        >
          {selected ? (
            <>
              {/* Chat header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    aria-label="Back to conversations"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 md:hidden"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-extrabold text-indigo-700">
                    {getInitials(selectedName)}
                  </span>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-extrabold sm:text-base">
                      {selectedName}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                      <Circle
                        size={7}
                        className={
                          socketConnected
                            ? "fill-emerald-500 text-emerald-500"
                            : "fill-slate-300 text-slate-300"
                        }
                      />
                      {socketConnected ? "Connected" : "Reconnecting..."}
                      {selectedProject ? ` · ${selectedProject}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {currentUserId &&
                    getConversationRecipientId(selected, currentUserId) && (
                      <VideoCall
                        socket={chatSocket}
                        conversationId={selectedId}
                        currentUserId={currentUserId}
                        recipientId={getConversationRecipientId(
                          selected,
                          currentUserId
                        )}
                        recipientName={selectedName}
                      />
                    )}

                  <button
                    type="button"
                    onClick={() => void loadMessages(selectedId)}
                    disabled={messagesLoading}
                    aria-label="Refresh messages"
                    title="Refresh messages"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={17}
                      className={messagesLoading ? "animate-spin" : ""}
                    />
                  </button>

                  {selectedProject && (
                    <Link
                      href={`/projects/${getId(selected.project ?? selected.projectId)}`}
                      aria-label="View project"
                      title="View project"
                      className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
                    >
                      View project
                    </Link>
                  )}

                  <button
                    type="button"
                    aria-label="More conversation options"
                    title="More options"
                    onClick={() =>
                      window.alert(
                        "More conversation options can be added in a future step."
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </div>
              </div>

              {/* Project context */}
              {selectedProject && (
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/60 px-4 py-2.5 sm:px-6">
                  <div className="flex min-w-0 items-center gap-2 text-xs text-indigo-900">
                    <ShieldCheck size={15} className="shrink-0 text-indigo-600" />
                    <span className="truncate">
                      <span className="text-indigo-600">Project:</span>{" "}
                      <strong>{selectedProject}</strong>
                    </span>
                  </div>
                  <span className="hidden shrink-0 text-[11px] font-medium text-indigo-600 sm:inline">
                    Project conversation
                  </span>
                </div>
              )}

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8f9fc] px-3 py-5 sm:px-6 sm:py-6">
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex h-full min-h-48 items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <RefreshCw size={16} className="animate-spin" />
                      Loading messages...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-indigo-500 shadow-sm ring-1 ring-slate-100">
                      <MessageCircle size={28} />
                    </div>
                    <h3 className="mt-5 text-base font-extrabold">
                      Start the conversation
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      Introduce yourself, discuss requirements, and keep project
                      updates in one place.
                    </p>
                    <div className="mt-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
                      Your next message starts the discussion
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                    {messages.map((message, index) => {
                      const senderId = getMessageSender(message);
                      const mine =
                        senderId !== "" && senderId === currentUserId;
                      const messageId =
                        getId(message) ||
                        `${message.createdAt ?? "message"}-${index}-${getMessageText(message)}`;

                      const previous = messages[index - 1];
                      const showDate =
                        !previous ||
                        formatDateLabel(previous.createdAt) !==
                          formatDateLabel(message.createdAt);

                      return (
                        <div key={messageId}>
                          {showDate && (
                            <div className="my-2 flex items-center justify-center">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-400 shadow-sm">
                                {formatDateLabel(message.createdAt)}
                              </span>
                            </div>
                          )}

                          <div
                            className={`flex items-end gap-2 ${
                              mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!mine && (
                              <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[10px] font-extrabold text-indigo-700">
                                {getInitials(selectedName)}
                              </span>
                            )}

                            <div
                              className={`max-w-[88%] sm:max-w-[75%] ${
                                mine ? "items-end" : "items-start"
                              } flex flex-col`}
                            >
                              <div
                                className={`rounded-2xl px-4 py-3 shadow-sm ${
                                  mine
                                    ? "rounded-br-md bg-indigo-600 text-white"
                                    : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                  {getMessageText(message)}
                                </p>
                              </div>

                              <div
                                className={`mt-1.5 flex items-center gap-1.5 px-1 text-[10px] text-slate-400 ${
                                  mine ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span>{formatTime(message.createdAt)}</span>
                                {mine && (
                                  <Check
                                    size={12}
                                    className="text-indigo-500"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-slate-100 bg-white p-3 sm:px-5 sm:py-4">
                <form
                  onSubmit={sendMessage}
                  className="mx-auto max-w-4xl"
                >
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-50">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={2}
                      maxLength={5000}
                      placeholder="Write your message..."
                      aria-label="Write a message"
                      className="max-h-36 min-h-12 w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-slate-400"
                    />

                    <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Attachments"
                          title="Attachments (coming soon)"
                          onClick={() =>
                            window.alert(
                              "File attachments will be added after the core chat is tested."
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Paperclip size={18} />
                        </button>

                        <button
                          type="button"
                          aria-label="Emoji"
                          title="Emoji (coming soon)"
                          onClick={() =>
                            setDraft((previous) => previous + " 🙂")
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Smile size={18} />
                        </button>

                        <span className="hidden pl-2 text-[11px] text-slate-400 sm:inline">
                          Enter to send · Shift + Enter for a new line
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="hidden text-[10px] text-slate-400 sm:inline">
                          {draft.length}/5000
                        </span>

                        <button
                          type="submit"
                          disabled={!draft.trim() || sending}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sending ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          <span>{sending ? "Sending" : "Send"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <p className="mt-2 text-center text-[10px] text-slate-400">
                  Be respectful and keep project communication professional.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500">
                <MessageCircle size={34} />
              </div>
              <h2 className="mt-5 text-lg font-extrabold">
                Your conversations, connected
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Select a conversation to discuss project requirements, share
                updates, and coordinate your next steps.
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
                <UserRound size={14} />
                Built for clients and professionals
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
