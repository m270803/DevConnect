"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function RealtimeChat({ conversationId }) {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!conversationId) return;

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
      { withCredentials: true }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");

      socket.emit("conversation:join", { conversationId }, (response) => {
        if (!response?.success) {
          setError(response?.message || "Could not join conversation.");
        }
      });
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      setError(err.message || "Connection failed.");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("message:new", (message) => {
      setMessages((previous) => {
        if (previous.some((item) => item._id === message._id)) {
          return previous;
        }

        return [...previous, message];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]);

  function sendMessage(event) {
    event.preventDefault();

    const text = content.trim();
    if (!text || !socketRef.current || !connected) return;

    socketRef.current.emit(
      "message:send",
      { conversationId, content: text },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Message could not be sent.");
          return;
        }

        setContent("");
        setError("");
      }
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Project chat</h2>
        <span className="text-sm">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex min-h-64 flex-col gap-3 overflow-y-auto rounded-lg bg-gray-50 p-3">
        {messages.map((message) => (
          <div key={message._id} className="rounded-lg bg-white p-3 shadow-sm">
            <p className="break-words">{message.content}</p>
            <p className="mt-1 text-xs text-gray-500">
              {message.senderId?.name || "Participant"} ·{" "}
              {message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString()
                : ""}
            </p>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-sm text-gray-500">
            New messages will appear here.
          </p>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a message..."
          maxLength={5000}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          disabled={!connected || !content.trim()}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
