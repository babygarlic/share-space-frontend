"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "./store/auth.store";

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="text-white font-semibold text-lg">Shared Space</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-white/70 hover:text-white transition-colors text-sm font-medium px-4 py-2"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-indigo-300 mb-8 border border-indigo-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Sprint 1 — MVP đang được xây dựng
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Cộng tác{" "}
          <span className="gradient-text">tức thì</span>
          <br />
          Không cần tài khoản
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Tạo không gian cộng tác cho nhóm trong{" "}
          <span className="text-white/90 font-semibold">10 giây</span>.
          Chia sẻ link, bạn bè tham gia ngay — kể cả khi chưa đăng ký.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auth/register"
            id="cta-register"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl text-lg transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1"
          >
            <span>Tạo Space miễn phí</span>
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/auth/login"
            id="cta-login"
            className="inline-flex items-center gap-2 px-8 py-4 glass text-white/80 hover:text-white font-semibold rounded-2xl text-lg transition-all hover:-translate-y-1"
          >
            Đã có tài khoản
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20 px-4">
        {[
          {
            icon: "⚡",
            title: "Tham gia tức thì",
            desc: "Bạn bè nhập tên và vào Space ngay qua link chia sẻ — không cần đăng ký.",
            color: "from-indigo-500/10 to-purple-500/10",
          },
          {
            icon: "🔗",
            title: "Share Link thông minh",
            desc: "Sinh link ngẫu nhiên 8 ký tự, có thể thu hồi và tạo mới bất kỳ lúc nào.",
            color: "from-purple-500/10 to-pink-500/10",
          },
          {
            icon: "🛡️",
            title: "Phân quyền RBAC",
            desc: "Owner, Admin, Member, Guest — kiểm soát chặt chẽ ai có thể làm gì.",
            color: "from-pink-500/10 to-rose-500/10",
          },
        ].map((card) => (
          <div key={card.title} className={`glass rounded-2xl p-6 card-hover bg-gradient-to-br ${card.color}`}>
            <div className="text-3xl mb-4">{card.icon}</div>
            <h3 className="text-white font-semibold text-lg mb-2">{card.title}</h3>
            <p className="text-white/55 text-sm leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Sprint 1 Progress Banner */}
      <div className="relative z-10 mt-16 max-w-4xl mx-auto w-full px-4">
        <div className="glass rounded-2xl p-6 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-emerald-400 text-sm font-semibold">Sprint 1 — In Progress (Oct 5–18, 2026)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "US-01 Guest JWT", done: true },
              { label: "US-03 Email Auth", done: true },
              { label: "US-04 Google OAuth", done: false },
              { label: "US-05 Create Space", done: true },
              { label: "US-06 Lifecycle", done: true },
            ].map((us) => (
              <div key={us.label} className={`rounded-xl px-3 py-2 text-center text-xs font-medium transition-all ${
                us.done
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}>
                {us.done ? "✓ " : "○ "}{us.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-16 mb-8 text-center text-white/30 text-sm">
        <p>Shared Space Platform · Sprint 1 of 6 · MVP in progress</p>
      </footer>
    </main>
  );
}
