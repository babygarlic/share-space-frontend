import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shared Space — Cộng tác tức thì, không cần tài khoản",
  description:
    "Tạo không gian cộng tác tức thì cho nhóm bạn. Chia sẻ link, tham gia ngay, lập kế hoạch cùng nhau — không cần đăng ký phức tạp.",
  keywords: ["cộng tác nhóm", "chia sẻ link", "lập kế hoạch du lịch", "quản lý nhóm"],
  openGraph: {
    title: "Shared Space — Cộng tác tức thì",
    description: "Tạo không gian cộng tác cho nhóm trong 10 giây",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
