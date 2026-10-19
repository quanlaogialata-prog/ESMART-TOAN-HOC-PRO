import { QuestionItem } from './test';
import { ExamSection } from '../utils/variantGenerator';

export interface TopicPractice {
  id: string;
  title: string;           // Tiêu đề bắt buộc có dạng "Bài ôn luyện chuyên đề: [Tên bài]"
  lessonTitle: string;     // Tên bài học gốc (ví dụ: "Đa thức nhiều biến và Hằng đẳng thức")
  topicId: string;         // ID chuyên đề
  topicName: string;       // Tên chuyên đề (ví dụ: "Chương 1: Đa thức nhiều biến")
  grade: number;           // Khối lớp 6 - 12
  schoolYear: string;      // Năm học (ví dụ: "2025 - 2026")
  schoolName: string;      // Tên đơn vị (Mặc định: "TRUNG TÂM ESMART")
  durationMinutes: number; // Thời gian làm bài / thời lượng ôn luyện (phút)
  subject: string;         // Môn học (mặc định: "Toán học")
  theorySummary?: string;  // Tóm tắt kiến thức trọng tâm & phương pháp giải
  examStructure?: 'standard_3parts' | 'mixed' | 'mcq_only' | 'essay_only';
  questions: QuestionItem[];
  rawPastedText?: string;  // Nội dung văn bản gốc đã copy & paste
  answerKeyNotes?: string; // Ghi chú đáp án & hướng dẫn giải tổng hợp
  createdAt: string;
  createdBy: string;
  authorEmail?: string;
  note?: string;
}
