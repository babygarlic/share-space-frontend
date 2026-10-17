"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
      });
      setAuth(data.user, data.accessToken);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || "Đăng ký thất bại.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-3" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold">SS</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Tạo tài khoản</h1>
          <p className="text-white/50">Bắt đầu cộng tác cùng nhóm ngay hôm nay</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Tên hiển thị
              </label>
              <input
                id="register-name"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                className="input-field"
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                placeholder="your@email.com"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Mật khẩu{" "}
                <span className="text-white/30 text-xs">(tối thiểu 8 ký tự)</span>
              </label>
              <input
                id="register-password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Xác nhận mật khẩu
              </label>
              <input
                id="register-confirm-password"
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary mt-2"
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản miễn phí"}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-4 leading-relaxed">
            Bằng cách đăng ký, bạn đồng ý với{" "}
            <span className="text-white/60">Điều khoản Dịch vụ</span> và{" "}
            <span className="text-white/60">Chính sách Quyền riêng tư</span> của chúng tôi.
          </p>
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          Đã có tài khoản?{" "}
          <Link
            href="/auth/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
