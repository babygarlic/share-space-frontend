"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { spacesApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import ShareModal from "./components/ShareModal";
import MembersPanel from "./components/MembersPanel";
import ClaimModal from "./components/ClaimModal";

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
  const { user } = useAuthStore();

  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Sprint 2 Modals and Tabs state
  const [activeTab, setActiveTab] = useState<"overview" | "members">("overview");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [guestSession, setGuestSession] = useState<{
    guestId?: string;
    displayName?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("guest_session");
      if (stored) {
        try {
          setGuestSession(JSON.parse(stored));
        } catch {
          // invalid json
        }
      }
    }
  }, []);

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
    const fullUrl = space.shareLink.startsWith("http")
      ? space.shareLink
      : `${window.location.origin}${space.shareLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const isOwnerOrAdmin = isOwner || space?.currentUserRole === "ADMIN";
  const isArchived = space?.status === "ARCHIVED";
  const isGuest = !!guestSession || space?.currentUserRole === "GUEST";

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
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
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
                <h1 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {space.title}
                </h1>
                {statusBadge(space.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <span>🔗</span>
              <span className="hidden sm:inline">Chia sẻ (US-09)</span>
            </button>

            <span className="text-xs text-white/40 hidden sm:inline">
              Vai trò: <strong className="text-indigo-400">{space.currentUserRole || "MEMBER"}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Guest Account Claiming Banner (US-02) */}
      {isGuest && (
        <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border-b border-amber-500/30 px-4 py-3">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <span className="text-base">🌟</span>
              <span>
                Bạn đang tham gia với tư cách <strong>Khách ({guestSession?.displayName || "Guest"})</strong>. Hãy liên kết tài khoản để không bị mất quyền truy cập khi đổi thiết bị!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-extrabold text-xs shadow-lg hover:brightness-110 transition-all shrink-0 cursor-pointer"
            >
              Lưu Space vào Tài khoản (US-02)
            </button>
          </div>
        </div>
      )}

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
        {/* Navigation Tabs (Sprint 1 vs Sprint 2) */}
        <div className="flex border-b border-white/10 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <span>📊</span> Tổng quan Không gian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "members"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <span>👥</span> Thành viên & Phân quyền (US-11)
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300">
              {space.stats?.membersCount || 1}
            </span>
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
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

              {/* Smart Share Link Banner (US-09 / US-10) */}
              {space.shareLink && (
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-white/50">Link mời tham gia thông minh (US-09)</p>
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

                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📱</span> Mã QR & Mạng xã hội
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div
                onClick={() => setActiveTab("members")}
                className="glass-panel p-5 rounded-2xl border border-white/10 cursor-pointer hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase tracking-wider block mb-1">
                    Thành viên tham gia
                  </span>
                  <span className="text-xs text-indigo-400">Xem tất cả →</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {space.stats?.membersCount || 1}
                  </span>
                  <span className="text-xs text-slate-400">/ 30 người (tối đa)</span>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-white/10">
                <span className="text-xs text-white/50 uppercase tracking-wider block mb-1">
                  Công việc hoàn thành
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">
                    {space.stats?.tasks?.completed || 0}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {space.stats?.tasks?.total || 0} việc
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
          </>
        ) : (
          /* Members Panel (US-11 & US-12) */
          <MembersPanel
            spaceId={spaceId}
            currentUserRole={space.currentUserRole || "MEMBER"}
            currentUserId={user?.id}
            currentGuestId={guestSession?.guestId}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onMemberCountUpdated={(count) =>
              setSpace((prev) =>
                prev ? { ...prev, stats: { ...prev.stats!, membersCount: count } } : null
              )
            }
          />
        )}
      </main>

      {/* Share Modal (US-09 & US-10) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        spaceId={spaceId}
        spaceTitle={space.title}
        currentShareLink={space.shareLink || null}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onLinkUpdated={(newLink) => {
          setSpace((prev) => (prev ? { ...prev, shareLink: newLink } : null));
        }}
      />

      {/* Claim Modal (US-02) */}
      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        guestName={guestSession?.displayName || "Guest"}
        onClaimSuccess={() => {
          setGuestSession(null);
          fetchSpace();
          alert("🎉 Chúc mừng! Tài khoản của bạn đã được nâng cấp chính thức thành công.");
        }}
      />
    </div>
  );
}
