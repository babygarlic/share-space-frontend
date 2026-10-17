"use client";

import { useState } from "react";
import { shareLinksApi } from "../../../lib/api";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceTitle: string;
  currentShareLink: string | null;
  isOwnerOrAdmin: boolean;
  onLinkUpdated: (newLink: string | null) => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  spaceId,
  spaceTitle,
  currentShareLink,
  isOwnerOrAdmin,
  onLinkUpdated,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "qr" | "custom">("link");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom link states
  const [roleGranted, setRoleGranted] = useState<"GUEST" | "MEMBER">("GUEST");
  const [maxUses, setMaxUses] = useState<string>("30");

  if (!isOpen) return null;

  const fullShareUrl = currentShareLink
    ? currentShareLink.startsWith("http")
      ? currentShareLink
      : typeof window !== "undefined"
      ? `${window.location.origin}${currentShareLink}`
      : currentShareLink
    : "";

  const handleCopy = async () => {
    if (!fullShareUrl) return;
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      alert("Không thể sao chép tự động. Vui lòng copy thủ công: " + fullShareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Mời tham gia: ${spaceTitle}`,
          text: `Tham gia Không gian "${spaceTitle}" cùng tôi trên Shared Space ngay không cần tài khoản!`,
          url: fullShareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    const ok = confirm(
      "Bạn có chắc muốn đổi mã liên kết mới? Mã liên kết cũ sẽ bị vô hiệu hóa ngay lập tức và bất kỳ ai dùng link cũ sẽ không thể vào Space."
    );
    if (!ok) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await shareLinksApi.regenerate(spaceId);
      const newUrl = res.url || `/s/${res.token}`;
      onLinkUpdated(newUrl);
      setMessage({ type: "success", text: "Đã tạo liên kết mới và hủy liên kết cũ thành công!" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể tạo lại liên kết.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    const ok = confirm(
      "Bạn có chắc chắn muốn thu hồi toàn bộ liên kết chia sẻ? Người ngoài sẽ không thể truy cập Space cho đến khi bạn tạo liên kết mới."
    );
    if (!ok) return;

    setLoading(true);
    setMessage(null);
    try {
      await shareLinksApi.revoke(spaceId);
      onLinkUpdated(null);
      setMessage({ type: "success", text: "Đã thu hồi tất cả liên kết chia sẻ của Space!" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể thu hồi liên kết.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await shareLinksApi.createCustom(spaceId, {
        roleGranted,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      });
      const newUrl = res.url || `/s/${res.token}`;
      onLinkUpdated(newUrl);
      setMessage({
        type: "success",
        text: `Đã tạo link tùy chỉnh cấp quyền ${roleGranted} (Tối đa ${maxUses || "∞"} lượt)!`,
      });
      setActiveTab("link");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể tạo liên kết tùy chỉnh.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // QR Code URL via QR Server API (supports offline/client rendering)
  const qrCodeUrl = fullShareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=15&data=${encodeURIComponent(
        fullShareUrl
      )}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold">
              🔗
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Chia sẻ Không gian (US-09)</h3>
              <p className="text-xs text-white/50">{spaceTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "link"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-white/60 hover:text-white"
            }`}
          >
            📋 Sao chép Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "qr"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-white/60 hover:text-white"
            }`}
          >
            📱 Mã QR Code
          </button>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === "custom"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              ⚙️ Tùy chỉnh link
            </button>
          )}
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-2xl text-xs mb-4 flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "!"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Link & Social Share */}
        {activeTab === "link" && (
          <div className="space-y-6">
            {fullShareUrl ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/60 block">
                    Đường dẫn chia sẻ trực tiếp (Khách nhập tên vào ngay):
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
                    <input
                      type="text"
                      readOnly
                      value={fullShareUrl}
                      className="bg-transparent text-sm text-indigo-300 font-mono px-2 py-1 outline-none flex-1 truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        copied
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                      }`}
                    >
                      {copied ? "✓ Đã sao chép!" : "Sao chép"}
                    </button>
                  </div>
                </div>

                {/* Social Share Shortcuts */}
                <div>
                  <label className="text-xs font-semibold text-white/60 block mb-3">
                    Chia sẻ nhanh qua mạng xã hội:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <a
                      href={`https://zalo.me/share?url=${encodeURIComponent(fullShareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-medium"
                    >
                      <span className="text-base font-bold">💬</span>
                      <span>Zalo</span>
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        fullShareUrl
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-medium"
                    >
                      <span className="text-base font-bold">📘</span>
                      <span>Messenger</span>
                    </a>

                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(
                        fullShareUrl
                      )}&text=${encodeURIComponent(`Mời tham gia Không gian ${spaceTitle}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-medium"
                    >
                      <span className="text-base font-bold">✈️</span>
                      <span>Telegram</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-medium cursor-pointer"
                    >
                      <span className="text-base font-bold">📲</span>
                      <span>Khác...</span>
                    </button>
                  </div>
                </div>

                {/* Revoke & Regenerate Actions (US-10) */}
                {isOwnerOrAdmin && (
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleRegenerate}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🔄</span>
                      <span>Đổi mã mới (Hủy link cũ)</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleRevoke}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🚫</span>
                      <span>Thu hồi liên kết</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="text-4xl">🔒</div>
                <h4 className="text-white font-bold">Không gian chưa có liên kết mở</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto">
                  Liên kết chia sẻ hiện đang bị khóa hoặc đã bị thu hồi để đảm bảo riêng tư.
                </p>
                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleRegenerate}
                    className="btn-primary inline-flex text-xs"
                  >
                    Tạo lại Liên kết Chia sẻ Mới
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: QR Code */}
        {activeTab === "qr" && (
          <div className="text-center space-y-4 py-2">
            {qrCodeUrl ? (
              <>
                <div className="p-4 bg-white rounded-3xl inline-block shadow-xl mx-auto border-4 border-indigo-500/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt={`Mã QR ${spaceTitle}`}
                    className="w-48 h-48 rounded-xl object-contain"
                  />
                </div>
                <p className="text-xs text-white/60">
                  Quét mã bằng Camera điện thoại hoặc Zalo để vào Space tức thì không cần nhập mật khẩu.
                </p>
                <div className="flex justify-center gap-3">
                  <a
                    href={qrCodeUrl}
                    download={`QR_${spaceTitle}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
                  >
                    💾 Tải ảnh QR
                  </a>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                  >
                    {copied ? "✓ Đã sao chép link" : "Sao chép link"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-white/50 py-8">Chưa có liên kết chia sẻ đang hoạt động.</p>
            )}
          </div>
        )}

        {/* Tab 3: Custom Link (US-09) */}
        {activeTab === "custom" && (
          <form onSubmit={handleCreateCustom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Vai trò cấp cho người gia nhập:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoleGranted("GUEST")}
                  className={`p-3 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                    roleGranted === "GUEST"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <strong className="block text-white font-semibold">Khách (Guest)</strong>
                  <span className="text-[11px] text-white/50">Chỉ xem, vote và tham gia chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleGranted("MEMBER")}
                  className={`p-3 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                    roleGranted === "MEMBER"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <strong className="block text-white font-semibold">Thành viên (Member)</strong>
                  <span className="text-[11px] text-white/50">Được tạo công việc và chi tiêu</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Số lượt tham gia tối đa:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="VD: 30"
                className="input-field w-full"
              />
              <span className="text-[11px] text-white/40 mt-1 block">
                Link sẽ tự động hết hiệu lực khi đạt số lượng người tham gia này.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm mt-4 cursor-pointer"
            >
              {loading ? "Đang tạo liên kết..." : "Tạo Liên Kết Tùy Chỉnh Ngay"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
