const pptxgen = require('pptxgenjs');

let pptx = new pptxgen();

// Layout and formatting
pptx.layout = 'LAYOUT_16x9';

// -----------------------------------------
// Slide 1: Tiêu đề
// -----------------------------------------
let slide1 = pptx.addSlide();
slide1.background = { color: '0284c7' }; // Tailwind sky-600
slide1.addText('CỔNG CÔNG NGHỆ THÔNG TIN - TỔ TOÁN TBS', { 
  x: 0.5, y: 1.5, w: 9, h: 1, 
  color: 'ffffff', fontSize: 32, bold: true, align: 'center' 
});
slide1.addText('Hệ sinh thái học tập & khảo thí tương tác trực quan (Phiên bản 1.0)', { 
  x: 0.5, y: 2.5, w: 9, h: 1, 
  color: 'e0f2fe', fontSize: 20, align: 'center' 
});
slide1.addText('Tác giả: Thầy Hùng TBS', { 
  x: 0.5, y: 4.5, w: 9, h: 0.5, 
  color: 'ffffff', fontSize: 16, align: 'center' 
});

// -----------------------------------------
// Slide 2: Vấn đề & Tầm nhìn
// -----------------------------------------
let slide2 = pptx.addSlide();
slide2.addText('Vấn đề & Tầm nhìn', { x: 0.5, y: 0.5, w: 9, h: 1, color: '0f172a', fontSize: 28, bold: true });
slide2.addText([
  { text: 'Thực trạng:\n', options: { bold: true, color: 'b91c1c' } },
  { text: '• Học sinh thiếu động lực tự học, học toán còn khô khan.\n' },
  { text: '• Giáo viên tốn nhiều thời gian soạn giáo án, ma trận đề, chấm bài.\n\n' },
  { text: 'Tầm nhìn hệ thống:\n', options: { bold: true, color: '0369a1' } },
  { text: '• Ứng dụng công nghệ lõi (AI, Gamification) để thay đổi cách dạy và học.\n' },
  { text: '• Mang lại trải nghiệm học tập "Wow", mượt mà, hấp dẫn như một trò chơi.' }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 18, color: '334155' });

// -----------------------------------------
// Slide 3: Tổng quan Kiến trúc
// -----------------------------------------
let slide3 = pptx.addSlide();
slide3.addText('Tổng quan Kiến trúc Hệ thống', { x: 0.5, y: 0.5, w: 9, h: 1, color: '0f172a', fontSize: 28, bold: true });
slide3.addText('Hệ thống được chia làm 2 phân hệ độc lập nhưng đồng bộ dữ liệu:', { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 18, color: '334155' });

slide3.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.2, w: 4.2, h: 2, fill: 'f0f9ff', line: '0284c7' });
slide3.addText('👨‍🎓 Cổng Học sinh (Student Portal)\n\nKhu vực luyện tập, thi đấu và theo dõi tiến độ.', { x: 0.6, y: 2.3, w: 4.0, h: 1.8, fontSize: 16, color: '0f172a' });

slide3.addShape(pptx.ShapeType.rect, { x: 5.3, y: 2.2, w: 4.2, h: 2, fill: 'f8fafc', line: '475569' });
slide3.addText('👩‍🏫 Cổng Giáo viên (Teacher Dashboard)\n\nQuản lý chuyên môn, lớp học, và sinh tài nguyên tự động.', { x: 5.4, y: 2.3, w: 4.0, h: 1.8, fontSize: 16, color: '0f172a' });

// -----------------------------------------
// Slide 4: Học sinh & Gamification
// -----------------------------------------
let slide4 = pptx.addSlide();
slide4.addText('Điểm nhấn 1: Phân hệ Học sinh & Gamification', { x: 0.5, y: 0.5, w: 9, h: 1, color: '0f172a', fontSize: 26, bold: true });
slide4.addText([
  { text: '• Học bạ số (Digital Report Card):', options: { bold: true } },
  { text: ' Theo dõi năng lực toán học qua từng giai đoạn.\n\n' },
  { text: '• Đấu trường & Nhiệm vụ tuần:', options: { bold: true } },
  { text: ' Làm bài tập để tích lũy "Điểm liên đấu" (Arena Points), thăng hạng.\n\n' },
  { text: '• Luyện thi Olympic 30/4:', options: { bold: true } },
  { text: ' Kho tài nguyên Vận dụng cao (VDC) phân loại theo chuyên đề sâu.\n\n' },
  { text: '• Đa dạng hình thức:', options: { bold: true } },
  { text: ' CLB Vui học toán, Phòng thi kiểm tra 15-45 phút lấy điểm thật.' }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 18, color: '334155' });

// -----------------------------------------
// Slide 5: Trợ lý Kế hoạch 2026
// -----------------------------------------
let slide5 = pptx.addSlide();
slide5.addText('Điểm nhấn 2: Trợ lý Kế hoạch 2026 (Plan Assistant)', { x: 0.5, y: 0.5, w: 9, h: 1, color: '0f172a', fontSize: 26, bold: true });
slide5.addText([
  { text: 'Công cụ Đột phá: ', options: { bold: true, color: '0369a1' } },
  { text: 'AI Plan Assistant 2026\n\n' },
  { text: 'Tính năng cốt lõi:\n', options: { bold: true } },
  { text: '• Tự động sinh Khung KHTH (Phụ lục 1), Kế hoạch Bài dạy (Phụ lục 2), Ma trận đề KT (Phụ lục 3).\n\n' },
  { text: '• Trích xuất PDF sang LaTeX bằng công nghệ Vision (AI).\n\n' },
  { text: '• Chỉnh sửa Prompt thông minh trực tiếp trên hệ thống.' }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 18, color: '334155' });

// -----------------------------------------
// Slide 6: Nền tảng Công nghệ
// -----------------------------------------
let slide6 = pptx.addSlide();
slide6.addText('Nền tảng Công nghệ Tiên phong', { x: 0.5, y: 0.5, w: 9, h: 1, color: '0f172a', fontSize: 28, bold: true });
slide6.addText([
  { text: '• Frontend Core:', options: { bold: true } },
  { text: ' React 19 & Next.js 15 (Tốc độ load trang cực nhanh, tối ưu SEO/SSR).\n\n' },
  { text: '• Giao diện (UI/UX):', options: { bold: true } },
  { text: ' Tailwind CSS, Hỗ trợ Dark Mode/Light Mode.\n\n' },
  { text: '• Toán học trực quan:', options: { bold: true } },
  { text: ' Tích hợp KaTeX để render công thức siêu mượt.\n\n' },
  { text: '• Quốc tế hóa:', options: { bold: true } },
  { text: ' Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh.' }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 18, color: '334155' });

// -----------------------------------------
// Slide 7: Kết luận
// -----------------------------------------
let slide7 = pptx.addSlide();
slide7.addText('Kết luận & Kế hoạch triển khai', { x: 0.5, y: 0.5, w: 9, h: 1, color: '0f172a', fontSize: 28, bold: true });
slide7.addText([
  { text: 'Lợi ích mang lại:\n', options: { bold: true, color: '15803d' } },
  { text: '• Tối ưu hóa thời gian cho Giáo viên.\n' },
  { text: '• Cực đại hóa trải nghiệm học tập cho Học sinh.\n\n' },
  { text: 'Bước tiếp theo:\n', options: { bold: true, color: '0369a1' } },
  { text: '• Triển khai thí điểm (Beta test) ở một số lớp.\n' },
  { text: '• Thu thập phản hồi từ giáo viên Tổ Toán.\n' },
  { text: '• Cập nhật thêm ngân hàng đề thi & Game tương tác.' }
], { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 18, color: '334155' });

// Lời chào kết thúc
let slide8 = pptx.addSlide();
slide8.background = { color: '0284c7' };
slide8.addText('XIN CẢM ƠN QUÝ THẦY CÔ ĐÃ LẮNG NGHE!', { 
  x: 0.5, y: 2.5, w: 9, h: 1, 
  color: 'ffffff', fontSize: 28, bold: true, align: 'center' 
});


// Save presentation
pptx.writeFile({ fileName: 'Bai_Thuyet_Trinh_Toan_TBS.pptx' }).then(fileName => {
  console.log(`Successfully created presentation: ${fileName}`);
}).catch(err => {
  console.error("Error creating PPTX:", err);
});
