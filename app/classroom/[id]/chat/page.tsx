"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string; avatar: string | null };
}

export default function ChatPage() {
    const params = useParams();
    const { data: session } = useSession();
    const classroomId = params.id as string;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        // Poll for new messages every 5 seconds
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [classroomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function loadMessages() {
        try {
            const res = await fetch(`/api/classrooms/${classroomId}/messages`);
            if (res.ok) setMessages(await res.json());
        } catch (err) {
            console.error("Failed to load messages:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSend(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (sending) return;
        setSending(true);

        const formData = new FormData(e.currentTarget);
        const content = formData.get("content") as string;
        if (!content.trim()) return;

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content.trim() }),
            });

            if (res.ok) {
                e.currentTarget.reset();
                loadMessages();
            }
        } catch (err) {
            console.error("Failed to send:", err);
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-280px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
                {messages.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">💬</div>
                        <p className="text-purple-300">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender.id === session?.user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-semibold">
                                        {msg.sender.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className={`max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-medium ${isOwn ? "text-purple-300" : "text-purple-400"}`}>
                                            {isOwn ? "You" : msg.sender.name}
                                        </span>
                                        <span className="text-xs text-purple-500/60">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-sm ${isOwn
                                                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md"
                                                : "bg-white/10 text-purple-100 rounded-bl-md"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Send Form */}
            <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-white/10">
                <input
                    name="content"
                    required
                    autoComplete="off"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Type a message..."
                />
                <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
