"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import VideoPlayer from "@/components/video/video-player";
import QuestionEditor from "@/components/video/question-editor";

interface VideoData {
    id: string;
    title: string;
    description: string | null;
    storageKey: string | null;
    videoUrl: string;
    duration: number | null;
    createdAt: string;
    uploadedBy: { id: string; name: string };
}

interface VideoQuestion {
    id: string;
    timestamp: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export default function StudioPage() {
    const params = useParams();
    const classroomId = params.id as string;
    const videoId = params.videoId as string;
    const [video, setVideo] = useState<VideoData | null>(null);
    const [questions, setQuestions] = useState<VideoQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [videoDuration, setVideoDuration] = useState(0);
    const playerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [videoId]);

    async function loadData() {
        try {
            const [videosRes, questionsRes] = await Promise.all([
                fetch(`/api/classrooms/${classroomId}/videos`),
                fetch(`/api/videos/${videoId}/questions`),
            ]);

            if (videosRes.ok) {
                const videos = await videosRes.json();
                const found = videos.find((v: VideoData) => v.id === videoId);
                if (found) {
                    setVideo(found);
                    if (found.duration) setVideoDuration(found.duration);
                }
            }
            if (questionsRes.ok) setQuestions(await questionsRes.json());
        } catch (err) {
            console.error("Failed to load:", err);
        } finally {
            setLoading(false);
        }
    }

    function handleSeek(timestamp: number) {
        const videoEl = playerContainerRef.current?.querySelector("video");
        if (videoEl) {
            videoEl.currentTime = timestamp;
        }
    }

    // Listen for video metadata to get duration
    useEffect(() => {
        const videoEl = playerContainerRef.current?.querySelector("video");
        if (!videoEl) return;
        function onMeta() {
            if (videoEl) setVideoDuration(videoEl.duration);
        }
        videoEl.addEventListener("loadedmetadata", onMeta);
        return () => videoEl.removeEventListener("loadedmetadata", onMeta);
    }, [video]);

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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/classroom/${classroomId}/videos/${videoId}`}
                        className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                    >
                        ← Back to Video
                    </Link>
                </div>
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5">
                    <span className="text-yellow-400 text-sm font-medium">🎬 Studio Mode</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Video Preview */}
                <div>
                    <div ref={playerContainerRef}>
                        <VideoPlayer
                            src={streamSrc}
                            title={video.title}
                            questions={questions}
                        />
                    </div>
                    <div className="mt-3">
                        <h2 className="text-lg font-semibold text-white">{video.title}</h2>
                        <p className="text-purple-400 text-sm mt-1">
                            by {video.uploadedBy.name} · {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Right: Question Editor */}
                <div>
                    <QuestionEditor
                        videoId={videoId}
                        duration={videoDuration}
                        questions={questions}
                        onQuestionsChange={loadData}
                        onSeek={handleSeek}
                    />
                </div>
            </div>
        </div>
    );
}
