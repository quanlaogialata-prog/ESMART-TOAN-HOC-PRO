export type QuestionType = 'mcq' | 'tf' | 'short' | 'essay';

export interface QuestionReference {
  topic?: string;               // Chủ đề kiến thức (ví dụ: Hình học không gian, Đạo hàm & Khảo sát hàm số)
  curriculumLesson?: string;    // Bài học SGK tham chiếu (ví dụ: Toán 12 - Bài 1: Tính đơn điệu hàm số)
  cognitiveLevel?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao' | string;
  competency?: string;          // Năng lực toán học mục tiêu
  coreKnowledge?: string;       // Công thức / định lý / kiến thức trọng tâm
  variationGuide?: string;      // Hướng dẫn cụ thể để giáo viên sửa đề hoặc thay đổi số liệu tương đương
}

export interface QuestionFigure {
  figureType?: 'none' | 'svg' | 'table' | 'image';
  figureSvg?: string;           // Chuỗi SVG biểu diễn hình học, đồ thị hàm số Oxy, hình vẽ minh họa
  figureTable?: string;         // Chuỗi Markdown hoặc cấu trúc bảng (bảng biến thiên, bảng tần số thống kê)
  figureDescription?: string;   // Chú thích hình vẽ / bảng biểu
  imageUrl?: string;            // URL ảnh (nếu tải lên từ máy tính)
}

export interface QuestionItem extends QuestionFigure {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
  explanation?: string;
  reference?: QuestionReference;
}
