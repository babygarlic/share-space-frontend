"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { guestsApi, shareLinksApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

interface SpacePreview {
  isValid: boolean;
  spaceId: string;
  title: string;
  description?: string;
  creatorName: string;
  membersCount: number;
  templateCode: string;
}

const templateEmoji: Record<string, string> = {
  TRIP: "✈️",
  PROJECT: "💼",
  EVENT: "🎉",
  STUDY: "📚",
  OTHER: "🌟",
};

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [preview, setPreview] = useState<SpacePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (!token) return;
    shareLinksApi
      .resolve(token as string)
      .then(setPreview)
      .catch(() => setPreviewError("Link không hợp lệ hoặc đã hết hạn."))
      .finally(() => setLoadingPreview(false));
  }, [token]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !token) return;

    setJoining(true);
    setJoinError("");

    try {
      const data = await guestsApi.joinAnonymous({
        displayName: displayName.trim(),
        inviteToken: token as string,
      });

      // Lưu Guest token và chuyển đến Space
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem(
        "guest_session",
        JSON.stringify({
          guestId: data.guestId,
          displayName: data.displayName,
          spaceId: data.spaceId,
        })
      );

      router.push(`/spaces/${data.spaceId}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Tham gia thất bại. Vui lòng thử lại.";
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="relative z-10 w-full max-w-md">
        {loadingPreview ? (
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-white/50">Đang tải thông tin Space...</p>
          </div>
        ) : previewError ? (
          <div className="glass-strong rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-white mb-2">Link không hợp lệ</h2>
            <p className="text-white/50 mb-6">{previewError}</p>
            <button
              onClick={() => router.push("/")}
              className="btn-primary"
            >
              Về trang chủ
            </button>
          </div>
        ) : preview ? (
          <>
            {/* Space Preview Card */}
            <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 p-8 text-center border-b border-white/10">
                <div className="text-6xl mb-4">
                  {templateEmoji[preview.templateCode] || "🌟"}
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {preview.title}
                </h1>
                {preview.description && (
                  <p className="text-white/60 text-sm">{preview.description}</p>
                )}
                <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/50">
                  <span>👤 {preview.creatorName}</span>
                  <span>•</span>
                  <span>👥 {preview.membersCount} thành viên</span>
                </div>
              </div>

              {/* Join Form */}
              <div className="p-8">
                <h2 className="text-lg font-semibold text-white mb-1 text-center">
                  Bạn được mời tham gia Space này
                </h2>
                <p className="text-white/50 text-sm text-center mb-6">
                  Nhập tên hiển thị để tham gia ngay — không cần đăng ký!
                </p>

                {joinError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {joinError}
                  </div>
                )}

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Tên của bạn
                    </label>
                    <input
                      id="guest-display-name"
                      type="text"
                      autoFocus
                      required
                      placeholder="Nhập tên hiển thị..."
                      className="input-field text-center text-lg"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  <button
                    id="join-guest-btn"
                    type="submit"
                    disabled={!displayName.trim() || joining}
                    className="btn-primary text-lg py-4"
                  >
                    {joining ? <span className="spinner" /> : "🚀"}
                    {joining ? "Đang tham gia..." : "Tham gia ngay"}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-5">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-white/30 text-xs">hoặc</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {isAuthenticated ? (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="btn-secondary"
                  >
                    Vào dashboard của tôi
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="btn-secondary"
                  >
                    Đăng nhập bằng tài khoản
                  </button>
                )}
              </div>
            </div>

            <p className="text-center text-white/30 text-xs mt-6">
              Bằng cách tham gia, bạn đồng ý với Điều khoản Dịch vụ của Shared Space.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
