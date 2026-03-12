"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">M</span>
                        </div>
                        <span className="text-white font-bold text-xl">Maestra</span>
                    </Link>

                    {session?.user && (
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-white text-sm font-medium">{session.user.name}</p>
                                <p className="text-purple-300 text-xs capitalize">{session.user.role?.toLowerCase()}</p>
                            </div>
                            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {session.user.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="text-purple-300 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
