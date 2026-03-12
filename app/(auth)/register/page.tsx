"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            role: formData.get("role") as string,
        };

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "Registration failed");
                return;
            }

            router.push("/login?registered=true");
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                <p className="text-purple-200">Join Maestra and start learning</p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-1.5">
                        Full Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-1.5">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-1.5">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-purple-200 mb-1.5">
                        I am a...
                    </label>
                    <select
                        id="role"
                        name="role"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                    >
                        <option value="STUDENT" className="bg-slate-900">Student</option>
                        <option value="MENTOR" className="bg-slate-900">Mentor</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Creating account..." : "Create Account"}
                </button>
            </form>

            <p className="text-center text-purple-200 mt-6 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
