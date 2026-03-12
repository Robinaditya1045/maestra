"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface ClassroomDetail {
    id: string;
    title: string;
    description: string | null;
    inviteCode: string;
    currentUserRole: string;
    createdBy: { id: string; name: string; email: string };
    members: {
        id: string;
        role: string;
        user: { id: string; name: string; email: string; avatar: string | null };
    }[];
    _count: { members: number; videos: number; notes: number; messages: number };
}

export default function ClassroomOverviewPage() {
    const params = useParams();
    const { data: session } = useSession();
    const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
    const [copied, setCopied] = useState(false);

    const classroomId = params.id as string;
    const isMentor = classroom?.currentUserRole === "MENTOR";

    useEffect(() => {
        async function load() {
            const res = await fetch(`/api/classrooms/${classroomId}`);
            if (res.ok) setClassroom(await res.json());
        }
        load();
    }, [classroomId]);

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this classroom? This cannot be undone.")) return;
        const res = await fetch(`/api/classrooms/${classroomId}`, { method: "DELETE" });
        if (res.ok) window.location.href = "/dashboard";
    }

    function copyInviteCode() {
        if (classroom) {
            navigator.clipboard.writeText(classroom.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (!classroom) {
        return (
            <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">About this Classroom</h2>
                    <p className="text-purple-200">
                        {classroom.description || "No description provided."}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-purple-400">
                        <span>Created by <span className="text-purple-300 font-medium">{classroom.createdBy.name}</span></span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Members", count: classroom._count.members, icon: "👥" },
                        { label: "Videos", count: classroom._count.videos, icon: "🎬" },
                        { label: "Notes", count: classroom._count.notes, icon: "📝" },
                        { label: "Messages", count: classroom._count.messages, icon: "💬" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-2xl font-bold text-white">{stat.count}</div>
                            <div className="text-xs text-purple-400">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Members List */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Members</h2>
                    <div className="space-y-3">
                        {classroom.members.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {member.user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">
                                        {member.user.name}
                                        {member.user.id === session?.user?.id && (
                                            <span className="text-purple-400 ml-1">(You)</span>
                                        )}
                                    </p>
                                    <p className="text-purple-400 text-xs">{member.user.email}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${member.role === "MENTOR"
                                        ? "bg-purple-500/20 text-purple-300"
                                        : "bg-blue-500/20 text-blue-300"
                                    }`}>
                                    {member.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Invite Code */}
                {isMentor && (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Invite Code</h3>
                        <p className="text-purple-300 text-sm mb-3">
                            Share this code with students to let them join:
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white/10 text-purple-200 px-4 py-3 rounded-xl font-mono text-lg tracking-wider text-center">
                                {classroom.inviteCode}
                            </code>
                            <button
                                onClick={copyInviteCode}
                                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                {copied ? "✓" : "Copy"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Danger Zone */}
                {isMentor && (
                    <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6">
                        <h3 className="text-lg font-semibold text-red-400 mb-3">Danger Zone</h3>
                        <p className="text-red-300/70 text-sm mb-4">
                            Permanently delete this classroom and all its content.
                        </p>
                        <button
                            onClick={handleDelete}
                            className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-500/30"
                        >
                            Delete Classroom
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
