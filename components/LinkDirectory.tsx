'use client';

import React, { useState, useEffect } from 'react';

type LinkItem = {
  id: string;
  title: string;
  url: string;
  icon?: string;
};

const DEFAULT_LINKS: LinkItem[] = [
  { id: '1', title: 'MÁY TÍNH DESMOS', url: 'https://www.desmos.com/calculator', icon: '🧮' },
  { id: '2', title: 'PDF CONVERT', url: 'https://hotrohoctap.com/1ai/40pdf2wordocr/', icon: '📄' },
  { id: '3', title: 'GDRHUNGTBS', url: 'https://drive.google.com/drive/home?lfhs=2', icon: '☁️' },
  { id: '4', title: 'GIẢI TOÁN', url: 'https://gemini.google.com/gem/6d1ae3f4efcc', icon: '🤖' }
];

const GRADIENTS = [
  'from-rose-400 to-red-500 shadow-rose-500/30',
  'from-blue-400 to-indigo-500 shadow-blue-500/30',
  'from-emerald-400 to-teal-500 shadow-teal-500/30',
  'from-amber-400 to-orange-500 shadow-orange-500/30',
  'from-purple-400 to-fuchsia-500 shadow-purple-500/30',
  'from-cyan-400 to-sky-500 shadow-cyan-500/30',
];

export default function LinkDirectory() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isManaging, setIsManaging] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('danhBaLienKet_v2');
    if (saved) {
      try {
        setLinks(JSON.parse(saved));
      } catch (e) {
        setLinks(DEFAULT_LINKS);
      }
    } else {
      setLinks(DEFAULT_LINKS);
    }
  }, []);

  // Save to localStorage when links change
  useEffect(() => {
    if (links.length > 0) {
      localStorage.setItem('danhBaLienKet_v2', JSON.stringify(links));
    }
  }, [links]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;
    const newLink: LinkItem = {
      id: Date.now().toString(),
      title: newTitle,
      url: newUrl,
      icon: newLinkIcon || '🔗'
    };
    setLinks([...links, newLink]);
    setNewTitle('');
    setNewUrl('');
    setNewLinkIcon('');
  };

  const handleDelete = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  return (
    <div className="w-full bg-[#f0f9ff] py-12 px-4 md:px-8 mt-12 rounded-3xl relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsManaging(!isManaging)}
          className="bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          {isManaging ? 'Hoàn tất' : '⚙️ Quản lý danh bạ'}
        </button>
      </div>

      <div className="text-center mb-10 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-[#1e3a8a] mb-3 tracking-wide uppercase">
          DANH BẠ LIÊN KẾT
        </h2>
        <p className="text-slate-500 font-medium">
          Hệ thống thư viện đề thi và học liệu tham khảo chuyên môn Toán - Tin.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
        {links.map((link, index) => {
          const gradient = GRADIENTS[index % GRADIENTS.length];
          return (
          <div key={link.id} className="relative group flex flex-col items-center">
            <a
              href={isManaging ? undefined : link.url}
              target={isManaging ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-3 w-full bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ${isManaging ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl shadow-lg border border-white/20 group-hover:scale-110 transition-transform duration-300`}>
                {link.icon || '🔗'}
              </div>
              <h3 className="font-bold text-slate-700 text-center text-sm md:text-base line-clamp-2 px-1">
                {link.title}
              </h3>
            </a>
            
            {isManaging && (
              <button
                onClick={() => handleDelete(link.id)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md z-10"
                title="Xóa liên kết"
              >
                ✕
              </button>
            )}
          </div>
        )})}
      </div>

      {isManaging && (
        <div className="max-w-5xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Thêm liên kết mới</h3>
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Tên liên kết (VD: MÁY TÍNH DESMOS)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <input
              type="url"
              placeholder="Đường dẫn (URL)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <input
              type="text"
              placeholder="Icon (VD: 🤖, 📚, 🔗)"
              value={newLinkIcon}
              onChange={(e) => setNewLinkIcon(e.target.value)}
              className="w-24 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-center"
            />
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-xl font-semibold shadow-sm transition-colors"
            >
              Thêm
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
