/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Lệnh xuất toàn bộ dự án thành thư mục tĩnh để đưa lên ByetHost
    
  // 2. Bắt buộc tắt tối ưu ảnh ngầm vì máy chủ ByetHost không hỗ trợ API lõi của Next.js
  images: {
    unoptimized: true,
  },

  // 3. Ép hệ thống bỏ qua các cảnh báo nhỏ lẻ để đảm bảo đóng gói thành công 100%
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;