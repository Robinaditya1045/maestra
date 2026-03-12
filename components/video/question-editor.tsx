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

interface QuestionEditorProps {
    videoId: string;
    duration: number;
    questions: VideoQuestion[];
    onQuestionsChange: () => void;
    onSeek?: (timestamp: number) => void;
}

function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QuestionEditor({
    videoId,
    duration,
    questions,
    onQuestionsChange,
    onSeek,
}: QuestionEditorProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Form state
    const [timestamp, setTimestamp] = useState(0);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [explanation, setExplanation] = useState("");

    function resetForm() {
        setTimestamp(0);
        setQuestion("");
        setOptions(["", ""]);
        setCorrectAnswer(0);
        setExplanation("");
        setEditingId(null);
        setError("");
    }

    function openAdd() {
        resetForm();
        setShowForm(true);
    }

    function openEdit(q: VideoQuestion) {
        setTimestamp(q.timestamp);
        setQuestion(q.question);
        setOptions([...q.options]);
        setCorrectAnswer(q.correctAnswer);
        setExplanation(q.explanation || "");
        setEditingId(q.id);
        setShowForm(true);
        setError("");
    }

    function addOption() {
        if (options.length < 6) {
            setOptions([...options, ""]);
        }
    }

    function removeOption(idx: number) {
        if (options.length <= 2) return;
        const next = options.filter((_, i) => i !== idx);
        setOptions(next);
        if (correctAnswer >= next.length) setCorrectAnswer(next.length - 1);
    }

    function updateOption(idx: number, value: string) {
        const next = [...options];
        next[idx] = value;
        setOptions(next);
    }

    async function handleSave() {
        setError("");
        setSaving(true);

        const body = {
            timestamp,
            question,
            options: options.filter((o) => o.trim()),
            correctAnswer,
            explanation: explanation || undefined,
        };

        try {
            const url = editingId
                ? `/api/videos/${videoId}/questions/${editingId}`
                : `/api/videos/${videoId}/questions`;

            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to save");
                return;
            }

            setShowForm(false);
            resetForm();
            onQuestionsChange();
        } catch {
            setError("Failed to save question");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(qid: string) {
        if (!confirm("Delete this question?")) return;
        try {
            await fetch(`/api/videos/${videoId}/questions/${qid}`, { method: "DELETE" });
            onQuestionsChange();
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">
                    Timeline Questions
                    <span className="text-purple-400 text-sm font-normal ml-2">
                        {questions.length} question{questions.length !== 1 ? "s" : ""}
                    </span>
                </h3>
                <button
                    onClick={openAdd}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
                >
                    + Add Question
                </button>
            </div>

            {/* Timeline Visual */}
            {duration > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="relative h-8 bg-white/10 rounded-full overflow-visible">
                        {/* Minute marks */}
                        {Array.from({ length: Math.ceil(duration / 60) + 1 }, (_, i) => {
                            const pos = duration > 0 ? ((i * 60) / duration) * 100 : 0;
                            if (pos > 100) return null;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-full mt-1 text-[10px] text-purple-500 -translate-x-1/2"
                                    style={{ left: `${pos}%` }}
                                >
                                    {i}m
                                </div>
                            );
                        })}
                        {/* Question dots */}
                        {questions.map((q) => {
                            const pos = duration > 0 ? (q.timestamp / duration) * 100 : 0;
                            return (
                                <button
                                    key={q.id}
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600 hover:scale-125 transition-transform z-10 cursor-pointer"
                                    style={{ left: `${pos}%`, marginLeft: "-8px" }}
                                    title={`${formatTimestamp(q.timestamp)}: ${q.question}`}
                                    onClick={() => {
                                        openEdit(q);
                                        onSeek?.(q.timestamp);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Question List */}
            <div className="space-y-2">
                {questions.map((q) => (
                    <div
                        key={q.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <button
                                        onClick={() => onSeek?.(q.timestamp)}
                                        className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-mono rounded-md hover:bg-yellow-500/30 transition-colors"
                                    >
                                        {formatTimestamp(q.timestamp)}
                                    </button>
                                    <span className="text-purple-400 text-xs">
                                        {q.options.length} options · Answer: {String.fromCharCode(65 + q.correctAnswer)}
                                    </span>
                                </div>
                                <p className="text-white text-sm">{q.question}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => openEdit(q)}
                                    className="text-purple-400 hover:text-purple-300 text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="text-white font-semibold mb-4">
                        {editingId ? "Edit Question" : "New Question"}
                    </h4>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Timestamp */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1.5">
                                Timestamp (seconds)
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 600}
                                    step="1"
                                    value={timestamp}
                                    onChange={(e) => {
                                        const t = parseFloat(e.target.value);
                                        setTimestamp(t);
                                        onSeek?.(t);
                                    }}
                                    className="flex-1 accent-purple-500"
                                />
                                <span className="text-white font-mono text-sm w-16 text-center bg-white/10 px-2 py-1 rounded-lg">
                                    {formatTimestamp(timestamp)}
                                </span>
                            </div>
                        </div>

                        {/* Question Text */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1.5">
                                Question
                            </label>
                            <input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                placeholder="What concept is being explained here?"
                            />
                        </div>

                        {/* Options */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1.5">
                                Answer Options
                            </label>
                            <div className="space-y-2">
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCorrectAnswer(idx)}
                                            className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${idx === correctAnswer
                                                    ? "bg-green-500/30 border-green-500 text-green-300"
                                                    : "border-white/20 text-white/40 hover:border-white/40"
                                                }`}
                                            title="Mark as correct answer"
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </button>
                                        <input
                                            value={opt}
                                            onChange={(e) => updateOption(idx, e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                        />
                                        {options.length > 2 && (
                                            <button
                                                onClick={() => removeOption(idx)}
                                                className="text-red-400/50 hover:text-red-400 text-sm px-1 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {options.length < 6 && (
                                <button
                                    onClick={addOption}
                                    className="text-purple-400 hover:text-purple-300 text-sm mt-2 transition-colors"
                                >
                                    + Add Option
                                </button>
                            )}
                            <p className="text-purple-500 text-xs mt-1">
                                Click the letter badge to mark the correct answer (green = correct)
                            </p>
                        </div>

                        {/* Explanation */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1.5">
                                Explanation (optional)
                            </label>
                            <textarea
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none text-sm"
                                placeholder="Why is this the correct answer?"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="px-6 py-2.5 text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !question.trim() || options.filter((o) => o.trim()).length < 2}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving..." : editingId ? "Update" : "Add Question"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
