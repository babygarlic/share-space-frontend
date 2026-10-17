"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { spacesApi, shareLinksApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

interface SpaceDetail {
  id: string;
  title: string;
  description?: string;
  templateCode: string;
  targetBudget?: number;
  currency?: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  ownerId: string;
  owner?: {
    id: string;
    displayName: string;
    email: string;
  };
  currentUserRole?: "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
  stats?: {
    membersCount: number;
    tasks: {
      total: number;
      completed: number;
    };
  };
  shareLink?: string | null;
}

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const spaceId = resolvedParams.id;
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchSpace = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await spacesApi.getById(spaceId);
      setSpace(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Không thể tải thông tin Space.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpace();
  }, [spaceId]);

  const handleCopyLink = () => {
    if (!space?.shareLink) return;
    navigator.clipboard.writeText(space.shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateLink = async () => {
    try {
      setRegenerating(true);
      const res = await shareLinksApi.regenerate(spaceId);
      setSpace((prev) =>
        prev
          ? {
              ...prev,
              shareLink: res.shareLink || res.url,
            }
          : null
      );
      fetchSpace();
    } catch {
      alert("Không thể tạo lại liên kết chia sẻ.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleStatusChange = async (
    newStatus: "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
  ) => {
    if (!space) return;
    if (newStatus === "ARCHIVED") {
      const ok = confirm(
        "Bạn có chắc muốn lưu trữ Space này? Sau khi lưu trữ, Space sẽ chuyển sang chế độ Chỉ đọc (Read-only)."
      );
      if (!ok) return;
    }

    try {
      setUpdatingStatus(true);
      await spacesApi.updateStatus(spaceId, { status: newStatus });
      setSpace((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Không thể cập nhật trạng thái.";
      alert(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isOwner = space?.currentUserRole === "OWNER" || space?.ownerId === user?.id;
  const isArchived = space?.status === "ARCHIVED";

  const statusBadge = (st: string) => {
    switch (st) {
      case "PLANNING":
        return <span className="badge badge-warning">Lên kế hoạch</span>;
      case "ACTIVE":
        return <span className="badge badge-success">Đang diễn ra</span>;
      case "COMPLETED":
        return <span className="badge badge-info">Đã hoàn thành</span>;
      case "ARCHIVED":
        return <span className="badge badge-neutral">Đã lưu trữ (Chỉ đọc)</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Lỗi truy cập Space</h2>
          <p className="text-white/60 text-sm mb-6">{error || "Space không tồn tại"}</p>
          <Link href="/dashboard" className="btn-primary inline-flex">
            Quay lại Danh sách Space
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Quay về Dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white truncate max-w-[240px] sm:max-w-md">
                  {space.title}
                </h1>
                {statusBadge(space.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 hidden sm:inline">
              Vai trò: <strong className="text-indigo-400">{space.currentUserRole || "MEMBER"}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Archived Read-Only Warning Banner (US-06) */}
      {isArchived && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 py-3 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-9a4 4 0 10-8 0v4h8V6z" />
          </svg>
          <span>Space này đã được lưu trữ (ARCHIVED). Giao diện đang ở chế độ Chỉ đọc (Read-only).</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Space Hero & Overview Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Template: {space.templateCode}
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {space.title}
              </h2>
              {space.description && (
                <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                  {space.description}
                </p>
              )}
            </div>

            {/* Lifecycle Status Management (US-06) */}
            {isOwner && (
              <div className="glass-panel p-4 rounded-2xl border border-white/10 shrink-0 self-start">
                <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
                  Chuyển trạng thái Vòng đời
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingStatus || space.status === st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        space.status === st
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {st === "PLANNING" && "Chuẩn bị"}
                      {st === "ACTIVE" && "Đang chạy"}
                      {st === "COMPLETED" && "Hoàn thành"}
                      {st === "ARCHIVED" && "Lưu trữ"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Share Link Banner (US-01 / US-09 / US-10) */}
          {space.shareLink && (
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-white/50">Link mời tham gia (Khách có thể vào ngay)</p>
                  <p className="text-sm font-mono text-indigo-300 truncate max-w-sm sm:max-w-md">
                    {space.shareLink}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? "Đã chép!" : "Sao chép link"}
                </button>

                {isOwner && !isArchived && (
                  <button
                    type="button"
                    disabled={regenerating}
                    onClick={handleRegenerateLink}
                    title="Đổi token link mới để thu hồi link cũ"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                  >
                    <svg
                      className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs text-white/50 uppercase tracking-wider block mb-1">
              Thành viên tham gia
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {space.stats?.membersCount || 1}
              </span>
              <span className="text-xs text-slate-400">người</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs text-white/50 uppercase tracking-wider block mb-1">
              Công việc hoàn thành
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">
                {space.stats?.tasks.completed || 0}
              </span>
              <span className="text-xs text-slate-400">
                / {space.stats?.tasks.total || 0} việc
              </span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs text-white/50 uppercase tracking-wider block mb-1">
              Ngân sách dự kiến
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400">
                {Number(space.targetBudget || 0).toLocaleString("vi-VN")}
              </span>
              <span className="text-xs text-slate-400">{space.currency || "VND"}</span>
            </div>
          </div>
        </div>

        {/* Sprint Roadmap Modules Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>📋</span> Danh sách công việc (Kanban)
              </h3>
              <span className="badge badge-info text-xs">Sprint 3</span>
            </div>
            <p className="text-sm text-slate-400">
              Kéo thả thẻ nhiệm vụ Kanban thời gian thực, gắn người phụ trách và theo dõi tiến độ chuẩn bị.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-500">
              Tính năng sẽ mở trong Sprint 3 — Nền tảng Cộng tác Thời gian thực
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>🗺️</span> Lịch trình & Chia tiền (Trip Engine)
              </h3>
              <span className="badge badge-info text-xs">Sprint 4</span>
            </div>
            <p className="text-sm text-slate-400">
              Lập lịch trình từng ngày, danh sách địa điểm ăn chơi và tự động chia nợ sòng phẳng kèm mã VietQR.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-500">
              Tính năng sẽ mở trong Sprint 4 — Chuyên mục Chuyến đi
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
