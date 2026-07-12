'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

export default function AdvancedStudentDashboard() {
  const router = useRouter();
  
  // Thông số cấu hình Cloudinary thầy cung cấp
  const CLOUD_NAME = 'dlqjlzekw';
  const UPLOAD_PRESET = 'cosodulieuhungtbs';

  // Trạng thái hồ sơ học sinh
  const [studentProfile] = useState({
    name: 'Nguyễn Văn An',
    class: '12A1',
    exp: 340,
    rank: 'Thợ săn Tích phân',
    avatar: '👨‍🎓'
  });

  // Trạng thái danh sách nhiệm vụ học tập
  const [missions, setMissions] = useState([
    { id: 'm1', title: 'Thử thách tự luận: Phương trình mặt phẳng ', math: 'Oxyz', points: '+40 EXP', status: 'pending', type: 'required' },
    { id: 'm2', title: 'Ôn tập chương: Tính nguyên hàm bằng phương pháp từng phần ', math: '\\int u dv', points: '+50 EXP', status: 'completed', type: 'required' },
    { id: 'm3', title: 'Mũi nhọn Olympic: Bất đẳng thức tích phân nâng cao ', math: '\\text{Olympic}', points: '+100 EXP', status: 'pending', type: 'olympic' },
  ]);

  // Trạng thái xử lý tải ảnh tự luận lên Cloudinary
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // Trạng thái Bảng Xếp Hạng
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'hocsinh_profile'), orderBy('exp', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        if (list.length === 0) {
          setLeaderboard([
            { name: 'Trần Minh Đức', class: '12A1', exp: 520, rank: 'Bậc thầy Oxyz' },
            { name: 'Nguyễn Văn An', class: '12A1', exp: 340, rank: 'Thợ săn Tích phân' },
            { name: 'Lê Thị Hồng', class: '12A2', exp: 290, rank: 'Thợ săn Tích phân' },
          ]);
        } else {
          setLeaderboard(list);
        }
      } catch (error) {
        console.error("Lỗi tải bảng xếp hạng:", error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Xử lý tạo ảnh xem trước khi học sinh chọn file ảnh chụp bài làm
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setUploadedUrl('');
    }
  };

  // LUỒNG ĐẨY ẢNH TRỰC TIẾP LÊN CLOUDINARY QUA API KHÔNG CẦN CHỮ KÝ (UNSIGNED UPLOAD)
  const handleUploadAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem('file_assignment') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      alert("Vui lòng chọn bức ảnh chụp bài nháp/bài làm tự luận trước khi bấm nộp bài!");
      return;
    }

    setUploading(true);
    
    // Đóng gói dữ liệu Form đẩy lên Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/outo/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.secure_url) {
        const secureLink = data.secure_url;
        setUploadedUrl(secureLink);

        // Lưu bản ghi nộp bài hoàn chỉnh của học sinh vào Firestore
        await addDoc(collection(db, 'bainop_hocsinh'), {
          studentName: studentProfile.name,
          studentClass: studentProfile.class,
          missionId: selectedMission.id,
          missionTitle: selectedMission.title,
          imageUrl: secureLink, // Đường dẫn ảnh Cloudinary lưu trữ vĩnh viễn
          createdAt: serverTimestamp()
        });

        // Cập nhật trạng thái hiển thị nhiệm vụ trên giao diện học sinh
        setMissions(prev => prev.map(m => m.id === selectedMission.id ? { ...m, status: 'completed' } : m));
        alert("Nộp bài tự luận thành công! Bài làm đã được đồng bộ lên hệ thống dữ liệu Toán_TBS.");
        setSelectedMission(null);
        setPreviewUrl('');
      } else {
        throw new Error("Không nhận được liên kết an toàn từ Cloudinary.");
      }
    } catch (error) {
      console.error("Lỗi nộp bài lên Cloudinary:", error);
      alert("Quá trình kết nối Cloudinary gặp sự cố. Thầy vui lòng kiểm tra lại cấu hình Cổng Upload Preset!");
    } finally {
      setUploading(false);
    }
  };

  const nextRankExp = 500;
  const progressPercentage = Math.min((studentProfile.exp / nextRankExp) * 100, 100);

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        
        {/* HỒ SƠ HỌC VIÊN */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-200/40 rounded-full blur-3xl -z-10"></div>
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="text-5xl bg-white w-20 h-20 flex items-center justify-center rounded-2xl shadow-md border border-sky-100">{studentProfile.avatar}</div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">{studentProfile.name}</h2>
              <p className="text-sm font-bold text-[#0284C7] bg-sky-100/60 px-3 py-1 rounded-lg border border-sky-200 mt-1 inline-block">Lớp: {studentProfile.class} — Hệ Thống Toán_TBS</p>
            </div>
          </div>
          <div className="w-full md:w-96 bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-inner">
            <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-600">
              <span>Danh hiệu: <span className="text-emerald-600 font-extrabold">{studentProfile.rank}</span></span>
              <span>{studentProfile.exp} / {nextRankExp} EXP</span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300/30">
              <div className="bg-gradient-to-r from-[#0284C7] to-[#38BDF8] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* LƯỚI HAI CỘT CHỨA NHIỆM VỤ VÀ BẢNG VÀNG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: NHIỆM VỤ VÀ FORM UPLOAD CLOUDINARY */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-xl font-black text-[#0284C7] px-2 flex items-center gap-2"><span>🎯</span> Nhiệm Vụ Học Tập Thử Thách</h3>

            {/* FORM NỘP BÀI TỰ LUẬN QUA CLOUDINARY (Khi chọn 1 nhiệm vụ) */}
            {selectedMission && (
              <div className="bg-white/90 backdrop-blur-2xl border-2 border-sky-200 p-6 rounded-3xl shadow-2xl animate-fadeIn space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base">📸 Nộp bài: {selectedMission.title}</h4>
                  <button onClick={() => { setSelectedMission(null); setPreviewUrl(''); }} className="text-xs font-bold text-slate-400 hover:text-slate-600">Hủy bỏ ×</button>
                </div>

                <form onSubmit={handleUploadAssignment} className="space-y-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-sky-200 bg-sky-50/40 p-6 rounded-2xl relative cursor-pointer group hover:bg-sky-50 transition-colors">
                    <input 
                      type="file" 
                      name="file_assignment" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    <span className="text-3xl mb-2">📷</span>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-[#0284C7] transition-colors">Nhấp vào đây để chọn hoặc chụp ảnh bài làm</span>
                  </div>

                  {/* Hiển thị khung xem trước của bức ảnh trước khi đẩy lên mây */}
                  {previewUrl && (
                    <div className="mt-4 border rounded-xl overflow-hidden shadow-inner max-h-48 flex justify-center bg-black/5">
                      <img src={previewUrl} alt="Preview assignment" className="object-contain h-full" />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-[0_0px_0_0_#059669] transition-all text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {uploading ? '📡 Đang truyền tải dữ liệu hình ảnh lên Cloudinary...' : 'Đồng bộ bài làm lên Đám Mây 🚀'}
                  </button>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {missions.map((mission) => (
                <div key={mission.id} className={`bg-white/60 backdrop-blur-md border p-5 rounded-2xl shadow-md flex justify-between items-center gap-4 transition-all ${mission.status === 'completed' ? 'border-emerald-200/60 opacity-80' : 'border-white/80'}`}>
                  <div className="flex-grow space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${mission.type === 'olympic' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-sky-100 text-[#0284C7]'}`}>{mission.type === 'olympic' ? '🎯 ĐỘI TUYỂN OLYMPIC' : '📝 TỰ LUẬN'}</span>
                      <span className="text-xs font-bold text-slate-400">Thưởng: {mission.points}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-700 text-sm md:text-base truncate">
                      {mission.title}
                      <span className="bg-white/90 px-2 py-0.5 rounded border border-slate-200 ml-1 text-xs text-slate-800 inline-block font-mono"><InlineMath math={mission.math} /></span>
                    </h4>
                  </div>
                  <div className="shrink-0">
                    {mission.status === 'completed' ? (
                      <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-4 py-2 rounded-xl border border-emerald-200 block shadow-sm">✓ Đã chấm</span>
                    ) : (
                      <button onClick={() => setSelectedMission(mission)} className="bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-[0_3px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all uppercase tracking-wider">Nộp bài tự luận 📤</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: BẢNG VÀNG BẢNG NHÃN */}
          <div className="lg:col-span-5 bg-white/60 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-6 flex flex-col h-[480px]">
            <h3 className="text-xl font-black text-amber-600 mb-6 flex items-center gap-2"><span>🏆</span> Bảng Vàng Bảng Nhãn TBS</h3>
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {loadingLeaderboard ? (
                <div className="text-center text-sm font-bold text-slate-400 animate-pulse mt-10">Đang cập nhật...</div>
              ) : (
                leaderboard.map((user, index) => (
                  <div key={index} className={`p-4 rounded-2xl border flex justify-between items-center ${index === 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50/40 border-amber-200' : 'bg-white/80 border-slate-100'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full font-black text-xs ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
                      <div className="truncate">
                        <h4 className="font-extrabold text-slate-700 text-sm truncate">{user.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Lớp {user.class} — {user.rank}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#0284C7] bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg font-mono">{user.exp} EXP</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}