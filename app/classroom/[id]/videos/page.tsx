"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Video {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string;
    storageKey: string | null;
    duration: number | null;
    fileSize: number | null;
    createdAt: string;
    uploadedBy: { id: string; name: string };
    _count: { questions: number };
}

export default function VideosPage() {
    const params = useParams();
    const classroomId = params.id as string;
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [isMentor, setIsMentor] = useState(false);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [classroomId]);

    async function loadData() {
        try {
            const [videosRes, classroomRes] = await Promise.all([
                fetch(`/api/classrooms/${classroomId}/videos`),
                fetch(`/api/classrooms/${classroomId}`),
            ]);
            if (videosRes.ok) setVideos(await videosRes.json());
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

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        const formData = new FormData(e.currentTarget);
        const file = fileInputRef.current?.files?.[0];

        if (!file) {
            setError("Please select a video file");
            return;
        }

        if (!file.type.startsWith("video/")) {
            setError("Please select a valid video file");
            return;
        }

        // Get video duration from a temp element
        let duration: number | undefined;
        try {
            duration = await getVideoDuration(file);
        } catch {
            // Duration detection optional
        }

        setUploading(true);
        setUploadProgress(10);

        try {
            // 1. Get presigned URL
            const metaRes = await fetch("/api/videos/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classroomId,
                    title: formData.get("title"),
                    description: formData.get("description"),
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    duration,
                }),
            });

            if (!metaRes.ok) {
                const data = await metaRes.json();
                setError(data.error || "Upload failed");
                return;
            }

            const { uploadUrl } = await metaRes.json();
            setUploadProgress(30);

            // 2. Upload file to MinIO via presigned URL
            const xhr = new XMLHttpRequest();
            await new Promise<void>((resolve, reject) => {
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        setUploadProgress(30 + (ev.loaded / ev.total) * 65);
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve();
                    else reject(new Error("Upload failed"));
                };
                xhr.onerror = () => reject(new Error("Upload failed"));
                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", file.type);
                xhr.send(file);
            });

            setUploadProgress(100);
            setShowUpload(false);
            loadData();
        } catch (err) {
            console.error("Upload error:", err);
            setError("Upload failed. Make sure MinIO is running.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }

    async function handleAddUrl(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/videos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.get("urlTitle"),
                    description: formData.get("urlDescription"),
                    videoUrl: formData.get("videoUrl"),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error);
                return;
            }

            setShowUpload(false);
            loadData();
        } catch {
            setError("Failed to add video");
        }
    }

    async function handleDelete(videoId: string) {
        if (!confirm("Delete this video?")) return;
        await fetch(`/api/classrooms/${classroomId}/videos?videoId=${videoId}`, { method: "DELETE" });
        loadData();
    }

    function formatDuration(seconds: number | null): string {
        if (!seconds) return "";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    function formatFileSize(bytes: number | null): string {
        if (!bytes) return "";
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                <h2 className="text-xl font-semibold text-white">Videos</h2>
                {isMentor && (
                    <button
                        onClick={() => { setError(""); setShowUpload(!showUpload); }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium transition-all hover:from-purple-700 hover:to-indigo-700"
                    >
                        + Upload Video
                    </button>
                )}
            </div>

            {/* Upload Panel */}
            {showUpload && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                    {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

                    {/* Upload progress */}
                    {uploading && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-purple-300 text-sm">Uploading...</span>
                                <span className="text-purple-400 text-sm font-mono">{Math.round(uploadProgress)}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* File Upload */}
                        <div>
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 bg-purple-500/30 rounded-md flex items-center justify-center text-xs">📁</span>
                                Upload File
                            </h3>
                            <form onSubmit={handleUpload} className="space-y-3">
                                <input
                                    name="title"
                                    required
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Video title"
                                />
                                <textarea
                                    name="description"
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Description (optional)"
                                />
                                <div
                                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                    />
                                    <div className="text-3xl mb-2">🎥</div>
                                    <p className="text-purple-300 text-sm">Click to select video file</p>
                                    <p className="text-purple-500 text-xs mt-1">MP4, WebM, MOV — Max 500MB</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition disabled:opacity-50 text-sm"
                                >
                                    {uploading ? "Uploading..." : "Upload Video"}
                                </button>
                            </form>
                        </div>

                        {/* URL */}
                        <div>
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 bg-indigo-500/30 rounded-md flex items-center justify-center text-xs">🔗</span>
                                Add URL
                            </h3>
                            <form onSubmit={handleAddUrl} className="space-y-3">
                                <input
                                    name="urlTitle"
                                    required
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Video title"
                                />
                                <textarea
                                    name="urlDescription"
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Description (optional)"
                                />
                                <input
                                    name="videoUrl"
                                    type="url"
                                    required
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="https://youtube.com/watch?v=..."
                                />
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition text-sm"
                                >
                                    Add Video URL
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="mt-4 text-right">
                        <button
                            onClick={() => setShowUpload(false)}
                            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Video Grid */}
            {videos.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-5xl mb-3">🎬</div>
                    <h3 className="text-white font-semibold mb-1">No videos yet</h3>
                    <p className="text-purple-400 text-sm">
                        {isMentor ? "Upload your first video to get started" : "Videos will appear here once uploaded"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                        <Link
                            key={video.id}
                            href={`/classroom/${classroomId}/videos/${video.id}`}
                            className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-slate-900 flex items-center justify-center">
                                <div className="w-14 h-14 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                </div>
                                {/* Duration badge */}
                                {video.duration && (
                                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-1.5 py-0.5 rounded">
                                        {formatDuration(video.duration)}
                                    </span>
                                )}
                                {/* Questions badge */}
                                {video._count.questions > 0 && (
                                    <span className="absolute top-2 right-2 bg-yellow-500/90 text-black text-xs font-semibold px-1.5 py-0.5 rounded">
                                        ❓ {video._count.questions}
                                    </span>
                                )}
                                {/* Storage indicator */}
                                {video.storageKey && (
                                    <span className="absolute top-2 left-2 bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded border border-green-500/30">
                                        Uploaded
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                    {video.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-purple-500">
                                    <span>{video.uploadedBy.name}</span>
                                    {video.fileSize && (
                                        <>
                                            <span>·</span>
                                            <span>{formatFileSize(video.fileSize)}</span>
                                        </>
                                    )}
                                    <span>·</span>
                                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Mentor actions */}
                            {isMentor && (
                                <div className="px-4 pb-3 flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(video.id);
                                        }}
                                        className="text-red-400/50 hover:text-red-400 text-xs transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
            resolve(video.duration);
            URL.revokeObjectURL(video.src);
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
    });
}
