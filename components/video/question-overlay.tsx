"use client";

import { useState } from "react";

interface VideoQuestion {
    id: string;
    timestamp: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface QuestionOverlayProps {
    question: VideoQuestion;
    onDismiss: () => void;
}

export default function QuestionOverlay({ question, onDismiss }: QuestionOverlayProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);

    const isCorrect = selectedAnswer === question.correctAnswer;

    function handleSubmit() {
        if (selectedAnswer === null) return;
        setAnswered(true);
    }

    function handleContinue() {
        onDismiss();
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center z-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Card */}
            <div className="relative bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-4 shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-400 text-sm">❓</span>
                    </div>
                    <span className="text-yellow-400 text-sm font-medium">Knowledge Check</span>
                    <span className="text-purple-500 text-xs ml-auto">
                        {formatTimestamp(question.timestamp)}
                    </span>
                </div>

                {/* Question */}
                <h3 className="text-white text-lg font-semibold mb-5 leading-relaxed">
                    {question.question}
                </h3>

                {/* Options */}
                <div className="space-y-2.5 mb-6">
                    {question.options.map((option, idx) => {
                        let style = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50";
                        if (answered) {
                            if (idx === question.correctAnswer) {
                                style = "bg-green-500/20 border-green-500/50 text-green-200";
                            } else if (idx === selectedAnswer && !isCorrect) {
                                style = "bg-red-500/20 border-red-500/50 text-red-200";
                            } else {
                                style = "bg-white/5 border-white/10 opacity-50";
                            }
                        } else if (idx === selectedAnswer) {
                            style = "bg-purple-500/20 border-purple-500/50";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => !answered && setSelectedAnswer(idx)}
                                disabled={answered}
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${style}`}
                            >
                                <span className="inline-flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-mono flex-shrink-0">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="text-white">{option}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Result / Action */}
                {answered ? (
                    <div>
                        <div className={`px-4 py-3 rounded-xl mb-4 text-sm ${isCorrect ? "bg-green-500/10 border border-green-500/30 text-green-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
                            {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                            {question.explanation && (
                                <p className="mt-2 text-purple-300/80 text-xs">
                                    {question.explanation}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleContinue}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all"
                        >
                            Continue Watching →
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={handleContinue}
                            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedAnswer === null}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-40 text-sm"
                        >
                            Submit Answer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}
