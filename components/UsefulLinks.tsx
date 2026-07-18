'use client';

import React from 'react';

const LINKS = [
  { title: 'Bộ Giáo Dục & Đào Tạo', url: 'https://moet.gov.vn/', icon: '🏛️' },
  { title: 'Thư viện Học liệu Mở', url: 'https://igiaoduc.vn/', icon: '📚' },
  { title: 'Toán học & Tuổi trẻ', url: '#', icon: '📰' },
  { title: 'Diễn đàn Toán học VN', url: 'https://diendantoanhoc.org/', icon: '🧮' },
];

export default function UsefulLinks() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">🔗</span> Liên Kết Hữu Ích
      </h3>
      <div className="flex flex-col gap-3">
        {LINKS.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 border border-transparent hover:border-sky-100 transition-all group"
          >
            <span className="text-2xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
              {link.icon}
            </span>
            <span className="font-semibold text-slate-600 group-hover:text-sky-700">
              {link.title}
            </span>
          </a>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white">
        <h4 className="font-bold mb-1">📢 Thông báo nhanh</h4>
        <p className="text-sm text-indigo-100">Kỳ thi học kỳ sẽ diễn ra vào tuần tới. Chúc các em ôn tập tốt!</p>
      </div>
    </div>
  );
}
