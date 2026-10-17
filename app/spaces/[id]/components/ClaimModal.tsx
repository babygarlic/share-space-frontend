"use client";

import { useState } from "react";
import { guestsApi } from "../../../lib/api";
import { useAuthStore } from "../../../store/auth.store";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
  onClaimSuccess: () => void;
}

export default function ClaimModal({
  isOpen,
  onClose,
  guestName,
  onClaimSuccess,
}: ClaimModalProps) {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const data = await guestsApi.claimAccount({
        email: email.trim(),
        password,
      });

      // Lưu token chính thức và xóa session khách
      localStorage.removeItem("guest_session");
      if (data.refreshToken) {
        localStorage.setItem("refresh_token", data.refreshToken);
      }

      setAuth(
        {
          id: data.userId,
          email: data.email,
          displayName: data.displayName || guestName,
        },
        data.accessToken
      );

      onClaimSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Liên kết tài khoản thất bại. Vui lòng thử lại.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold">
              🛡️
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Lưu Space vào Tài khoản (US-02)</h3>
              <p className="text-xs text-white/50">Tài khoản khách: {guestName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          Tạo tài khoản chính thức để giữ lại toàn bộ lịch sử công việc, bình luận và chi tiêu mà bạn đã tạo với tên <strong>&ldquo;{guestName}&rdquo;</strong>.
        </p>

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Email đăng nhập:
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: ban@gmail.com"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Mật khẩu mới (tối thiểu 8 ký tự):
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Xác nhận mật khẩu:
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm mt-6 font-bold cursor-pointer"
          >
            {loading ? "Đang liên kết tài khoản..." : "Xác nhận & Nâng cấp Tài khoản"}
          </button>
        </form>
      </div>
    </div>
  );
}
