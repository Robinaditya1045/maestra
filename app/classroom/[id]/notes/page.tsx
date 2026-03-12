"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface NoteItem {
    id: string;
    title: string;
    content: string | null;
    fileUrl: string | null;
    createdAt: string;
    uploadedBy: { id: string; name: string };
}

export default function NotesPage() {
    const params = useParams();
    const classroomId = params.id as string;
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isMentor, setIsMentor] = useState(false);
    const [error, setError] = useState("");
    const [expandedNote, setExpandedNote] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [classroomId]);

    async function loadData() {
        try {
            const [notesRes, classroomRes] = await Promise.all([
                fetch(`/api/classrooms/${classroomId}/notes`),
                fetch(`/api/classrooms/${classroomId}`),
            ]);
            if (notesRes.ok) setNotes(await notesRes.json());
            if (classroomRes.ok) {
                const data = await classroomRes.json();
                setIsMentor(data.currentUserRole === "MENTOR");
            }
        } catch (err) {
            console.error("Failed to load:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);

        const fileUrl = formData.get("fileUrl") as string;
        try {
            const res = await fetch(`/api/classrooms/${classroomId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.get("title"),
                    content: formData.get("content"),
                    fileUrl: fileUrl || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error);
                return;
            }

            setShowForm(false);
            loadData();
        } catch {
            setError("Failed to create note");
        }
    }

    async function handleDelete(noteId: string) {
        if (!confirm("Delete this note?")) return;
        await fetch(`/api/classrooms/${classroomId}/notes?noteId=${noteId}`, { method: "DELETE" });
        loadData();
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Notes</h2>
                {isMentor && (
                    <button
                        onClick={() => { setError(""); setShowForm(!showForm); }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium transition-all hover:from-purple-700 hover:to-indigo-700"
                    >
                        + Add Note
                    </button>
                )}
            </div>

            {/* Add Note Form */}
            {showForm && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                    {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1.5">Title</label>
                            <input name="title" required className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="Note title" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1.5">Content</label>
                            <textarea name="content" rows={6} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none" placeholder="Write your notes here..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1.5">File URL (optional)</label>
                            <input name="fileUrl" type="url" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="https://example.com/notes.pdf" />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-white bg-white/10 hover:bg-white/20 rounded-xl transition">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition">Add Note</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notes List */}
            {notes.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-5xl mb-3">📝</div>
                    <p className="text-purple-300">No notes yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notes.map((note) => (
                        <div key={note.id} className="bg-white/5 rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <button
                                        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                                        className="text-left w-full"
                                    >
                                        <h3 className="text-white font-semibold mb-1">{note.title}</h3>
                                    </button>
                                    <div className="text-xs text-purple-500 mb-2">
                                        by {note.uploadedBy.name} · {new Date(note.createdAt).toLocaleDateString()}
                                    </div>
                                    {expandedNote === note.id && note.content && (
                                        <div className="mt-3 text-purple-200 text-sm whitespace-pre-wrap bg-white/5 rounded-xl p-4">
                                            {note.content}
                                        </div>
                                    )}
                                    {note.fileUrl && (
                                        <a
                                            href={note.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm mt-2 transition-colors"
                                        >
                                            📎 Open attached file
                                        </a>
                                    )}
                                </div>
                                {isMentor && (
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="text-red-400/60 hover:text-red-400 text-sm transition-colors ml-3"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
