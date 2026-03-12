"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Classroom {
    id: string;
    title: string;
    description: string | null;
    inviteCode: string;
    createdBy: { id: string; name: string };
    _count: { members: number; videos: number; notes: number };
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [error, setError] = useState("");

    const isMentor = session?.user?.role === "MENTOR" || session?.user?.role === "ADMIN";

    useEffect(() => {
        fetchClassrooms();
    }, []);

    async function fetchClassrooms() {
        try {
            const res = await fetch("/api/classrooms");
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (err) {
            console.error("Failed to fetch classrooms:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/classrooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.get("title"),
                    description: formData.get("description"),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error);
                return;
            }

            setShowCreateModal(false);
            fetchClassrooms();
        } catch {
            setError("Failed to create classroom");
        }
    }

    async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/classrooms/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: formData.get("inviteCode") }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error);
                return;
            }

            setShowJoinModal(false);
            fetchClassrooms();
        } catch {
            setError("Failed to join classroom");
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Classrooms</h1>
                    <p className="text-purple-300 mt-1">
                        {isMentor ? "Manage your classrooms" : "Your enrolled classrooms"}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setError(""); setShowJoinModal(true); }}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all text-sm font-medium"
                    >
                        Join Classroom
                    </button>
                    {isMentor && (
                        <button
                            onClick={() => { setError(""); setShowCreateModal(true); }}
                            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all text-sm font-medium"
                        >
                            + Create Classroom
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-20">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-purple-300 mt-4">Loading classrooms...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && classrooms.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-xl font-semibold text-white mb-2">No classrooms yet</h2>
                    <p className="text-purple-300">
                        {isMentor ? "Create your first classroom to get started" : "Join a classroom using an invite code"}
                    </p>
                </div>
            )}

            {/* Classroom Grid */}
            {!loading && classrooms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map((classroom) => (
                        <Link
                            key={classroom.id}
                            href={`/classroom/${classroom.id}`}
                            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                        {classroom.title.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                                {classroom.title}
                            </h3>
                            {classroom.description && (
                                <p className="text-purple-300/70 text-sm mb-4 line-clamp-2">
                                    {classroom.description}
                                </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-purple-400">
                                <span>👥 {classroom._count.members} members</span>
                                <span>🎬 {classroom._count.videos} videos</span>
                                <span>📝 {classroom._count.notes} notes</span>
                            </div>
                            <div className="mt-3 text-xs text-purple-500">
                                by {classroom.createdBy.name}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Classroom Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Create Classroom</h2>
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
                        )}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-200 mb-1.5">Title</label>
                                <input
                                    name="title"
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    placeholder="e.g. Advanced Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-purple-200 mb-1.5">Description (optional)</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                                    placeholder="Describe your classroom..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-white bg-white/10 hover:bg-white/20 rounded-xl transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Classroom Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Join Classroom</h2>
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
                        )}
                        <form onSubmit={handleJoin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-200 mb-1.5">Invite Code</label>
                                <input
                                    name="inviteCode"
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-mono tracking-wider text-center text-lg"
                                    placeholder="Enter code..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 py-3 text-white bg-white/10 hover:bg-white/20 rounded-xl transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition">
                                    Join
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
