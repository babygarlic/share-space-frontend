"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesApi } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import CreateSpaceModal from "./components/CreateSpaceModal";

interface Space {
  id: string;
  title: string;
  description?: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  templateCode: string;
  ownerId: string;
  createdAt: string;
  shareLink?: { token: string; url: string };
}

const statusConfig = {
  PLANNING: { label: "Lên kế hoạch", class: "badge-planning", icon: "📋" },
  ACTIVE: { label: "Đang diễn ra", class: "badge-active", icon: "🚀" },
  COMPLETED: { label: "Hoàn thành", class: "badge-completed", icon: "✅" },
  ARCHIVED: { label: "Lưu trữ", class: "badge-archived", icon: "📦" },
};

const templateConfig: Record<string, { icon: string; label: string; color: string }> = {
  TRIP: { icon: "✈️", label: "Du lịch", color: "from-blue-500/10 to-cyan-500/10" },
  PROJECT: { icon: "💼", label: "Dự án", color: "from-purple-500/10 to-indigo-500/10" },
  EVENT: { icon: "🎉", label: "Sự kiện", color: "from-pink-500/10 to-rose-500/10" },
  STUDY: { icon: "📚", label: "Học tập", color: "from-emerald-500/10 to-teal-500/10" },
  OTHER: { icon: "🌟", label: "Khác", color: "from-amber-500/10 to-orange-500/10" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, router]);

  const { data: spaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: spacesApi.getMySpaces,
    enabled: isAuthenticated,
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: (id: string) => spacesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spaces"] }),
  });

  const copyShareLink = async (token: string) => {
    const url = `${window.location.origin}/join/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Navbar */}
      <nav className="relative z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="text-white font-semibold text-lg hidden sm:block">Shared Space</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-sm">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.displayName?.[0]?.toUpperCase()}
            </div>
            <span className="text-white/70 font-medium">{user?.displayName}</span>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="text-white/50 hover:text-white/80 transition-colors text-sm px-3 py-1.5"
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Xin chào, {user?.displayName?.split(" ").pop()} 👋
            </h1>
            <p className="text-white/50">
              {spaces.length > 0
                ? `Bạn đang tham gia ${spaces.length} Space`
                : "Tạo Space đầu tiên để bắt đầu cộng tác"}
            </p>
          </div>

          <button
            id="create-space-btn"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo Space mới
          </button>
        </div>

        {/* Spaces Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-xl mb-4"></div>
                <div className="h-5 bg-white/10 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-6">🚀</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Chưa có Space nào
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Tạo Space đầu tiên và mời bạn bè tham gia qua link chia sẻ — không cần đăng ký!
            </p>
            <button
              id="create-first-space-btn"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo Space đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => {
              const tpl = templateConfig[space.templateCode] || templateConfig.OTHER;
              const status = statusConfig[space.status] || statusConfig.PLANNING;

              return (
                <div
                  key={space.id}
                  className={`glass rounded-2xl p-6 card-hover cursor-pointer bg-gradient-to-br ${tpl.color} group`}
                  onClick={() => router.push(`/spaces/${space.id}`)}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{tpl.icon}</div>
                    <span className={`badge ${status.class}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>

                  {/* Card Body */}
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">
                    {space.title}
                  </h3>
                  {space.description && (
                    <p className="text-white/50 text-sm mb-4 line-clamp-2">
                      {space.description}
                    </p>
                  )}

                  {/* Share Link */}
                  {space.shareLink && (
                    <div
                      className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex-1 px-3 py-1.5 bg-white/5 rounded-lg text-white/50 text-xs font-mono truncate">
                        /join/{space.shareLink.token}
                      </div>
                      <button
                        id={`copy-link-${space.id}`}
                        onClick={() => copyShareLink(space.shareLink!.token)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                        title="Sao chép link chia sẻ"
                      >
                        {copiedToken === space.shareLink.token ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-white/30 text-xs">
                      {new Date(space.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <button
                      id={`delete-space-${space.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Xóa Space "${space.title}"?`)) {
                          deleteSpaceMutation.mutate(space.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Space Modal */}
      {showCreateModal && (
        <CreateSpaceModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
