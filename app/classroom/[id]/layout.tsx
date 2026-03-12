"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";

interface ClassroomData {
    id: string;
    title: string;
    description: string | null;
    inviteCode: string;
    currentUserRole: string;
    createdBy: { id: string; name: string };
}

export default function ClassroomLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const [classroom, setClassroom] = useState<ClassroomData | null>(null);

    const classroomId = params.id as string;

    useEffect(() => {
        async function fetchClassroom() {
            try {
                const res = await fetch(`/api/classrooms/${classroomId}`);
                if (res.ok) {
                    setClassroom(await res.json());
                }
            } catch (err) {
                console.error("Failed to load classroom:", err);
            }
        }
        if (classroomId) fetchClassroom();
    }, [classroomId]);

    const tabs = [
        { name: "Overview", href: `/classroom/${classroomId}`, exact: true },
        { name: "Videos", href: `/classroom/${classroomId}/videos` },
        { name: "Notes", href: `/classroom/${classroomId}/notes` },
        { name: "Chat", href: `/classroom/${classroomId}/chat` },
    ];

    function isActive(tab: { href: string; exact?: boolean }) {
        if (tab.exact) return pathname === tab.href;
        return pathname.startsWith(tab.href);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
            <Navbar />

            {/* Classroom Header */}
            <div className="bg-white/5 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
                            ← Dashboard
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        {classroom?.title || "Loading..."}
                    </h1>
                    {classroom?.description && (
                        <p className="text-purple-300/70 mt-1 text-sm">{classroom.description}</p>
                    )}
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 -mb-px">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-all ${isActive(tab)
                                        ? "bg-white/10 text-white border-b-2 border-purple-500"
                                        : "text-purple-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {tab.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
