'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function OlympicTrainingCenter() {
  const router = useRouter();
  const { showToast } = useToast();

  // --- TRẠNG THÁI CHUYỂN PHÂN KHU ---
  const [activeTab, setActiveTab] = useState<'explorer' | 'ai-forge' | 'workspace'>('explorer');

  // --- KHO DỮ LIỆU OLYMPIC & BỘ LỌC CHUYÊN SÂU ---
  const [olympicPool, setOlympicPool] = useState<any[]>([]);
  const [filteredPool, setFilteredPool] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrand, setFilterStrand] = useState('ALL'); 

  // --- CHỈNH SỬA & CẬP NHẬT HÌNH VẼ HÌNH HỌC/ĐỒ THỊ ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editSolution, setEditSolution] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // --- STATE KHU VỰC TRỢ LÝ AI (AI FORGE) ---
  const [strand, setStrand] = useState<'Đại số' | 'Hình học' | 'Số học' | 'Tổ hợp'>('Đại số');
  const [subTopic, setSubTopic] = useState('');
  const [referenceSource, setReferenceSource] = useState(''); // Đã fix lỗi thiếu biến này
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [generatedMaterials, setGeneratedMaterials] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tải kho tài nguyên Olympic từ Firebase
  const loadOlympicPool = async () => {
    setIsFetching(true);
    try {
      const q = query(collection(db, 'olympic_nganhang'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOlympicPool(data);
      setFilteredPool(data);
    } catch (error) {
      showToast('error', 'Không thể kết nối kho dữ liệu Olympic.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadOlympicPool();
  }, []);

  // Bộ lọc tối ưu hóa phân tầng tìm kiếm chuyên sâu (Đã fix lỗi type 'any' và lỗi chính tả)
  useEffect(() => {
    let result = olympicPool;

    if (filterStrand !== 'ALL') {
      result = result.filter((q: any) => q.strand === filterStrand);
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter((q: any) => 
        (q.question && q.question.toLowerCase().includes(term)) ||
        (q.subTopic && q.subTopic.toLowerCase().includes(term)) ||
        (q.customId && q.customId.toLowerCase().includes(term))
      );
    }
    setFilteredPool(result);
  }, [searchTerm, filterStrand, olympicPool]);

  // Thống kê tài nguyên chuyên sâu
  const getStats = () => {
    return {
      total: olympicPool.length,
      daiso: olympicPool.filter((q: any) => q.strand === 'Đại số').length,
      hinhhoc: olympicPool.filter((q: any) => q.strand === 'Hình học').length,
      sohoc: olympicPool.filter((q: any) => q.strand === 'Số học').length,
      tohop: olympicPool.filter((q: any) => q.strand === 'Tổ hợp').length,
    };
  };
  const stats = getStats();

  // Kích hoạt sinh Prompt cho trợ lý AI chuyên bồi dưỡng học sinh giỏi
  const handleBuildOlympicPrompt = () => {
    if (!subTopic.trim()) {
      showToast('warning', 'Thầy vui lòng nhập chuyên đề nhỏ cần khai thác nhé!');
      return;
    }

    const promptText = `Bạn là một chuyên gia bồi dưỡng đội tuyển học sinh giỏi môn Toán cấp THPT, chuyên luyện thi Olympic 30/4 truyền thống Khu vực phía Nam.
Hãy sinh ra 1 câu hỏi cấp độ Vận dụng cao (VDC) thuộc mạch kiến thức "${strand}", chủ đề chi tiết: "${subTopic}".

YÊU CẦU ĐẶC THÙ OLYMPIC:
1. Câu hỏi phải có tính thách thức cao, đòi hỏi tư duy logic mạnh mẽ hoặc kỹ thuật biến đổi chuyên sâu (ví dụ: bất đẳng thức, phương trình hàm, hình học phẳng định lý nâng cao, thặng dư trung hoa, nguyên lý ngăn kéo Dirichlet...).
2. Câu hỏi phải đi kèm Hướng dẫn giải cực kỳ chi tiết từng bước (thể hiện rõ tư duy phân tích toán học).
3. Định dạng công thức chuẩn LaTeX, bọc trong dấu \\\\int hoặc các ký hiệu toán học lớn. 
4. Trả về duy nhất một mảng JSON (Array of Objects) gồm 1 phần tử theo đúng cấu trúc mẫu, không kèm văn bản giải thích ngoài.

NGUỒN THAM CHIẾU (NẾU CÓ):
${referenceSource.trim() ? referenceSource : 'Không có. Hãy tự phát triển dựa trên kiến thức Olympic.'}

CẤU TRÚC MẪU:
[
  {
    "strand": "${strand}",
    "subTopic": "${subTopic}",
    "question": "Mã câu hỏi toán học chứa LaTeX nâng cao",
    "solution": "Lời giải chi tiết từng bước phân tích và biến đổi có chứa mã LaTeX",
    "imageUrl": ""
  }
]`;
    setGeneratedPrompt(promptText);
    showToast('success', 'Đã khởi tạo cấu trúc Prompt chuyên sâu Olympic!');
  };

  // Hàm copy lệnh cho Tab 3 (Đã fix lỗi thiếu hàm này)
  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    showToast('info', 'Đã sao chép Prompt vào khay nhớ tạm!');
  };

  const handleParseJSON = () => {
    try {
      const cleaned = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setGeneratedMaterials(Array.isArray(parsed) ? parsed : [parsed]);
      showToast('success', 'Biên dịch cấu trúc câu hỏi Olympic thành công!');
    } catch (e) {
      showToast('error', 'Cú pháp JSON chưa chuẩn xác.');
    }
  };

  // NẠP ĐỒNG LOẠT VÀO KHO ĐỘI TUYỂN MÃ HÓA ID KHOA HỌC
  const handleSaveAllToPool = async () => {
    if (generatedMaterials.length === 0) return;
    try {
      for (const item of generatedMaterials) {
        // Thuật toán gán mã chuyên sâu Olympic 30/4
        const strandCode = item.strand === 'Đại số' ? 'ALG' : item.strand === 'Hình học' ? 'GEO' : item.strand === 'Số học' ? 'NTH' : 'CMB';
        const randomHex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
        const customId = `TBS-OLY-${strandCode}-${randomHex}`;

        await addDoc(collection(db, 'olympic_nganhang'), {
          ...item,
          customId,
          createdAt: serverTimestamp()
        });
      }
      showToast('success', `Đã nạp thành công ${generatedMaterials.length} chuyên đề vào kho đội tuyển!`);
      setGeneratedMaterials([]);
      setJsonInput('');
      loadOlympicPool();
    } catch (error) {
      showToast('error', 'Đồng bộ dữ liệu kho thất bại.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Xóa tài liệu này khỏi kho huấn luyện Olympic?")) return;
    try {
      await deleteDoc(doc(db, 'olympic_nganhang', id));
      showToast('success', 'Đã gỡ bỏ tài liệu.');
      setOlympicPool(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      showToast('error', 'Thất bại.');
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditText(item.question || '');
    setEditSolution(item.solution || '');
    setEditImageUrl(item.imageUrl || '');
  };

  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'olympic_nganhang', id), {
        question: editText,
        solution: editSolution,
        imageUrl: editImageUrl
      });
      showToast('success', 'Đã cập nhật phôi tài liệu nâng cao!');
      setOlympicPool(prev => prev.map(item => item.id === id ? { ...item, question: editText, solution: editSolution, imageUrl: editImageUrl } : item));
      setEditingId(null);
    } catch (error) {
      showToast('error', 'Lưu chỉnh sửa thất bại.');
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-700 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* --- BRANDING HEADER BANNER --- */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                TRƯỜNG TH, THCS VÀ THPT THANH BÌNH
              </span>
              <h1 className="text-2xl font-black uppercase tracking-wide mt-2">
                Trung Tâm Huấn Luyện & Bồi Dưỡng Olympic 30/4
              </h1>
              <p className="text-xs font-bold text-orange-100 uppercase tracking-widest mt-1">
                Chiến lược đào tạo mũi nhọn & phát triển tư duy Vận dụng cao - Lộ trình 2026-2027
              </p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-white text-orange-600 font-black rounded-xl hover:bg-orange-50 text-xs uppercase shadow-md transition-all">
              ⬅ Về Dashboard
            </button>
          </div>

          {/* --- PHÂN TÍCH QUY MÔ KHO OLYMPIC --- */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between border-l-4 border-l-orange-500">
              <span className="text-xs font-bold text-slate-400 uppercase">Tổng Quy Mô Đội Tuyển</span>
              <span className="text-2xl font-black text-orange-600 mt-2">{stats.total} <span className="text-xs font-normal text-slate-400">chuyên đề</span></span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">📈 Mạch Đại Số</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.daiso}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">📐 Mạch Hình Học</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.hinhhoc}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">🔢 Mạch Số Học</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.sohoc}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">🧩 Mạch Tổ Hợp</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.tohop}</span>
            </div>
          </div>

          {/* --- NAVEGATION CONTROL CHUYỂN PHÂN KHU --- */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('explorer')} className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'explorer' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              🗂️ 1. Kho Luyện Tập Học Sinh ({filteredPool.length})
            </button>
            <button onClick={() => setActiveTab('workspace')} className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all relative ${activeTab === 'workspace' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              🛠️ 2. Biên Tập Lời Giải & Quản Lý Đồ Thị
            </button>
            <button onClick={() => setActiveTab('ai-forge')} className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'ai-forge' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              🤖 3. Sinh Đề Chuyên Sâu Bằng AI VDC
            </button>
          </div>

          {/* ================= PHÂN KHU 1: KHO LUYỆN TẬP HỌC SINH (EXPLORER) ============= */}
          {activeTab === 'explorer' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Nhập mã số hoặc từ khóa chuyên đề nâng cao..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-400 shadow-inner" />
                </div>
                <div>
                  <select value={filterStrand} onChange={(e) => setFilterStrand(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                    <option value="ALL">TẤT CẢ CÁC MẠCH KIẾN THỨC</option>
                    <option value="Đại số">Đại số (Bất đẳng thức, Hàm số, Dãy số)</option>
                    <option value="Hình học">Hình học (Hình học phẳng Định lý lớn)</option>
                    <option value="Số học">Số học (Đồng dư, Số chính phương, Chia hết)</option>
                    <option value="Tổ hợp">Tổ hợp (Nguyên lý Dirichlet, Graph, Rời rạc)</option>
                  </select>
                </div>
                <div className="text-right flex items-center justify-end text-xs font-bold text-slate-400">
                  Đang hiển thị {filteredPool.length} chuyên đề ôn luyện mũi nhọn.
                </div>
              </div>

              {isFetching ? (
                <div className="bg-white p-12 text-center rounded-2xl shadow-md text-slate-400 font-bold animate-pulse">Đang kết nối thư viện đề thi Olympic...</div>
              ) : (
                <div className="space-y-4">
                  {filteredPool.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow space-y-4 relative overflow-hidden">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg">{item.customId || 'TBS-OLY-NEW'}</span>
                          <span className="text-xs font-bold text-slate-500">Mạch: <strong className="text-slate-800">{item.strand}</strong></span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Chủ đề: {item.subTopic}</span>
                      </div>

                      {/* KHUNG HIỂN THỊ CÂU HỎI LAATEX */}
                      <div className="py-4 text-center font-medium bg-slate-50 rounded-2xl overflow-x-auto border text-slate-800">
                        <BlockMath math={item.question || ''} />
                      </div>

                      {/* HÌNH VẼ ĐỒ THỊ MINH HỌA NẾU CÓ */}
                      {item.imageUrl && (
                        <div className="flex justify-center border border-dashed p-3 rounded-2xl bg-white max-w-md mx-auto">
                          <img src={item.imageUrl} alt="Hình vẽ hình học chuyên sâu" className="object-contain max-h-48" />
                        </div>
                      )}

                      {/* HỘP LỜI GIẢI CHI TIẾT TỪNG BƯỚC CHO ĐỘI TUYỂN TỰ HỌC */}
                      <div className="bg-orange-50/40 border border-orange-100 p-5 rounded-2xl space-y-2">
                        <p className="text-xs font-black text-orange-700 uppercase tracking-wider flex items-center gap-1">✨ Hướng dẫn phân tích & Lời giải chi tiết:</p>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-normal text-slate-700 pl-2 border-l-2 border-l-orange-200">
                          {item.solution}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredPool.length === 0 && (
                    <div className="bg-white p-12 text-center rounded-2xl text-slate-400 font-bold">Chưa có chuyên đề nào được nạp cho bộ lọc này.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= PHÂN KHU 2: BIÊN TẬP LỜI GIẢI & QUẢN LÝ ĐỒ THỊ (WORKSPACE) ============= */}
          {activeTab === 'workspace' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-200 animate-fadeIn min-h-[500px] space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-800">Không Gian Hiệu Đính Phôi Đề Olympic</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Giúp cập nhật mã toán hoặc nhúng đường dẫn đồ thị hình học phẳng phức tạp từ Cloudinary.</p>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {olympicPool.map((item) => (
                  <div key={item.id} className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-indigo-600 bg-white border px-2 py-0.5 rounded">{item.customId} | {item.subTopic}</span>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(item)} className="text-xs font-bold text-blue-600 hover:underline">✏️ Hiệu đính</button>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-xs font-bold text-rose-500 hover:underline">🗑️ Gỡ bỏ</button>
                      </div>
                    </div>

                    {editingId === item.id ? (
                      <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-3 shadow-inner">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mã toán câu hỏi (LaTeX):</label>
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-mono focus:outline-none" rows={2} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tiến trình lời giải chi tiết:</label>
                          <textarea value={editSolution} onChange={(e) => setEditSolution(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-normal focus:outline-none" rows={4} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Đường dẫn hình vẽ (Upload preset TAILIEUTBS):</label>
                          <input type="text" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="Dán link ảnh đồ thị hình học vào đây..." className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold focus:outline-none" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => saveEdit(item.id)} className="px-3 py-1 bg-emerald-600 text-white font-black text-[10px] rounded uppercase">Cập nhật hệ thống</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-slate-200 text-slate-600 font-black text-[10px] rounded uppercase">Hủy bỏ</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs pl-2 text-slate-500">
                        <p>• Câu hỏi: <span className="font-mono text-[11px] bg-white border p-1 rounded inline-block max-w-full truncate">{item.question}</span></p>
                        {item.imageUrl && <p className="text-emerald-600 font-bold mt-1">✓ Đã nhúng 1 ảnh đồ thị minh họa.</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PHÂN KHU 3: SINH ĐỀ CHUYÊN SÂU BẰNG AI VDC (AI FORGE) ============= */}
          {activeTab === 'ai-forge' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              {/* VÙNG THIẾT LẬP LỆNH */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 space-y-4">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider border-b border-emerald-100 pb-3">Cấu hình tham số Đội tuyển</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Mạch kiến thức:</label>
                      <select value={strand} onChange={(e) => setStrand(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                        <option>Đại số</option><option>Hình học</option><option>Số học</option><option>Tổ hợp</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Chuyên đề chi tiết:</label>
                      <input type="text" value={subTopic} onChange={(e) => setSubTopic(e.target.value)} placeholder="VD: Bất đẳng thức Cauchy-Schwarz..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1.5">📚 Dữ liệu / Tài liệu nguồn đối chiếu:</label>
                    <textarea value={referenceSource} onChange={(e) => setReferenceSource(e.target.value)} placeholder="Dán các định lý nâng cao hoặc bài tập mẫu từ kỷ yếu Olympic 30/4 cũ để ép AI kế thừa tư duy..." className="w-full h-24 p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs font-medium focus:outline-none resize-none" />
                  </div>
                  <button onClick={handleBuildOlympicPrompt} className="w-full py-3 bg-emerald-100 text-emerald-700 font-extrabold rounded-xl hover:bg-emerald-200 text-xs uppercase tracking-wider shadow-sm">⚡ Tạo Lệnh Khai Thác Mũi Nhọn</button>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-sky-100 pb-2">
                    <h3 className="text-xs font-black text-sky-700 uppercase tracking-wider">Copy Prompt Gửi Trợ Lý AI</h3>
                    <button onClick={handleCopyPrompt} disabled={!generatedPrompt} className="px-4 py-1 bg-gradient-to-r from-sky-400 to-blue-500 text-white text-[10px] font-black uppercase rounded-lg shadow-sm">📋 Copy Prompt</button>
                  </div>
                  <textarea readOnly value={generatedPrompt} className="w-full h-32 p-4 bg-slate-800 text-emerald-400 font-mono text-[11px] rounded-xl focus:outline-none shadow-inner resize-none" />
                </div>
              </div>

              {/* VÙNG ĐÓN DỮ LIỆU JSON */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 space-y-4">
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider border-b border-amber-100 pb-3">Dán dữ liệu cấu trúc Olympic AI kết xuất</h3>
                  <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='Dán mảng JSON câu hỏi Olympic vào đây...' className="w-full h-32 p-4 bg-amber-50 border border-amber-100 font-mono text-[11px] rounded-xl focus:outline-none resize-none" />
                  <button onClick={handleParseJSON} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-xl text-xs uppercase shadow-md">🧩 Phân Tích Khối Dữ Liệu</button>
                </div>

                {generatedMaterials.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-2xl space-y-4 border-2 border-emerald-400">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                      <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider">Duyệt nhanh tài liệu chờ nạp</h3>
                      <button onClick={handleSaveAllToPool} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors">💾 NẠP ĐỒNG LOẠT VÀO KHO OLYMPIC</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                      {generatedMaterials.map((item, index) => (
                        <div key={index} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                          <p><strong className="text-indigo-600">[{item.strand}]</strong> — {item.subTopic}</p>
                          <div className="p-2 bg-white border font-mono rounded overflow-x-auto truncate">{item.question}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </AuthGuard>
  );
}