"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { spacesApi } from "../../../lib/api";

export interface SpaceMemberItem {
  id: string;
  spaceId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
  nickname?: string;
  joinedAt: string;
  lastActiveAt?: string;
  isGuest: boolean;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  userId?: string | null;
  guestId?: string | null;
}

interface MembersPanelProps {
  spaceId: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
  currentUserId?: string | null;
  currentGuestId?: string | null;
  onMemberCountUpdated?: (count: number) => void;
  onOpenShareModal?: () => void;
}

export default function MembersPanel({
  spaceId,
  currentUserRole,
  currentUserId,
  currentGuestId,
  onMemberCountUpdated,
  onOpenShareModal,
}: MembersPanelProps) {
  const router = useRouter();
  const [members, setMembers] = useState<SpaceMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await spacesApi.getMembers(spaceId);
      setMembers(data);
      if (onMemberCountUpdated) {
        onMemberCountUpdated(data.length);
      }
    } catch {
      setError("Không thể tải danh sách thành viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [spaceId]);

  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const isOwnerOrAdmin = isOwner || isAdmin;

  const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "MEMBER" | "GUEST") => {
    setActionLoading(memberId);
    setError("");
    setSuccessMsg("");
    try {
      await spacesApi.updateMemberRole(spaceId, memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setSuccessMsg(`Đã đổi vai trò thành ${newRole}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể cập nhật vai trò.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (member: SpaceMemberItem) => {
    const ok = confirm(
      `Bạn có chắc muốn xóa thành viên "${member.displayName}" ra khỏi Space?`
    );
    if (!ok) return;

    setActionLoading(member.id);
    setError("");
    setSuccessMsg("");
    try {
      await spacesApi.removeMember(spaceId, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      if (onMemberCountUpdated) {
        onMemberCountUpdated(members.length - 1);
      }
      setSuccessMsg(`Đã xóa "${member.displayName}" khỏi Space.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể xóa thành viên.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveSpace = async () => {
    const ok = confirm(
      "Bạn có chắc muốn rời khỏi Space này? Bạn sẽ không còn quyền truy cập trừ khi được mời lại."
    );
    if (!ok) return;

    try {
      await spacesApi.leave(spaceId);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể rời khỏi Space.";
      alert(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span>👑</span> Chủ sở hữu
          </span>
        );
      case "ADMIN":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <span>🛡️</span> Quản trị viên
          </span>
        );
      case "MEMBER":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Thành viên
          </span>
        );
      case "GUEST":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-500/15 text-slate-300 border border-slate-500/30">
            Khách
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
      {/* Header & Capacity Guard (US-12) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>👥</span> Quản lý Thành viên & Phân quyền (US-11)
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Hiện tại: <strong className="text-indigo-400">{members.length}</strong> / 30 thành viên tối đa (US-12 Capacity Guard)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> Mời thêm người
            </button>
          )}

          {!isOwner && (
            <button
              type="button"
              onClick={handleLeaveSpace}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              Rời Space
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-white/40">Đang tải danh sách thành viên...</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {members.map((member) => {
            const isSelf =
              (member.userId && member.userId === currentUserId) ||
              (member.guestId && member.guestId === currentGuestId);

            return (
              <div
                key={member.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] -mx-2 px-2 rounded-2xl transition-colors"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {member.displayName}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                          Bạn
                        </span>
                      )}
                      {member.isGuest && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          Khách vãng lai
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                      {member.email ? (
                        <span>{member.email}</span>
                      ) : (
                        <span>Chưa liên kết email</span>
                      )}
                      <span>•</span>
                      <span>
                        Tham gia: {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role & Action Controls (US-11 RBAC) */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Role Display / Selector */}
                  {isOwner && member.role !== "OWNER" ? (
                    <select
                      value={member.role}
                      disabled={actionLoading === member.id}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as "ADMIN" | "MEMBER" | "GUEST"
                        )
                      }
                      className="bg-slate-800 text-xs text-indigo-300 font-semibold px-3 py-1.5 rounded-xl border border-white/10 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="ADMIN">🛡️ Quản trị viên (Admin)</option>
                      <option value="MEMBER">👤 Thành viên (Member)</option>
                      <option value="GUEST">👀 Khách (Guest)</option>
                    </select>
                  ) : (
                    getRoleBadge(member.role)
                  )}

                  {/* Kick Button (US-11) */}
                  {isOwnerOrAdmin && member.role !== "OWNER" && !isSelf && (
                    <button
                      type="button"
                      disabled={actionLoading === member.id}
                      onClick={() => handleRemoveMember(member)}
                      title="Xóa thành viên khỏi Space"
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
