"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import VideoPlayer from "@/components/video/video-player";
import QuestionOverlay from "@/components/video/question-overlay";

interface VideoData {
    id: string;
    title: string;
    description: string | null;
    storageKey: string | null;
    videoUrl: string;
    duration: number | null;
    mimeType: string | null;
    createdAt: string;
    uploadedBy: { id: string; name: string };
    classroom: { id: string; title: string };
    _count: { questions: number };
}

interface VideoQuestion {
    id: string;
    timestamp: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export default function VideoWatchPage() {
    const params = useParams();
    const { data: session } = useSession();
    const classroomId = params.id as string;
    const videoId = params.videoId as string;
    const [video, setVideo] = useState<VideoData | null>(null);
    const [questions, setQuestions] = useState<VideoQuestion[]>([]);
    const [activeQuestion, setActiveQuestion] = useState<VideoQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMentor, setIsMentor] = useState(false);
    const playerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [videoId]);

    async function loadData() {
        try {
            const [videoRes, questionsRes, classroomRes] = await Promise.all([
                fetch(`/api/classrooms/${classroomId}/videos`),
                fetch(`/api/videos/${videoId}/questions`),
                fetch(`/api/classrooms/${classroomId}`),
            ]);

            if (videoRes.ok) {
                const videos = await videoRes.json();
                const found = videos.find((v: VideoData) => v.id === videoId);
                if (found) setVideo(found);
            }
            if (questionsRes.ok) setQuestions(await questionsRes.json());
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

    const handleQuestionTriggered = useCallback((q: VideoQuestion) => {
        setActiveQuestion(q);
    }, []);

    const handleQuestionDismiss = useCallback(() => {
        setActiveQuestion(null);
        // Resume play
        const videoEl = playerContainerRef.current?.querySelector("video");
        if (videoEl) {
            videoEl.play();
        }
    }, []);

    if (loading || !video) {
        return (
            <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    const streamSrc = video.storageKey
        ? `/api/videos/${video.id}/stream`
        : video.videoUrl;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Back */}
            <Link
                href={`/classroom/${classroomId}/videos`}
                className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm mb-4 transition-colors"
            >
                ← Back to Videos
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Player */}
                <div className="lg:col-span-2">
                    <div ref={playerContainerRef} className="relative">
                        <VideoPlayer
                            src={streamSrc}
                            title={video.title}
                            questions={questions}
                            onQuestionTriggered={handleQuestionTriggered}
                        />

                        {/* Question Overlay */}
                        {activeQuestion && (
                            <QuestionOverlay
                                question={activeQuestion}
                                onDismiss={handleQuestionDismiss}
                            />
                        )}
                    </div>

                    {/* Video Info */}
                    <div className="mt-4 space-y-3">
                        <h1 className="text-xl font-bold text-white">{video.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-purple-400">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-semibold">
                                        {video.uploadedBy.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-purple-300 font-medium">{video.uploadedBy.name}</span>
                            </div>
                            <span>·</span>
                            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                            {video._count.questions > 0 && (
                                <>
                                    <span>·</span>
                                    <span className="text-yellow-400">
                                        ❓ {video._count.questions} quiz question{video._count.questions !== 1 ? "s" : ""}
                                    </span>
                                </>
                            )}
                        </div>

                        {video.description && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <p className="text-purple-200 text-sm whitespace-pre-wrap">
                                    {video.description}
                                </p>
                            </div>
                        )}

                        {isMentor && (
                            <Link
                                href={`/classroom/${classroomId}/videos/${videoId}/studio`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl text-sm font-medium transition-colors border border-yellow-500/30"
                            >
                                🎬 Open Studio — Manage Questions
                            </Link>
                        )}
                    </div>
                </div>

                {/* Sidebar — Questions Timeline */}
                <div className="space-y-3">
                    <h3 className="text-white font-semibold">
                        Questions in this Video
                    </h3>
                    {questions.length === 0 ? (
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
                            <p className="text-purple-400 text-sm">No questions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {questions.map((q, idx) => (
                                <div
                                    key={q.id}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-yellow-400 text-xs font-mono bg-yellow-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                                            {formatTimestamp(q.timestamp)}
                                        </span>
                                        <p className="text-white text-sm">
                                            Q{idx + 1}: {q.question}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}
