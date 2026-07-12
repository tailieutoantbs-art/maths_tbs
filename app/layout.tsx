import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from '@/components/ToastProvider'; // Nhúng bộ cấp phát thông báo

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hệ thống Toán TBS",
  description: "Không gian học tập và khảo thí tương tác Tổ Toán TBS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* Bọc ToastProvider xung quanh toàn bộ ứng dụng */}
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}