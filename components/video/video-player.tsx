"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface VideoQuestion {
    id: string;
    timestamp: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface VideoPlayerProps {
    src: string;
    title: string;
    questions?: VideoQuestion[];
    onQuestionTriggered?: (question: VideoQuestion) => void;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ src, title, questions = [], onQuestionTriggered }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [triggeredQuestions, setTriggeredQuestions] = useState<Set<string>>(new Set());
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-hide controls
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (playing) {
            hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [playing]);

    useEffect(() => {
        resetControlsTimer();
        return () => { if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); };
    }, [playing, resetControlsTimer]);

    // Question trigger check
    useEffect(() => {
        if (!onQuestionTriggered || questions.length === 0) return;
        const video = videoRef.current;
        if (!video) return;

        for (const q of questions) {
            if (
                !triggeredQuestions.has(q.id) &&
                currentTime >= q.timestamp &&
                currentTime < q.timestamp + 0.5
            ) {
                video.pause();
                setPlaying(false);
                setTriggeredQuestions(prev => new Set(prev).add(q.id));
                onQuestionTriggered(q);
                break;
            }
        }
    }, [currentTime, questions, onQuestionTriggered, triggeredQuestions]);

    function togglePlay() {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
            setPlaying(true);
        } else {
            video.pause();
            setPlaying(false);
        }
    }

    function handleTimeUpdate() {
        const video = videoRef.current;
        if (!video) return;
        setCurrentTime(video.currentTime);
        if (video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1));
        }
    }

    function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
        const video = videoRef.current;
        const bar = progressRef.current;
        if (!video || !bar) return;
        const rect = bar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        video.currentTime = ratio * duration;
    }

    function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (videoRef.current) {
            videoRef.current.volume = v;
            setMuted(v === 0);
        }
    }

    function toggleMute() {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
    }

    function toggleFullscreen() {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            container.requestFullscreen();
            setFullscreen(true);
        } else {
            document.exitFullscreen();
            setFullscreen(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        const video = videoRef.current;
        if (!video) return;
        switch (e.key) {
            case " ":
            case "k":
                e.preventDefault();
                togglePlay();
                break;
            case "ArrowLeft":
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 5);
                break;
            case "ArrowRight":
                e.preventDefault();
                video.currentTime = Math.min(duration, video.currentTime + 5);
                break;
            case "ArrowUp":
                e.preventDefault();
                video.volume = Math.min(1, video.volume + 0.1);
                setVolume(video.volume);
                break;
            case "ArrowDown":
                e.preventDefault();
                video.volume = Math.max(0, video.volume - 0.1);
                setVolume(video.volume);
                break;
            case "f":
                e.preventDefault();
                toggleFullscreen();
                break;
            case "m":
                e.preventDefault();
                toggleMute();
                break;
        }
    }

    // Reset triggered questions on seek
    function handleSeeked() {
        setTriggeredQuestions(new Set());
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

    return (
        <div
            ref={containerRef}
            className="relative bg-black rounded-xl overflow-hidden group select-none"
            onMouseMove={resetControlsTimer}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                className="w-full aspect-video cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onSeeked={handleSeeked}
                onEnded={() => setPlaying(false)}
                preload="metadata"
            />

            {/* Big Play Button (when paused) */}
            {!playing && (
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
                >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all hover:scale-110">
                        <svg className="w-7 h-7 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                    </div>
                </button>
            )}

            {/* Title overlay */}
            <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
                <h3 className="text-white font-medium text-sm truncate">{title}</h3>
            </div>

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-3 px-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
                {/* Progress Bar */}
                <div
                    ref={progressRef}
                    className="relative h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/progress hover:h-1.5 transition-all"
                    onClick={handleProgressClick}
                >
                    {/* Buffered */}
                    <div
                        className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                        style={{ width: `${bufferedProgress}%` }}
                    />
                    {/* Progress */}
                    <div
                        className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                    {/* Question Markers */}
                    {questions.map((q) => {
                        const pos = duration > 0 ? (q.timestamp / duration) * 100 : 0;
                        return (
                            <div
                                key={q.id}
                                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-yellow-600 z-10"
                                style={{ left: `${pos}%`, marginLeft: "-5px" }}
                                title={`Question at ${formatTime(q.timestamp)}`}
                            />
                        );
                    })}
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
                        {playing ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.5 3.5A1.5 1.5 0 017 5v10a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5zm8 0A1.5 1.5 0 0115 5v10a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                        )}
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-1.5 group/vol">
                        <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                            {muted || volume === 0 ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.547 3.062A.75.75 0 0110 3.75v12.5a.75.75 0 01-1.264.546L5.203 13.5H2.667a.75.75 0 01-.7-.48A6.985 6.985 0 011.5 10c0-.95.189-1.858.534-2.684a.751.751 0 01.633-.516H5.203l3.533-3.296a.75.75 0 01.811-.442z" />
                                    <path d="M13.28 7.22a.75.75 0 10-1.06 1.06L13.94 10l-1.72 1.72a.75.75 0 101.06 1.06L15 11.06l1.72 1.72a.75.75 0 101.06-1.06L16.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L15 8.94l-1.72-1.72z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 3.75a.75.75 0 00-1.264-.546L5.203 6.5H2.667a.75.75 0 00-.7.48A6.985 6.985 0 001.5 10c0 .95.189 1.858.534 2.684a.751.751 0 00.633.516H5.203l3.533 3.296A.75.75 0 0010 16.25V3.75zm4.28 2.47a.75.75 0 00-1.06 1.06 3.5 3.5 0 010 4.95.75.75 0 001.06 1.06 5 5 0 000-7.07z" />
                                </svg>
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={muted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-0 group-hover/vol:w-20 transition-all opacity-0 group-hover/vol:opacity-100 accent-white h-1"
                        />
                    </div>

                    {/* Time */}
                    <span className="text-white/80 text-xs font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <div className="flex-1" />

                    {/* Fullscreen */}
                    <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors">
                        {fullscreen ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.44 6.5H3.75a.75.75 0 000 1.5h4a.75.75 0 00.75-.75v-4a.75.75 0 00-1.5 0v1.69L3.28 2.22zM16.72 2.22a.75.75 0 010 1.06L13.5 6.5h1.75a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75v-4a.75.75 0 011.5 0v1.69l3.72-3.72a.75.75 0 011.06 0zM3.28 17.78a.75.75 0 001.06 0L7 14.56v1.69a.75.75 0 001.5 0v-4a.75.75 0 00-.75-.75h-4a.75.75 0 000 1.5H5.5l-3.22 3.22a.75.75 0 000 1.06zM16.72 17.78a.75.75 0 01-1.06 0L13 14.56v1.69a.75.75 0 01-1.5 0v-4a.75.75 0 01.75-.75h4a.75.75 0 010 1.5H14.5l3.22 3.22a.75.75 0 010 1.06z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4.75 2A2.75 2.75 0 002 4.75v1.5a.75.75 0 001.5 0v-1.5c0-.69.56-1.25 1.25-1.25h1.5a.75.75 0 000-1.5h-1.5zM13.25 2a.75.75 0 000 1.5h1.5c.69 0 1.25.56 1.25 1.25v1.5a.75.75 0 001.5 0v-1.5A2.75 2.75 0 0015.25 2h-1.5zM3.5 13.25a.75.75 0 00-1.5 0v1.5A2.75 2.75 0 004.75 18h1.5a.75.75 0 000-1.5h-1.5c-.69 0-1.25-.56-1.25-1.25v-1.5zM18 13.25a.75.75 0 00-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-1.5a.75.75 0 000 1.5h1.5A2.75 2.75 0 0018 14.75v-1.5z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
