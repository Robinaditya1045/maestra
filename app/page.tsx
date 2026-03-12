import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="text-white font-bold text-xl">Maestra</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-purple-300 hover:text-white transition-colors text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-purple-300 text-sm">AI-Powered Learning Platform</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl">
          Learn <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">smarter</span>,
          not harder
        </h1>

        <p className="text-purple-200/80 text-lg sm:text-xl mt-6 max-w-2xl leading-relaxed">
          Maestra connects mentors and students in personalized classrooms.
          Share videos, notes, and collaborate in real-time — powered by AI that adapts to each learner.
        </p>

        <div className="flex items-center gap-4 mt-10">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all text-lg"
          >
            Start Learning Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all text-lg"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 max-w-4xl w-full">
          {[
            {
              icon: "📚",
              title: "Virtual Classrooms",
              desc: "Create and join classrooms with invite codes. Organize your learning space.",
            },
            {
              icon: "🎬",
              title: "Video Lessons",
              desc: "Mentors share video content. AI adapts lessons to each student's pace.",
            },
            {
              icon: "💬",
              title: "Collaborative Chat",
              desc: "Real-time classroom discussions. Ask questions and get instant help.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-left transition-all duration-300 hover:border-purple-500/30"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-purple-300/70 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-purple-500 text-sm">
          © 2026 Maestra. AI-Powered Tutoring.
        </p>
      </footer>
    </div>
  );
}
