"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesApi } from "../../lib/api";

interface Props {
  onClose: () => void;
}

const TEMPLATES = [
  { code: "TRIP", icon: "✈️", label: "Du lịch", desc: "Kế hoạch chuyến đi nhóm" },
  { code: "PROJECT", icon: "💼", label: "Dự án", desc: "Theo dõi tiến độ công việc" },
  { code: "EVENT", icon: "🎉", label: "Sự kiện", desc: "Tổ chức sự kiện & tiệc" },
  { code: "STUDY", icon: "📚", label: "Học tập", desc: "Nhóm học tập & ôn thi" },
  { code: "OTHER", icon: "🌟", label: "Khác", desc: "Space tùy chỉnh tự do" },
];

export default function CreateSpaceModal({ onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    templateCode: "TRIP",
    targetBudget: 0,
    currency: "VND",
  });

  const createMutation = useMutation({
    mutationFn: spacesApi.create,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      onClose();
      if (data?.id) {
        router.push(`/spaces/${data.id}`);
      }
    },
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg glass-strong rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Tạo Space mới</h2>
            <p className="text-white/50 text-sm">
              {step === 1 ? "Chọn loại Space phù hợp" : "Đặt tên và mô tả"}
            </p>
          </div>
          <button
            id="close-create-modal"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-indigo-500" : "bg-white/10"}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-indigo-500" : "bg-white/10"}`} />
        </div>

        {step === 1 ? (
          <>
            {/* Template Selection */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.code}
                  id={`template-${tpl.code.toLowerCase()}`}
                  onClick={() => setForm({ ...form, templateCode: tpl.code })}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${form.templateCode === tpl.code
                      ? "border-indigo-500/50 bg-indigo-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
                    }`}
                >
                  <span className="text-3xl">{tpl.icon}</span>
                  <div>
                    <div className="text-white font-semibold">{tpl.label}</div>
                    <div className="text-white/50 text-sm">{tpl.desc}</div>
                  </div>
                  {form.templateCode === tpl.code && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              id="next-step-btn"
              onClick={() => setStep(2)}
              className="btn-primary"
            >
              Tiếp theo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </>
        ) : (
          <>
            {/* Space Details */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Tên Space <span className="text-red-400">*</span>
                </label>
                <input
                  id="space-title"
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    form.templateCode === "TRIP"
                      ? "Đà Lạt 3 ngày — Tháng 10"
                      : form.templateCode === "PROJECT"
                        ? "Website ra mắt sản phẩm"
                        : "Tên Space của bạn"
                  }
                  className="input-field"
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Mô tả <span className="text-white/30 text-xs">(tùy chọn)</span>
                </label>
                <textarea
                  id="space-description"
                  placeholder="Mô tả ngắn về mục tiêu của Space này..."
                  className="input-field resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {form.templateCode === "TRIP" && (
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Ngân sách mục tiêu{" "}
                    <span className="text-white/30 text-xs">(VND, tùy chọn)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="space-budget"
                      type="number"
                      min={0}
                      placeholder="5,000,000"
                      className="input-field pr-16"
                      value={form.targetBudget || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          targetBudget: Number(e.target.value),
                        })
                      }
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                      VND
                    </span>
                  </div>
                </div>
              )}
            </div>

            {createMutation.isError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                Tạo Space thất bại. Vui lòng thử lại.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-[1]"
              >
                Quay lại
              </button>
              <button
                id="create-space-submit"
                onClick={handleCreate}
                disabled={!form.title.trim() || createMutation.isPending}
                className="btn-primary flex-[2]"
              >
                {createMutation.isPending ? (
                  <span className="spinner" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {createMutation.isPending ? "Đang tạo..." : "Tạo Space & sinh link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
