import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { generatePdfFromElements } from '../../utils/offlinePdfExport';
import { 
  FileText, 
  Plus, 
  Upload, 
  Clock, 
  Trash2, 
  Eye, 
  Printer, 
  FileCheck, 
  Shuffle, 
  Sparkles, 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Layers, 
  CheckCircle, 
  ShieldCheck, 
  X,
  FileCode,
  GraduationCap,
  Copy,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import MathText from '../../components/MathText';
import { generateTestVariants, TestVariant, groupQuestionsByExamStructure, detectQuestionType, QuestionType, ExamSection } from '../../utils/variantGenerator';
import { stripOptionPrefix } from '../../utils/gradeEngine';

interface OfflineTest {
  id: string;
  title: string;
  schoolName: string;
  examHeader: string;
  grade: number;
  subject: string;
  durationMinutes: number;
  schoolYear: string;
  examStructure?: 'standard_3parts' | 'mixed' | 'mcq_only' | 'essay_only';
  sourceType: 'online_conversion' | 'uploaded_original';
  sourceOnlineTestId?: string;
  sourceOnlineTestTitle?: string;
  variantMethod?: 'shuffle' | 'isomorphic' | 'keep' | 'none';
  variantCodes: string[];
  variants: TestVariant[];
  createdAt: string;
  createdBy: string;
  note?: string;
}

// Subcomponent: Printable Exam Paper (Format chuẩn Bộ Giáo dục & Đào tạo)
function ExamPaperContent({ test, variant }: { test: OfflineTest; variant: TestVariant }) {
  const questions = variant.questions || [];
  const sections = groupQuestionsByExamStructure(questions, test.examStructure);

  return (
    <div>
      {/* Header */}
      <div className="export-avoid-break flex justify-between items-start border-b-2 border-gray-900 pb-3 mb-3">
        {/* Left Header */}
        <div className="w-[58%] text-center">
          <div className="font-bold uppercase text-[13px] tracking-wide text-gray-900">
            {test.schoolName || 'TRUNG TÂM LUYỆN THI ESMART'}
          </div>
          <div className="font-semibold text-xs mt-0.5 text-gray-800">
            TỔ CHUYÊN MÔN: {test.subject?.toUpperCase() || 'TOÁN HỌC'}
          </div>
          <div className="text-xs italic text-gray-600 mt-0.5">
            (Đề thi gồm có {questions.length} câu hỏi • {sections.length} phần thi)
          </div>
        </div>

        {/* Right Header */}
        <div className="w-[40%] text-center">
          <div className="font-bold uppercase text-[13px] text-gray-900">
            {test.examHeader || 'ĐỀ KIỂM TRA ĐỊNH KỲ'}
          </div>
          <div className="text-xs font-semibold mt-0.5 text-gray-800">
            NĂM HỌC: {test.schoolYear || '2025 - 2026'}
          </div>
          <div className="text-xs mt-0.5 text-gray-800">
            Môn: <strong>{test.subject}</strong> - Khối <strong>{test.grade}</strong>
          </div>
          <div className="text-xs italic mt-0.5 text-gray-700">
            Thời gian: <strong>{test.durationMinutes} phút</strong> (không kể giao đề)
          </div>
          <div className="mt-2 inline-block border-2 border-gray-900 px-3 py-0.5 font-bold text-xs uppercase bg-gray-50 text-gray-900">
            MÃ ĐỀ THI: {variant.code}
          </div>
        </div>
      </div>

      {/* Student Info Box */}
      <div className="export-avoid-break border border-gray-400 p-2.5 mb-4 text-xs bg-gray-50/40">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-[200px]">
            Họ và tên thí sinh: ............................................................................................
          </div>
          <div className="w-28">
            Lớp: ........................
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1 min-w-[200px]">
            Số báo danh: ...................................................................................................
          </div>
          <div className="w-28">
            Phòng thi: ................
          </div>
        </div>
      </div>

      {/* Teacher's Grading & Comments Box */}
      <div className="export-avoid-break grid grid-cols-4 border border-gray-400 mb-5 text-center text-xs">
        <div className="border-r border-gray-400 p-2 bg-gray-50 font-bold">Điểm Trắc nghiệm</div>
        <div className="border-r border-gray-400 p-2 bg-gray-50 font-bold">Điểm Tự luận</div>
        <div className="border-r border-gray-400 p-2 bg-gray-50 font-bold">Tổng Điểm</div>
        <div className="p-2 bg-gray-50 font-bold">Lời phê của Thầy/Cô giáo</div>
        <div className="border-r border-gray-400 h-10"></div>
        <div className="border-r border-gray-400 h-10"></div>
        <div className="border-r border-gray-400 h-10"></div>
        <div className="h-10"></div>
      </div>

      {/* Questions Body grouped by Sections (Chuẩn GDPT 2018 & Đề tổng hợp) */}
      <div className="space-y-6 text-[13px] leading-relaxed">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            {/* Section Header */}
            <div className="export-avoid-break pt-2.5 pb-1.5 border-b-2 border-gray-900">
              <div className="font-bold uppercase text-[12px] sm:text-[13px] tracking-wide text-gray-900">
                {section.partRoman}
              </div>
              <div className="text-[11.5px] italic text-gray-700 mt-0.5">
                ({section.instruction})
              </div>
            </div>

            {/* Questions list in section */}
            <div className="space-y-3.5">
              {section.questions.map(({ item: q, globalIndex, partIndex }) => {
                const opts = Array.isArray(q.options) ? q.options : [];

                return (
                  <div 
                    key={q.id || globalIndex} 
                    className="export-avoid-break break-inside-avoid pb-2.5 border-b border-dotted border-gray-300 last:border-0"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    {/* Question Stem */}
                    <div className="font-semibold text-gray-900 mb-1.5 flex items-start gap-1.5">
                      <span className="font-bold shrink-0">
                        {section.type === 'essay' 
                          ? `Câu ${partIndex} (${q.points || '1,0'} điểm):` 
                          : `Câu ${partIndex}:`}
                      </span>
                      <div className="flex-1">
                        <MathText content={q.question || ''} />
                      </div>
                    </div>

                    {q.imageUrl && (
                      <div className="my-2 max-w-sm">
                        <img src={q.imageUrl} alt={`Hình câu ${partIndex}`} className="max-h-48 rounded border border-gray-200" />
                      </div>
                    )}

                    {/* TYPE 1: Trắc nghiệm nhiều phương án lựa chọn (A, B, C, D) */}
                    {section.type === 'mcq' && opts.length > 0 && (
                      <div className={`grid gap-x-3 gap-y-1.5 mt-1 pl-3 ${
                        opts.every(o => (o || '').length < 30)
                          ? 'grid-cols-2 sm:grid-cols-4'
                          : opts.every(o => (o || '').length < 65)
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : 'grid-cols-1'
                      }`}>
                        {opts.map((opt: string, oIdx: number) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const cleanText = stripOptionPrefix(opt || '');
                          return (
                            <div key={oIdx} className="flex items-start gap-1">
                              <span className="font-bold">{letter}.</span>
                              <div className="flex-1 font-normal">
                                <MathText content={cleanText} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 2: Trắc nghiệm đúng sai (True / False) */}
                    {section.type === 'tf' && opts.length > 0 && (
                      <div className="mt-2 border border-gray-400 text-xs rounded-xs overflow-hidden">
                        <div className="bg-gray-100 flex font-bold border-b border-gray-400 py-1 px-2.5 text-[11px] text-gray-800">
                          <span className="flex-1">Khẳng định / Mệnh đề</span>
                          <span className="w-14 text-center border-l border-gray-400">Đúng</span>
                          <span className="w-14 text-center border-l border-gray-400">Sai</span>
                        </div>
                        {opts.map((opt: string, oIdx: number) => {
                          const letter = ['a', 'b', 'c', 'd', 'e'][oIdx] || `${oIdx + 1}`;
                          const cleanText = stripOptionPrefix(opt || '');
                          return (
                            <div key={oIdx} className="flex items-center border-b border-gray-300 last:border-0 py-1.5 px-2.5 bg-white">
                              <span className="font-bold mr-1.5 text-gray-900">{letter})</span>
                              <div className="flex-1 font-normal text-gray-800">
                                <MathText content={cleanText} />
                              </div>
                              <span className="w-14 flex items-center justify-center border-l border-gray-300 py-0.5">
                                <span className="inline-block w-4 h-4 border border-gray-500 rounded-xs"></span>
                              </span>
                              <span className="w-14 flex items-center justify-center border-l border-gray-300 py-0.5">
                                <span className="inline-block w-4 h-4 border border-gray-500 rounded-xs"></span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 3: Trắc nghiệm trả lời ngắn (Short Answer) */}
                    {section.type === 'short' && (
                      <div className="mt-2.5 flex items-center gap-2 pl-3">
                        <span className="font-bold italic text-xs text-gray-800">Đáp số:</span>
                        <div className="border border-dashed border-gray-500 rounded px-4 py-1 min-w-[160px] text-center text-xs text-gray-400 font-mono">
                          ..............................................
                        </div>
                      </div>
                    )}

                    {/* TYPE 4: Tự luận (Essay) */}
                    {section.type === 'essay' && (
                      <div className="mt-2 pl-3 text-xs italic text-gray-500">
                        (Thí sinh trình bày chi tiết các bước giải vào tờ giấy thi)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="export-avoid-break text-center font-bold text-xs mt-8 pt-4 border-t border-gray-900 uppercase tracking-widest">
        ---------- HẾT ----------
        <div className="text-[11px] font-normal italic lowercase mt-1">
          (Cán bộ coi thi không giải thích gì thêm)
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Answer Matrix Table (Phân nhóm ma trận đáp án theo các phần chuẩn Bộ GD&ĐT)
function AnswerMatrixContent({ test }: { test: OfflineTest }) {
  const baseQuestions = test.variants?.[0]?.questions || [];
  const sections = groupQuestionsByExamStructure(baseQuestions, test.examStructure);

  return (
    <div>
      <div className="export-avoid-break text-center mb-6 border-b pb-4">
        <div className="font-bold text-base uppercase text-gray-900">
          {test.schoolName}
        </div>
        <div className="font-bold text-lg uppercase text-blue-800 mt-1">
          BẢNG ĐÁP ÁN MA TRẬN ĐỐI CHIẾU CÁC MÃ ĐỀ THI
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          Bài kiểm tra: <strong>{test.title}</strong> • Khối {test.grade} • Năm học: {test.schoolYear}
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="export-avoid-break space-y-2.5">
            <div className="font-bold text-xs uppercase tracking-wide text-gray-900 bg-gray-100 p-2 rounded border border-gray-300">
              {sec.partRoman}: {sec.title}
            </div>

            {/* Section I: Multiple Choice Table */}
            {sec.type === 'mcq' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-900 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-center font-bold">
                      <th className="border border-gray-900 p-1.5 w-14">Câu</th>
                      {(test.variants || []).map(v => (
                        <th key={v.code} className="border border-gray-900 p-1.5 font-bold text-blue-900">
                          Mã {v.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.questions.map(({ partIndex, globalIndex }) => (
                      <tr key={partIndex} className={partIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-900 p-1.5 text-center font-bold bg-gray-100">
                          {partIndex}
                        </td>
                        {(test.variants || []).map(v => {
                          const vSec = groupQuestionsByExamStructure(v.questions || [], test.examStructure);
                          const matchedSec = vSec.find(s => s.type === sec.type);
                          const vQ = matchedSec?.questions?.[partIndex - 1]?.item || v.questions?.[globalIndex];
                          const ans = vQ?.correctAnswer || '-';
                          return (
                            <td key={v.code} className="border border-gray-900 p-1.5 text-center font-bold text-blue-700">
                              {ans}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section II: True / False Table */}
            {sec.type === 'tf' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-900 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-center font-bold">
                      <th className="border border-gray-900 p-1.5 w-14">Câu</th>
                      <th className="border border-gray-900 p-1.5 w-10">Ý</th>
                      {(test.variants || []).map(v => (
                        <th key={v.code} className="border border-gray-900 p-1.5 font-bold text-blue-900">
                          Mã {v.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.questions.flatMap(({ partIndex, globalIndex }) => {
                      const letters = ['a', 'b', 'c', 'd'];
                      return letters.map((letter, lIdx) => (
                        <tr key={`${partIndex}-${letter}`} className={partIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {lIdx === 0 && (
                            <td rowSpan={4} className="border border-gray-900 p-1.5 text-center font-bold bg-gray-100 align-middle">
                              {partIndex}
                            </td>
                          )}
                          <td className="border border-gray-900 p-1.5 text-center font-bold text-gray-700">
                            {letter})
                          </td>
                          {(test.variants || []).map(v => {
                            const vSec = groupQuestionsByExamStructure(v.questions || [], test.examStructure);
                            const matchedSec = vSec.find(s => s.type === sec.type);
                            const vQ = matchedSec?.questions?.[partIndex - 1]?.item || v.questions?.[globalIndex];
                            
                            let rawAns = (vQ?.correctAnswer || '').toString();
                            let letterAns = '-';
                            
                            if (rawAns.includes(`${letter}-`) || rawAns.includes(`${letter}:`)) {
                              const match = rawAns.match(new RegExp(`${letter}[\\-\\:\\s]*([Đ|S|T|F])`, 'i'));
                              if (match) letterAns = match[1].toUpperCase();
                            } else {
                              const parts = rawAns.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
                              if (parts[lIdx]) {
                                letterAns = parts[lIdx].replace(/^[a-d][\-\:]/i, '').toUpperCase();
                              }
                            }
                            if (letterAns === 'T') letterAns = 'Đ';
                            if (letterAns === 'F') letterAns = 'S';

                            return (
                              <td key={v.code} className={`border border-gray-900 p-1.5 text-center font-bold ${
                                letterAns === 'Đ' ? 'text-emerald-700' : letterAns === 'S' ? 'text-red-700' : 'text-blue-700'
                              }`}>
                                {letterAns !== '-' ? letterAns : rawAns || '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section III: Short Answer Table */}
            {sec.type === 'short' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-900 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-center font-bold">
                      <th className="border border-gray-900 p-1.5 w-14">Câu</th>
                      {(test.variants || []).map(v => (
                        <th key={v.code} className="border border-gray-900 p-1.5 font-bold text-blue-900">
                          Mã {v.code} (Đáp số)
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.questions.map(({ partIndex, globalIndex }) => (
                      <tr key={partIndex} className={partIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-900 p-1.5 text-center font-bold bg-gray-100">
                          {partIndex}
                        </td>
                        {(test.variants || []).map(v => {
                          const vSec = groupQuestionsByExamStructure(v.questions || [], test.examStructure);
                          const matchedSec = vSec.find(s => s.type === sec.type);
                          const vQ = matchedSec?.questions?.[partIndex - 1]?.item || v.questions?.[globalIndex];
                          const ans = vQ?.correctAnswer || '-';
                          return (
                            <td key={v.code} className="border border-gray-900 p-1.5 text-center font-mono font-bold text-blue-800">
                              {ans}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section IV: Essay Rubric Summary Table */}
            {sec.type === 'essay' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-900 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-center font-bold">
                      <th className="border border-gray-900 p-1.5 w-16">Câu</th>
                      <th className="border border-gray-900 p-1.5 w-20">Điểm</th>
                      <th className="border border-gray-900 p-1.5">Đáp số / Hướng dẫn tóm tắt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.questions.map(({ item: baseQ, partIndex }) => (
                      <tr key={partIndex} className={partIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-900 p-1.5 text-center font-bold bg-gray-100">
                          Câu {partIndex}
                        </td>
                        <td className="border border-gray-900 p-1.5 text-center font-semibold text-purple-800">
                          {baseQ.points || '1,0'} đ
                        </td>
                        <td className="border border-gray-900 p-1.5 text-left text-gray-800">
                          {baseQ.correctAnswer || baseQ.explanation || 'Theo hướng dẫn chấm chi tiết'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="export-avoid-break mt-6 text-xs text-gray-500 italic">
        * Bảng ma trận đối chiếu giúp giáo viên chấm thi trên giấy nhanh chóng cho cả lớp học với nhiều mã đề thi khác nhau.
      </div>
    </div>
  );
}

// Subcomponent: Detailed Solutions (Nhóm lời giải theo các phần thi)
function SolutionsContent({ test, variant }: { test: OfflineTest; variant: TestVariant }) {
  const questions = variant.questions || [];
  const sections = groupQuestionsByExamStructure(questions, test.examStructure);

  return (
    <div>
      <div className="export-avoid-break text-center mb-6 border-b pb-3">
        <div className="font-bold text-base uppercase text-purple-900">
          HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT
        </div>
        <div className="text-xs text-gray-700 mt-1">
          Môn: <strong>{test.subject}</strong> • Khối <strong>{test.grade}</strong> • <strong>MÃ ĐỀ: {variant.code}</strong>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            <div className="export-avoid-break font-bold text-xs uppercase tracking-wide text-purple-950 bg-purple-50 p-2 rounded-lg border border-purple-200">
              {section.partRoman}: {section.title}
            </div>

            <div className="space-y-3">
              {section.questions.map(({ item: q, partIndex }) => (
                <div key={partIndex} className="export-avoid-break p-3 bg-gray-50 border border-gray-200 rounded-xl break-inside-avoid">
                  <div className="font-bold text-gray-900 mb-1 flex items-start gap-1">
                    <span>
                      {section.type === 'essay' ? `Câu ${partIndex} (${q.points || 1.0} điểm):` : `Câu ${partIndex}:`}
                    </span>
                    <div className="flex-1 font-medium">
                      <MathText content={q.question || ''} />
                    </div>
                  </div>

                  <div className="my-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded inline-block border border-emerald-200">
                    Đáp án: {q.correctAnswer || 'Chưa cập nhật'}
                  </div>

                  {q.explanation && (
                    <div className="mt-2 text-gray-700 text-xs pl-2 border-l-2 border-purple-400">
                      <span className="font-bold text-purple-900 block mb-0.5">Lời giải chi tiết:</span>
                      <MathText content={q.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function ManageOfflineTests() {
  const { user, role } = useAuth();
  const [offlineTests, setOfflineTests] = useState<OfflineTest[]>([]);
  const [onlineTests, setOnlineTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sysMsg, setSysMsg] = useState('');
  const [sysError, setSysError] = useState('');

  // Filters
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'online_conversion' | 'uploaded_original'>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTab, setCreateTab] = useState<'from_online' | 'upload_new'>('from_online');

  // Preview & Export Modal
  const [previewTest, setPreviewTest] = useState<OfflineTest | null>(null);
  const [activePreviewVariantCode, setActivePreviewVariantCode] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'exam' | 'matrix' | 'solutions'>('exam');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);
  const [exportState, setExportState] = useState<{
    type: 'single_variant' | 'all_variants' | 'matrix' | 'solutions';
    variantCode?: string;
  } | null>(null);
  const [latestPdfDownload, setLatestPdfDownload] = useState<{ url: string; fileName: string } | null>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  // --- FORM STATE FOR CREATE MODAL ---
  // Common exam header configuration
  const [schoolName, setSchoolName] = useState('TRUNG TÂM LUYỆN THI ESMART');
  const [examHeader, setExamHeader] = useState('ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN');
  const [examSubject, setExamSubject] = useState('Toán học');
  const [examGrade, setExamGrade] = useState<number>(10);
  const [examDuration, setExamDuration] = useState<number>(45);
  const [examSchoolYear, setExamSchoolYear] = useState('2025 - 2026');
  const [examTitle, setExamTitle] = useState('');
  const [examStructure, setExamStructure] = useState<'standard_3parts' | 'mixed' | 'mcq_only' | 'essay_only'>('standard_3parts');
  const [showReviewQuestions, setShowReviewQuestions] = useState(false);

  // Part 1: From Online Test State
  const [selectedOnlineTestId, setSelectedOnlineTestId] = useState<string>('');
  const [onlineSearch, setOnlineSearch] = useState('');
  const [onlineGradeFilter, setOnlineGradeFilter] = useState<number | 'all'>('all');
  const [onlineVariantOption, setOnlineVariantOption] = useState<'keep' | 'shuffle' | 'isomorphic'>('keep');
  const [onlineCustomCodes, setOnlineCustomCodes] = useState('101, 102, 103, 104');
  const [isConvertingOnline, setIsConvertingOnline] = useState(false);

  // Part 2: Upload Original & Multi-Variant State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isExtractingQuestions, setIsExtractingQuestions] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [uploadVariantMethod, setUploadVariantMethod] = useState<'shuffle' | 'isomorphic' | 'none'>('shuffle');
  const [uploadVariantCodes, setUploadVariantCodes] = useState('101, 102, 103, 104');
  const [uploadShuffleQuestions, setUploadShuffleQuestions] = useState(true);
  const [uploadShuffleOptions, setUploadShuffleOptions] = useState(true);
  const [isGeneratingUploadVariants, setIsGeneratingUploadVariants] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');

  // Statistics of extracted questions by category
  const extractedStats = useMemo(() => {
    let mcq = 0;
    let tf = 0;
    let short = 0;
    let essay = 0;
    extractedQuestions.forEach(q => {
      const t = detectQuestionType(q);
      if (t === 'mcq') mcq++;
      else if (t === 'tf') tf++;
      else if (t === 'short') short++;
      else if (t === 'essay') essay++;
    });
    return { mcq, tf, short, essay, total: extractedQuestions.length };
  }, [extractedQuestions]);

  const handleUpdateQuestionType = (qIndex: number, newType: QuestionType) => {
    setExtractedQuestions(prev => {
      const copy = [...prev];
      if (copy[qIndex]) {
        copy[qIndex] = {
          ...copy[qIndex],
          type: newType,
          isEssay: newType === 'essay',
          isTrueFalse: newType === 'tf',
          isShortAnswer: newType === 'short'
        };
      }
      return copy;
    });
  };

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hidden print container ref
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch offline tests
      const offlineSnap = await getDocs(query(collection(db, 'offline_tests'), orderBy('createdAt', 'desc')));
      const offlineList: OfflineTest[] = [];
      offlineSnap.forEach(docSnap => {
        offlineList.push({ id: docSnap.id, ...docSnap.data() } as OfflineTest);
      });
      setOfflineTests(offlineList);

      // 2. Fetch online tests for conversion
      const onlineSnap = await getDocs(collection(db, 'tests'));
      const onlineList: any[] = [];
      onlineSnap.forEach(docSnap => {
        onlineList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setOnlineTests(onlineList);
    } catch (err: any) {
      console.error('Error loading tests:', err);
      setSysError('Không thể tải danh sách đề thi: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setShowDownloadDropdown(false);
      }
    }
    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  // Auto-dismiss PDF download notification after 10 seconds
  useEffect(() => {
    if (latestPdfDownload) {
      const timer = setTimeout(() => {
        setLatestPdfDownload(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [latestPdfDownload]);

  // Helper: parse questions from string or return array
  const parseQuestions = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  // --- PART 1: CONVERT ONLINE TEST TO OFFLINE ---
  const handleSelectOnlineTest = (test: any) => {
    setSelectedOnlineTestId(test.id);
    setExamTitle(test.title ? `${test.title} (Bản in Offline)` : 'Đề thi offline');
    setExamGrade(test.grade ? Number(test.grade) : 10);
    setExamSubject(test.subject || 'Toán học');
    setExamDuration(test.durationMinutes ? Number(test.durationMinutes) : 45);
    setExamHeader(`ĐỀ KIỂM TRA ĐỊNH KỲ MÔN ${test.subject?.toUpperCase() || 'TOÁN HỌC'}`);
    
    // Auto-detect exam structure from online test
    const qs = parseQuestions(test.questions || test.questionsData);
    const hasEssay = qs.some((q: any) => detectQuestionType(q) === 'essay');
    const hasTfOrShort = qs.some((q: any) => {
      const t = detectQuestionType(q);
      return t === 'tf' || t === 'short';
    });

    if (test.type === 'essay') {
      setExamStructure('essay_only');
    } else if (hasEssay) {
      setExamStructure('mixed');
    } else if (hasTfOrShort) {
      setExamStructure('standard_3parts');
    } else {
      setExamStructure('standard_3parts');
    }

    // Set default variant codes from test if available
    if (test.variantCodes && Array.isArray(test.variantCodes) && test.variantCodes.length > 0) {
      setOnlineCustomCodes(test.variantCodes.join(', '));
      setOnlineVariantOption('keep');
    } else {
      setOnlineCustomCodes('101, 102, 103, 104');
      setOnlineVariantOption('keep');
    }
  };

  const handleConvertOnlineToOffline = async () => {
    const selected = onlineTests.find(t => t.id === selectedOnlineTestId);
    if (!selected) {
      setSysError('Vui lòng chọn một đề thi online từ danh sách.');
      return;
    }

    setIsConvertingOnline(true);
    setSysError('');
    setProgressStatus('Đang chuyển đổi cấu trúc sang đề in offline...');

    try {
      let baseQuestions: any[] = [];
      let finalVariants: TestVariant[] = [];
      let codes: string[] = [];

      // Extract base questions
      if (selected.variants && selected.variants.length > 0) {
        baseQuestions = selected.variants[0].questions || [];
      }
      if (baseQuestions.length === 0 && selected.questionsData) {
        baseQuestions = parseQuestions(selected.questionsData);
      }

      if (baseQuestions.length === 0) {
        throw new Error('Đề thi online này không có dữ liệu câu hỏi để chuyển đổi.');
      }

      if (onlineVariantOption === 'keep' && selected.variants && selected.variants.length > 0) {
        // Keep existing variants
        finalVariants = selected.variants.map((v: any) => ({
          code: v.code || '101',
          questions: v.questions || parseQuestions(v.questionsData),
          questionsData: v.questionsData || JSON.stringify(v.questions)
        }));
        codes = finalVariants.map(v => v.code);
      } else if (onlineVariantOption === 'shuffle') {
        // Generate shuffled variants with section awareness
        const inputCodes = onlineCustomCodes.split(',').map(s => s.trim()).filter(Boolean);
        codes = inputCodes.length > 0 ? inputCodes : ['101', '102', '103', '104'];
        finalVariants = generateTestVariants(baseQuestions, codes, {
          shuffleQuestions: true,
          shuffleOptions: true
        });
      } else if (onlineVariantOption === 'isomorphic') {
        // Generate isomorphic variants with AI
        const inputCodes = onlineCustomCodes.split(',').map(s => s.trim()).filter(Boolean);
        codes = inputCodes.length > 0 ? inputCodes : ['101', '102', '103', '104'];
        const baseCode = codes[0];
        const targetCodes = codes.slice(1);

        finalVariants = [{
          code: baseCode,
          questions: baseQuestions,
          questionsData: JSON.stringify(baseQuestions)
        }];

        for (let i = 0; i < targetCodes.length; i++) {
          const code = targetCodes[i];
          setProgressStatus(`Đang dùng AI tạo mã đề ${code} (${i + 1}/${targetCodes.length}) bằng cách đổi số liệu toán học...`);
          try {
            const isoRes = await fetch('/api/generate-isomorphic-variant', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-gemini-api-key': localStorage.getItem('gemini_api_key') || ''
              },
              body: JSON.stringify({
                baseQuestions: baseQuestions,
                sourceCode: baseCode,
                targetCode: code,
                testTitle: examTitle || selected.title,
                grade: examGrade
              })
            });
            if (isoRes.ok) {
              const isoData = await isoRes.json();
              finalVariants.push(isoData);
            } else {
              // Fallback to shuffle if AI fails
              const fallback = generateTestVariants(baseQuestions, [code], { shuffleQuestions: true, shuffleOptions: true })[0];
              finalVariants.push(fallback);
            }
          } catch {
            const fallback = generateTestVariants(baseQuestions, [code], { shuffleQuestions: true, shuffleOptions: true })[0];
            finalVariants.push(fallback);
          }
        }
      } else {
        // Single code default
        codes = ['101'];
        finalVariants = [{
          code: '101',
          questions: baseQuestions,
          questionsData: JSON.stringify(baseQuestions)
        }];
      }

      // Create new offline test document in Firestore
      const newOfflineTest: Omit<OfflineTest, 'id'> = {
        title: examTitle.trim() || `${selected.title} (Bản in Offline)`,
        schoolName: schoolName.trim() || 'TRUNG TÂM LUYỆN THI ESMART',
        examHeader: examHeader.trim() || 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN',
        grade: examGrade,
        subject: examSubject,
        durationMinutes: examDuration,
        schoolYear: examSchoolYear,
        examStructure: examStructure,
        sourceType: 'online_conversion',
        sourceOnlineTestId: selected.id,
        sourceOnlineTestTitle: selected.title,
        variantMethod: onlineVariantOption,
        variantCodes: codes,
        variants: finalVariants,
        createdAt: new Date().toISOString(),
        createdBy: user?.displayName || user?.email || 'Giáo viên',
        note: `Chuyển đổi từ đề online "${selected.title}"`
      };

      const docRef = await addDoc(collection(db, 'offline_tests'), newOfflineTest);
      const created: OfflineTest = { ...newOfflineTest, id: docRef.id };

      setOfflineTests(prev => [created, ...prev]);
      setShowCreateModal(false);
      setSysMsg(`Đã tạo thành công đề thi offline "${created.title}" với ${codes.length} mã đề (${codes.join(', ')})!`);
      setTimeout(() => setSysMsg(''), 5000);

      // Automatically open preview & export
      openPreviewModal(created);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi chuyển đổi: ' + (err?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsConvertingOnline(false);
      setProgressStatus('');
    }
  };

  // --- PART 2: UPLOAD ORIGINAL TEST & MULTI-VARIANT CREATION ---
  const handleUploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    if (!examTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setExamTitle(cleanName);
    }

    // Auto extract questions with AI
    setIsExtractingQuestions(true);
    setProgressStatus('AI đang đọc và bóc tách câu hỏi, đáp án, lời giải từ file gốc...');
    setSysError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileDataUrl = reader.result as string;
        const res = await fetch('/api/extract-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': localStorage.getItem('gemini_api_key') || ''
          },
          body: JSON.stringify({
            fileDataUrl,
            mimeType: file.type || 'application/pdf'
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.details || errData.error || 'Không thể trích xuất câu hỏi từ file.');
        }

        const questions = await res.json();
        if (Array.isArray(questions) && questions.length > 0) {
          setExtractedQuestions(questions);

          // Auto-detect exam structure
          const hasEssay = questions.some((q: any) => detectQuestionType(q) === 'essay');
          const hasTfOrShort = questions.some((q: any) => {
            const t = detectQuestionType(q);
            return t === 'tf' || t === 'short';
          });
          if (hasEssay) {
            setExamStructure('mixed');
          } else if (hasTfOrShort) {
            setExamStructure('standard_3parts');
          } else {
            setExamStructure('standard_3parts');
          }

          setSysMsg(`Đã trích xuất thành công ${questions.length} câu hỏi từ file "${file.name}"!`);
          setTimeout(() => setSysMsg(''), 5000);
        } else {
          setSysError('Không tìm thấy câu hỏi trắc nghiệm/tự luận trong file tải lên. Bạn có thể kiểm tra lại định dạng file.');
        }
        setIsExtractingQuestions(false);
        setProgressStatus('');
      };
      reader.onerror = () => {
        setIsExtractingQuestions(false);
        setProgressStatus('');
        setSysError('Không thể đọc file đã chọn.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi trích xuất: ' + (err?.message || 'Có lỗi xảy ra'));
      setIsExtractingQuestions(false);
      setProgressStatus('');
    }
  };

  const handleCreateOfflineFromUpload = async () => {
    if (extractedQuestions.length === 0) {
      setSysError('Chưa có câu hỏi nào được trích xuất. Vui lòng tải lên file đề thi gốc.');
      return;
    }

    setIsGeneratingUploadVariants(true);
    setSysError('');
    setProgressStatus('Đang khởi tạo các mã đề thi offline...');

    try {
      let finalVariants: TestVariant[] = [];
      let codes: string[] = [];

      if (uploadVariantMethod === 'shuffle') {
        const inputCodes = uploadVariantCodes.split(',').map(s => s.trim()).filter(Boolean);
        codes = inputCodes.length > 0 ? inputCodes : ['101', '102', '103', '104'];
        finalVariants = generateTestVariants(extractedQuestions, codes, {
          shuffleQuestions: uploadShuffleQuestions,
          shuffleOptions: uploadShuffleOptions
        });
      } else if (uploadVariantMethod === 'isomorphic') {
        const inputCodes = uploadVariantCodes.split(',').map(s => s.trim()).filter(Boolean);
        codes = inputCodes.length > 0 ? inputCodes : ['101', '102', '103', '104'];
        const baseCode = codes[0];
        const targetCodes = codes.slice(1);

        finalVariants = [{
          code: baseCode,
          questions: extractedQuestions,
          questionsData: JSON.stringify(extractedQuestions)
        }];

        for (let i = 0; i < targetCodes.length; i++) {
          const code = targetCodes[i];
          setProgressStatus(`Đang dùng AI tạo mã đề ${code} (${i + 1}/${targetCodes.length}) bằng cách đổi số liệu toán học...`);
          try {
            const isoRes = await fetch('/api/generate-isomorphic-variant', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-gemini-api-key': localStorage.getItem('gemini_api_key') || ''
              },
              body: JSON.stringify({
                baseQuestions: extractedQuestions,
                sourceCode: baseCode,
                targetCode: code,
                testTitle: examTitle,
                grade: examGrade
              })
            });
            if (isoRes.ok) {
              const isoData = await isoRes.json();
              finalVariants.push(isoData);
            } else {
              const fallback = generateTestVariants(extractedQuestions, [code], { shuffleQuestions: true, shuffleOptions: true })[0];
              finalVariants.push(fallback);
            }
          } catch {
            const fallback = generateTestVariants(extractedQuestions, [code], { shuffleQuestions: true, shuffleOptions: true })[0];
            finalVariants.push(fallback);
          }
        }
      } else {
        // None: single code
        codes = ['101'];
        finalVariants = [{
          code: '101',
          questions: extractedQuestions,
          questionsData: JSON.stringify(extractedQuestions)
        }];
      }

      const newOfflineTest: Omit<OfflineTest, 'id'> = {
        title: examTitle.trim() || 'Đề thi offline',
        schoolName: schoolName.trim() || 'TRUNG TÂM LUYỆN THI ESMART',
        examHeader: examHeader.trim() || 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN',
        grade: examGrade,
        subject: examSubject,
        durationMinutes: examDuration,
        schoolYear: examSchoolYear,
        examStructure: examStructure,
        sourceType: 'uploaded_original',
        variantMethod: uploadVariantMethod,
        variantCodes: codes,
        variants: finalVariants,
        createdAt: new Date().toISOString(),
        createdBy: user?.displayName || user?.email || 'Giáo viên',
        note: `Tải lên từ file "${uploadFile?.name || 'Đề gốc'}" (${uploadVariantMethod === 'shuffle' ? 'Đảo câu & đáp án' : uploadVariantMethod === 'isomorphic' ? 'AI đổi số liệu' : '1 mã đề'})`
      };

      const docRef = await addDoc(collection(db, 'offline_tests'), newOfflineTest);
      const created: OfflineTest = { ...newOfflineTest, id: docRef.id };

      setOfflineTests(prev => [created, ...prev]);
      setShowCreateModal(false);
      setSysMsg(`Đã tạo thành công đề thi offline "${created.title}" với ${codes.length} mã đề (${codes.join(', ')})!`);
      setTimeout(() => setSysMsg(''), 5000);

      // Open preview modal
      openPreviewModal(created);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi tạo mã đề: ' + (err?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsGeneratingUploadVariants(false);
      setProgressStatus('');
    }
  };

  // --- PREVIEW & EXPORT HELPERS ---
  const openPreviewModal = (test: OfflineTest) => {
    setPreviewTest(test);
    setShowDownloadDropdown(false);
    if (test.variants && test.variants.length > 0) {
      setActivePreviewVariantCode(test.variants[0].code);
    } else if (test.variantCodes && test.variantCodes.length > 0) {
      setActivePreviewVariantCode(test.variantCodes[0]);
    }
    setPreviewTab('exam');
  };

  const handleDeleteOfflineTest = async (testId: string) => {
    try {
      await deleteDoc(doc(db, 'offline_tests', testId));
      setOfflineTests(prev => prev.filter(t => t.id !== testId));
      setSysMsg('Đã xóa đề thi offline thành công.');
      setDeletingId(null);
      setTimeout(() => setSysMsg(''), 4000);
      if (previewTest?.id === testId) {
        setPreviewTest(null);
      }
    } catch (err: any) {
      console.error(err);
      setSysError('Không thể xóa đề thi: ' + (err?.message || 'Lỗi mạng'));
    }
  };

  // Export PDF using html2canvas-pro & jsPDF
  const handleExportPDF = async (type: 'single_variant' | 'all_variants' | 'matrix' | 'solutions') => {
    if (!previewTest) return;
    setIsExportingPdf(true);
    setPdfProgressText('Đang chuẩn bị nội dung tài liệu...');

    try {
      // Set exportState to trigger rendering into offscreen container
      setExportState({ type, variantCode: activePreviewVariantCode });

      // Wait a moment for React & MathText (KaTeX) to render fully in DOM
      await new Promise(resolve => setTimeout(resolve, 450));

      const container = exportContainerRef.current;
      if (!container) throw new Error('Không thể khởi tạo vùng xuất bản in.');

      let fileName = `De_thi_offline_${(previewTest.title || 'test').replace(/[\s\/\\:*?"<>|]+/g, '_')}`;
      if (type === 'single_variant') {
        fileName += `_MaDe_${activePreviewVariantCode}`;
      } else if (type === 'all_variants') {
        fileName += `_TronBo_${(previewTest.variants || []).length}_MaDe`;
      } else if (type === 'matrix') {
        fileName += `_BangMaTranDapAn`;
      } else if (type === 'solutions') {
        fileName += `_HuongDanGiai_MaDe_${activePreviewVariantCode}`;
      }
      fileName += `_${Date.now()}.pdf`;

      let elementsToExport: HTMLElement[] = [];
      if (type === 'all_variants') {
        const variantPages = container.querySelectorAll<HTMLElement>('.variant-export-page');
        if (variantPages.length > 0) {
          elementsToExport = Array.from(variantPages);
        } else {
          elementsToExport = [container];
        }
      } else {
        elementsToExport = [container];
      }

      const result = await generatePdfFromElements(elementsToExport, {
        fileName,
        onProgress: (text) => setPdfProgressText(text)
      });

      setLatestPdfDownload({ url: result.url, fileName: result.fileName });
      setSysMsg(`Đã tạo thành công tệp PDF: ${result.fileName}`);
      setTimeout(() => setSysMsg(''), 6000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setSysError('Lỗi xuất PDF: ' + (err?.message || 'Không thể tạo file'));
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText('');
      setExportState(null);
    }
  };


  // Browser Native Print (Ultra sharp vector print)
  const handleNativePrint = () => {
    window.print();
  };

  // Filtered offline tests
  const filteredOfflineTests = offlineTests.filter(t => {
    if (selectedGradeFilter !== 'all' && t.grade !== selectedGradeFilter) return false;
    if (sourceFilter !== 'all' && t.sourceType !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchHeader = (t.examHeader || '').toLowerCase().includes(q);
      const matchCodes = (t.variantCodes || []).join(' ').toLowerCase().includes(q);
      if (!matchTitle && !matchHeader && !matchCodes) return false;
    }
    return true;
  });

  // Filtered online tests in Modal
  const filteredOnlineTests = onlineTests.filter(t => {
    if (onlineGradeFilter !== 'all' && t.grade !== onlineGradeFilter) return false;
    if (onlineSearch.trim()) {
      const q = onlineSearch.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchTopic = (t.topic || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTopic) return false;
    }
    return true;
  });

  // Current active variant in preview
  const currentVariant = previewTest?.variants?.find(v => v.code === activePreviewVariantCode) || previewTest?.variants?.[0];

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {sysMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-600 shrink-0" size={18} />
            <span className="text-sm font-medium">{sysMsg}</span>
          </div>
          <button onClick={() => setSysMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}
      {sysError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between shadow-2xs">
          <span className="text-sm font-medium">{sysError}</span>
          <button onClick={() => setSysError('')} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-2xs border border-gray-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
              <Printer size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Bài kiểm tra và thi offline</h2>
              <p className="text-sm text-gray-500">
                Tạo đề thi giấy chuẩn in ấn Bộ GD&ĐT, chuyển đổi từ đề online, trộn nhiều mã đề và tải xuống PDF
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              setCreateTab('from_online');
              setShowCreateModal(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-2xs transition-colors"
          >
            <Plus size={18} />
            <span>Tạo đề thi offline mới</span>
          </button>
          <button
            onClick={loadData}
            title="Làm mới danh sách"
            className="p-2.5 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-colors bg-white"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedGradeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedGradeFilter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tất cả khối
            </button>
            {[6, 7, 8, 9, 10, 11, 12].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGradeFilter(g)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedGradeFilter === g ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sourceFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tất cả nguồn
            </button>
            <button
              onClick={() => setSourceFilter('online_conversion')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sourceFilter === 'online_conversion' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Từ đề online
            </button>
            <button
              onClick={() => setSourceFilter('uploaded_original')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sourceFilter === 'uploaded_original' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tải file gốc
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi offline..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <RefreshCw className="animate-spin text-blue-500 mx-auto mb-3" size={28} />
          <p className="text-sm font-medium text-gray-600">Đang tải kho đề thi offline...</p>
        </div>
      ) : filteredOfflineTests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-800">Chưa có đề thi offline nào</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1.5">
            Bấm vào nút "Tạo đề thi offline mới" để chuyển đổi đề thi online có sẵn hoặc tải lên file đề gốc để tạo nhiều mã đề in ấn.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => {
                setCreateTab('from_online');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-2"
            >
              <Copy size={15} />
              <span>Chuyển từ đề online có sẵn</span>
            </button>
            <button
              onClick={() => {
                setCreateTab('upload_new');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-2"
            >
              <Upload size={15} />
              <span>Tải lên đề gốc & Trộn mã đề</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOfflineTests.map(t => {
            const variantCount = t.variantCodes?.length || t.variants?.length || 1;
            const isMulti = variantCount > 1;
            const qCount = t.variants?.[0]?.questions?.length || 0;

            return (
              <div 
                key={t.id} 
                className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md border border-blue-100">
                        Khối {t.grade}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-medium rounded-md">
                        {t.durationMinutes} phút
                      </span>
                      {t.sourceType === 'online_conversion' ? (
                        <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[11px] font-semibold rounded-md border border-cyan-100 flex items-center gap-1">
                          <Copy size={11} /> Từ đề online
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-md border border-purple-100 flex items-center gap-1">
                          <Upload size={11} /> File tải lên
                        </span>
                      )}

                      {t.examStructure === 'standard_3parts' ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10.5px] font-bold rounded-md border border-blue-200">
                          TN 3 phần (Bộ GD&ĐT)
                        </span>
                      ) : t.examStructure === 'mixed' ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10.5px] font-bold rounded-md border border-purple-200">
                          Tổng hợp (TN + Tự luận)
                        </span>
                      ) : t.examStructure === 'essay_only' ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10.5px] font-bold rounded-md border border-amber-200">
                          Tự luận
                        </span>
                      ) : t.examStructure === 'mcq_only' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10.5px] font-bold rounded-md border border-emerald-200">
                          TN 4 lựa chọn
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2">
                    {t.title}
                  </h3>

                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{t.schoolName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <span>{qCount} câu hỏi • Năm học: {t.schoolYear || '2025 - 2026'}</span>
                    </div>
                  </div>

                  {/* Badges for variants */}
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-gray-700 flex items-center gap-1">
                        <Layers size={13} className="text-blue-600" />
                        {isMulti ? `${variantCount} Mã đề in ấn` : '1 Mã đề'}
                      </span>
                      {t.variantMethod === 'isomorphic' && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                          AI đổi số liệu
                        </span>
                      )}
                      {t.variantMethod === 'shuffle' && (
                        <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-medium">
                          Đảo câu & đáp án
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(t.variantCodes || []).map(code => (
                        <span key={code} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded">
                          Mã {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPreviewModal(t)}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye size={14} />
                      <span>Xem & Tải PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        openPreviewModal(t);
                        setTimeout(() => handleNativePrint(), 500);
                      }}
                      title="In đề thi ngay"
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center"
                    >
                      <Printer size={16} />
                    </button>
                  </div>

                  {deletingId === t.id ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-xl border border-red-100">
                      <span className="text-[11px] text-red-700 font-semibold flex-1 pl-1">Xác nhận xóa đề?</span>
                      <button
                        onClick={() => handleDeleteOfflineTest(t.id)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg"
                      >
                        Xóa
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-medium rounded-lg"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-[11px] text-gray-400">
                      <span>Tạo: {new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Xóa đề
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO ĐỀ THI OFFLINE (VỚI 2 PHẦN THEO YÊU CẦU)                       */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
            {/* Modal Header with Tabs */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/40">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tạo bài kiểm tra và thi offline mới</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Xuất bản đề thi giấy in ấn A4 chuẩn quy chuẩn kèm bảng ma trận đáp án và lời giải chi tiết
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 2 Tabs as requested */}
              <div className="grid grid-cols-2 gap-2 bg-gray-200/70 p-1.5 rounded-2xl">
                <button
                  onClick={() => setCreateTab('from_online')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    createTab === 'from_online'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Copy size={16} />
                  <span>Phần 1: Chuyển đổi từ đề online có sẵn</span>
                </button>
                <button
                  onClick={() => setCreateTab('upload_new')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    createTab === 'upload_new'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload size={16} />
                  <span>Phần 2: Tải lên đề gốc & Trộn nhiều mã đề</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Common Header Layout Settings for Print */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-blue-600" />
                  Cấu hình tiêu đề & thông tin in ấn đề thi giấy
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Tên trường / Trung tâm</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={e => setSchoolName(e.target.value)}
                      placeholder="TRUNG TÂM ESMART..."
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Tiêu đề kỳ thi</label>
                    <input
                      type="text"
                      value={examHeader}
                      onChange={e => setExamHeader(e.target.value)}
                      placeholder="ĐỀ KIỂM TRA ĐỊNH KỲ..."
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Môn học</label>
                    <input
                      type="text"
                      value={examSubject}
                      onChange={e => setExamSubject(e.target.value)}
                      placeholder="Toán học..."
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Khối lớp</label>
                    <select
                      value={examGrade}
                      onChange={e => setExamGrade(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    >
                      {[6, 7, 8, 9, 10, 11, 12].map(g => (
                        <option key={g} value={g}>Khối {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Thời gian làm bài (phút)</label>
                    <input
                      type="number"
                      value={examDuration}
                      onChange={e => setExamDuration(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Năm học</label>
                    <input
                      type="text"
                      value={examSchoolYear}
                      onChange={e => setExamSchoolYear(e.target.value)}
                      placeholder="2025 - 2026"
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 pt-1 border-t border-gray-200/80">
                    <label className="block text-[11px] font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-blue-900">
                        <FileText size={13} className="text-blue-600" /> Cấu trúc định dạng đề thi
                      </span>
                      <span className="text-[10.5px] text-gray-500 font-normal">
                        Chuẩn Bộ GD&ĐT (Trắc nghiệm 3 phần) hoặc Đề tổng hợp
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div
                        onClick={() => setExamStructure('standard_3parts')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          examStructure === 'standard_3parts'
                            ? 'border-blue-600 bg-blue-50/80 shadow-2xs ring-1 ring-blue-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-blue-950 text-xs mb-0.5 flex items-center justify-between">
                            <span>1. Trắc nghiệm 3 phần</span>
                            {examStructure === 'standard_3parts' && <CheckCircle size={13} className="text-blue-600" />}
                          </div>
                          <div className="text-[10.5px] text-gray-600 leading-snug">
                            Chuẩn Bộ GD&ĐT: Gồm Trắc nghiệm nhiều PA, Đúng/Sai, và Trả lời ngắn.
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setExamStructure('mixed')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          examStructure === 'mixed'
                            ? 'border-purple-600 bg-purple-50/80 shadow-2xs ring-1 ring-purple-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-purple-950 text-xs mb-0.5 flex items-center justify-between">
                            <span>2. Đề tổng hợp</span>
                            {examStructure === 'mixed' && <CheckCircle size={13} className="text-purple-600" />}
                          </div>
                          <div className="text-[10.5px] text-gray-600 leading-snug">
                            Gồm Phần I: Trắc nghiệm khách quan và Phần II: Tự luận.
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setExamStructure('mcq_only')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          examStructure === 'mcq_only'
                            ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-emerald-950 text-xs mb-0.5 flex items-center justify-between">
                            <span>3. Trắc nghiệm 4 lựa chọn</span>
                            {examStructure === 'mcq_only' && <CheckCircle size={13} className="text-emerald-600" />}
                          </div>
                          <div className="text-[10.5px] text-gray-600 leading-snug">
                            100% câu hỏi trắc nghiệm truyền thống với 4 phương án A, B, C, D.
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setExamStructure('essay_only')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          examStructure === 'essay_only'
                            ? 'border-amber-600 bg-amber-50/80 shadow-2xs ring-1 ring-amber-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-amber-950 text-xs mb-0.5 flex items-center justify-between">
                            <span>4. Đề thi Tự luận</span>
                            {examStructure === 'essay_only' && <CheckCircle size={13} className="text-amber-600" />}
                          </div>
                          <div className="text-[10.5px] text-gray-600 leading-snug">
                            Toàn bộ các câu hỏi tự luận có phân bổ điểm chi tiết.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: FROM ONLINE TEST CONTENT                               */}
              {/* ------------------------------------------------------------- */}
              {createTab === 'from_online' && (
                <div className="space-y-4">
                  <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-2xl">
                    <h4 className="font-bold text-blue-900 text-xs mb-1 flex items-center gap-1.5">
                      <Copy size={15} /> Bước 1: Chọn bài thi từ kho online
                    </h4>
                    <p className="text-[11px] text-blue-700 mb-3">
                      Chọn bài kiểm tra online có sẵn để chuyển thành cấu trúc đề thi giấy offline chuẩn in ấn.
                    </p>

                    <div className="flex gap-2 mb-3">
                      <select
                        value={onlineGradeFilter}
                        onChange={e => setOnlineGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-xl text-xs"
                      >
                        <option value="all">Tất cả khối</option>
                        {[6, 7, 8, 9, 10, 11, 12].map(g => (
                          <option key={g} value={g}>Khối {g}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Tìm theo tên bài kiểm tra online..."
                        value={onlineSearch}
                        onChange={e => setOnlineSearch(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {filteredOnlineTests.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 bg-white rounded-xl border">
                          Không tìm thấy bài thi online nào phù hợp.
                        </div>
                      ) : (
                        filteredOnlineTests.map(t => {
                          const isSelected = selectedOnlineTestId === t.id;
                          const hasMulti = t.isMultiVariant || (t.variants && t.variants.length > 1);
                          return (
                            <div
                              key={t.id}
                              onClick={() => handleSelectOnlineTest(t)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white hover:border-blue-300 text-gray-800'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-xs">{t.title}</div>
                                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                  Khối {t.grade} • {t.durationMinutes} phút • {hasMulti ? `${t.variants?.length || t.variantCodes?.length || 'Nhiều'} mã đề` : '1 mã đề'}
                                </div>
                              </div>
                              <div className="shrink-0">
                                {isSelected ? (
                                  <CheckCircle size={18} className="text-white" />
                                ) : (
                                  <span className="text-[11px] font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                                    Chọn
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {selectedOnlineTestId && (
                    <div className="border border-gray-200 p-4 rounded-2xl bg-white space-y-3">
                      <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                        <Layers size={15} className="text-blue-600" /> Bước 2: Tùy chọn sinh mã đề offline
                      </h4>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            name="onlineVariantOption"
                            checked={onlineVariantOption === 'keep'}
                            onChange={() => setOnlineVariantOption('keep')}
                            className="text-blue-600"
                          />
                          <div>
                            <span className="font-bold text-gray-800">Giữ nguyên các mã đề hiện có của đề online</span>
                            <span className="block text-[11px] text-gray-500">Chuyển đổi trực tiếp các câu hỏi và mã đề sẵn có</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            name="onlineVariantOption"
                            checked={onlineVariantOption === 'shuffle'}
                            onChange={() => setOnlineVariantOption('shuffle')}
                            className="text-blue-600"
                          />
                          <div>
                            <span className="font-bold text-gray-800">Trộn lại thành nhiều mã đề offline (Đảo câu & đảo đáp án)</span>
                            <span className="block text-[11px] text-gray-500">Xáo trộn câu hỏi và các phương án A, B, C, D để học sinh không chép bài nhau</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            name="onlineVariantOption"
                            checked={onlineVariantOption === 'isomorphic'}
                            onChange={() => setOnlineVariantOption('isomorphic')}
                            className="text-blue-600"
                          />
                          <div>
                            <span className="font-bold text-gray-800">Sinh các mã đề tương tự bằng AI (Đổi số liệu toán học)</span>
                            <span className="block text-[11px] text-gray-500">Giữ nguyên dạng bài nhưng thay đổi số liệu và tính lại đáp án tự động</span>
                          </div>
                        </label>
                      </div>

                      {onlineVariantOption !== 'keep' && (
                        <div className="pt-2 border-t border-gray-100">
                          <label className="block font-semibold text-gray-700 text-[11px] mb-1">
                            Các mã đề cần tạo (cách nhau dấu phẩy):
                          </label>
                          <input
                            type="text"
                            value={onlineCustomCodes}
                            onChange={e => setOnlineCustomCodes(e.target.value)}
                            placeholder="101, 102, 103, 104"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: UPLOAD ORIGINAL TEST & MULTI-VARIANT                   */}
              {/* ------------------------------------------------------------- */}
              {createTab === 'upload_new' && (
                <div className="space-y-4">
                  <div className="border border-dashed border-indigo-200 bg-indigo-50/40 p-6 rounded-2xl text-center">
                    <Upload className="mx-auto text-indigo-600 mb-2" size={28} />
                    <h4 className="font-bold text-indigo-950 text-xs mb-1">Tải lên file đề thi gốc (PDF, Word, Ảnh)</h4>
                    <p className="text-[11px] text-indigo-700 max-w-md mx-auto mb-3">
                      Hệ thống sẽ dùng AI trích xuất tự động toàn bộ câu hỏi, phương án A-B-C-D, đáp án đúng và lời giải chi tiết.
                    </p>

                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors">
                      <FileCode size={15} />
                      <span>{uploadFile ? uploadFile.name : 'Chọn tệp đề thi (.pdf, .doc, .docx, .png, .jpg)'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={handleUploadFileChange}
                        disabled={isExtractingQuestions}
                        className="hidden"
                      />
                    </label>

                    {isExtractingQuestions && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-indigo-800 text-xs font-semibold">
                        <RefreshCw className="animate-spin" size={16} />
                        <span>{progressStatus || 'AI đang trích xuất câu hỏi từ file...'}</span>
                      </div>
                    )}
                  </div>

                  {extractedQuestions.length > 0 && (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle size={16} className="text-emerald-600" />
                          Đã trích xuất {extractedQuestions.length} câu hỏi từ file
                        </span>
                        <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                          Sẵn sàng tạo nhiều mã đề
                        </span>
                      </div>

                      {/* Structure Breakdown Chips & Inspection */}
                      <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] uppercase tracking-wider text-gray-700">
                            Thống kê cấu trúc ({extractedStats.total} câu hỏi):
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowReviewQuestions(!showReviewQuestions)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                          >
                            <span>{showReviewQuestions ? 'Thu gọn danh sách câu hỏi' : 'Xem & điều chỉnh loại từng câu'}</span>
                            <ChevronDown size={14} className={`transform transition-transform ${showReviewQuestions ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="px-2.5 py-1 bg-blue-100/70 border border-blue-200 text-blue-900 rounded-lg flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span className="font-semibold">Phần I (Nhiều phương án):</span>
                            <span className="font-bold">{extractedStats.mcq} câu</span>
                          </div>
                          <div className="px-2.5 py-1 bg-amber-100/70 border border-amber-200 text-amber-900 rounded-lg flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                            <span className="font-semibold">Phần II (Đúng / Sai):</span>
                            <span className="font-bold">{extractedStats.tf} câu</span>
                          </div>
                          <div className="px-2.5 py-1 bg-teal-100/70 border border-teal-200 text-teal-900 rounded-lg flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                            <span className="font-semibold">Phần III (Trả lời ngắn):</span>
                            <span className="font-bold">{extractedStats.short} câu</span>
                          </div>
                          {extractedStats.essay > 0 && (
                            <div className="px-2.5 py-1 bg-purple-100/70 border border-purple-200 text-purple-900 rounded-lg flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                              <span className="font-semibold">Phần Tự luận:</span>
                              <span className="font-bold">{extractedStats.essay} câu</span>
                            </div>
                          )}
                        </div>

                        {/* Collapsible Question Inspection & Type Customization */}
                        {showReviewQuestions && (
                          <div className="mt-3 pt-3 border-t border-gray-200 max-h-60 overflow-y-auto space-y-2 pr-1">
                            {extractedQuestions.map((q, qIdx) => {
                              const currType = detectQuestionType(q);
                              return (
                                <div key={qIdx} className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-start justify-between gap-3 text-xs">
                                  <div className="flex-1">
                                    <div className="font-bold text-gray-900 mb-0.5">
                                      Câu {qIdx + 1}:
                                    </div>
                                    <div className="text-gray-700 line-clamp-2">
                                      <MathText content={q.question || ''} />
                                    </div>
                                    <div className="text-[11px] text-gray-500 mt-1">
                                      Đáp án: <strong className="text-blue-700">{q.correctAnswer || 'Chưa cập nhật'}</strong>
                                    </div>
                                  </div>
                                  <div className="shrink-0">
                                    <label className="block text-[10px] text-gray-500 font-medium mb-0.5">Loại câu:</label>
                                    <select
                                      value={currType}
                                      onChange={e => handleUpdateQuestionType(qIdx, e.target.value as QuestionType)}
                                      className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-semibold text-gray-800"
                                    >
                                      <option value="mcq">Phần I: Nhiều lựa chọn</option>
                                      <option value="tf">Phần II: Đúng / Sai</option>
                                      <option value="short">Phần III: Trả lời ngắn</option>
                                      <option value="essay">Phần Tự luận</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Multi-variant settings */}
                      <div className="border border-gray-200 p-4 rounded-2xl bg-white space-y-3">
                        <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                          <Shuffle size={15} className="text-indigo-600" /> Phương thức tạo nhiều mã đề offline
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            onClick={() => setUploadVariantMethod('shuffle')}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              uploadVariantMethod === 'shuffle'
                                ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-indigo-950 text-xs">1. Đảo câu hỏi & Đảo đáp án</span>
                              <Shuffle size={16} className="text-indigo-600" />
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Xáo trộn thứ tự các câu và hoán vị các phương án A, B, C, D. Nhanh chóng, chính xác tuyệt đối.
                            </p>
                          </label>

                          <label
                            onClick={() => setUploadVariantMethod('isomorphic')}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              uploadVariantMethod === 'isomorphic'
                                ? 'border-purple-600 bg-purple-50/60 shadow-2xs'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-purple-950 text-xs">2. Sinh đề tương tự bằng AI</span>
                              <Sparkles size={16} className="text-purple-600" />
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Giữ nguyên ma trận và dạng toán, AI đổi số liệu phương trình, tọa độ và tự động giải lại đáp án.
                            </p>
                          </label>
                        </div>

                        <div className="pt-2">
                          <label className="block font-semibold text-gray-700 text-[11px] mb-1">
                            Các mã đề mong muốn (cách nhau dấu phẩy):
                          </label>
                          <input
                            type="text"
                            value={uploadVariantCodes}
                            onChange={e => setUploadVariantCodes(e.target.value)}
                            placeholder="101, 102, 103, 104"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                          />
                        </div>

                        {uploadVariantMethod === 'shuffle' && (
                          <div className="flex items-center gap-4 text-[11px] text-gray-700 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={uploadShuffleQuestions}
                                onChange={e => setUploadShuffleQuestions(e.target.checked)}
                                className="rounded text-indigo-600"
                              />
                              <span>Xáo trộn thứ tự câu hỏi</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={uploadShuffleOptions}
                                onChange={e => setUploadShuffleOptions(e.target.checked)}
                                className="rounded text-indigo-600"
                              />
                              <span>Hoán vị các phương án A, B, C, D</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl"
              >
                Hủy bỏ
              </button>

              {createTab === 'from_online' ? (
                <button
                  onClick={handleConvertOnlineToOffline}
                  disabled={!selectedOnlineTestId || isConvertingOnline}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isConvertingOnline ? (
                    <>
                      <RefreshCw className="animate-spin" size={15} />
                      <span>{progressStatus || 'Đang chuyển đổi...'}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck size={16} />
                      <span>Chuyển đổi sang đề offline & Xem trước</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCreateOfflineFromUpload}
                  disabled={extractedQuestions.length === 0 || isGeneratingUploadVariants}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isGeneratingUploadVariants ? (
                    <>
                      <RefreshCw className="animate-spin" size={15} />
                      <span>{progressStatus || 'Đang tạo nhiều mã đề...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Tạo nhiều mã đề offline & Xem trước</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM TRƯỚC VÀ TẢI XUỐNG PDF (PREVIEW & DOWNLOAD PDF MODAL)          */}
      {/* ========================================================================= */}
      {previewTest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-gray-100 rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden border border-gray-300">
            {/* Modal Action Bar */}
            <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTest(null)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                    {previewTest.title}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {previewTest.schoolName} • {previewTest.durationMinutes} phút • Khối {previewTest.grade}
                  </p>
                </div>
              </div>

              {/* View Tabs */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setPreviewTab('exam')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    previewTab === 'exam' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText size={14} /> Đề thi in ấn
                </button>
                <button
                  onClick={() => setPreviewTab('matrix')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    previewTab === 'matrix' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileCheck size={14} /> Bảng đáp án ma trận
                </button>
                <button
                  onClick={() => setPreviewTab('solutions')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    previewTab === 'solutions' ? 'bg-white text-purple-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sparkles size={14} /> Lời giải chi tiết
                </button>
              </div>

              {/* Download Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNativePrint}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-gray-300"
                  title="In trực tiếp hoặc Lưu PDF máy in"
                >
                  <Printer size={15} />
                  <span className="hidden sm:inline">In trực tiếp</span>
                </button>

                <div 
                  ref={downloadDropdownRef}
                  className="relative"
                  onMouseEnter={() => setShowDownloadDropdown(true)}
                >
                  <button
                    type="button"
                    onClick={() => setShowDownloadDropdown(prev => !prev)}
                    disabled={isExportingPdf}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={15} />
                    <span>{isExportingPdf ? 'Đang xuất PDF...' : 'Tải xuống PDF'}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showDownloadDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown for download options */}
                  {showDownloadDropdown && (
                    <div className="absolute right-0 top-full pt-1.5 z-50">
                      <div className="w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 text-xs">
                        <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Tùy chọn tải file PDF
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDownloadDropdown(false);
                            handleExportPDF('single_variant');
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-gray-800 hover:text-blue-700 font-medium flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={15} className="text-blue-600 shrink-0" />
                            <span>Tải Mã đề {activePreviewVariantCode} (PDF)</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 font-bold rounded shrink-0">
                            Đang xem
                          </span>
                        </button>
                        {previewTest.variantCodes && previewTest.variantCodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowDownloadDropdown(false);
                              handleExportPDF('all_variants');
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-indigo-50 text-gray-800 hover:text-indigo-700 font-medium flex items-center justify-between border-t border-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Layers size={15} className="text-indigo-600 shrink-0" />
                              <span>Tải trọn bộ tất cả mã đề (PDF)</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded shrink-0">
                              {previewTest.variantCodes.length} mã
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDownloadDropdown(false);
                            handleExportPDF('matrix');
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 font-medium flex items-center justify-between border-t border-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileCheck size={15} className="text-emerald-600 shrink-0" />
                            <span>Tải Bảng ma trận đáp án (PDF)</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDownloadDropdown(false);
                            handleExportPDF('solutions');
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-purple-50 text-gray-800 hover:text-purple-700 font-medium flex items-center justify-between border-t border-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles size={15} className="text-purple-600 shrink-0" />
                            <span>Tải Hướng dẫn giải chi tiết (PDF)</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setPreviewTest(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Progress bar during PDF export */}
            {isExportingPdf && (
              <div className="bg-blue-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold shrink-0 shadow-inner">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{pdfProgressText || 'Đang kết xuất tệp PDF in ấn...'}</span>
                </div>
                <span className="text-[11px] bg-blue-700/80 px-2 py-0.5 rounded-full">Chuẩn A4 & KaTeX</span>
              </div>
            )}

            {/* Variant Selector Bar (if multi-variant and viewing exam or solutions) */}
            {previewTest.variantCodes && previewTest.variantCodes.length > 1 && previewTab !== 'matrix' && (
              <div className="bg-white px-6 py-2 border-b border-gray-200 flex items-center gap-2 overflow-x-auto shrink-0">
                <span className="text-xs font-bold text-gray-600 shrink-0">Chọn mã đề xem:</span>
                {previewTest.variantCodes.map(code => (
                  <button
                    key={code}
                    onClick={() => setActivePreviewVariantCode(code)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      activePreviewVariantCode === code
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Mã đề {code}
                  </button>
                ))}
              </div>
            )}

            {/* Printable & Scrollable Canvas Container */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-gray-200/70">
              <div 
                id="offline-print-content"
                ref={printContainerRef}
                className="bg-white text-gray-900 shadow-md w-full max-w-[210mm] p-6 sm:p-10 rounded-sm print:p-0 print:shadow-none print:w-full print:max-w-none text-sm leading-relaxed"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {previewTab === 'exam' && currentVariant && (
                  <ExamPaperContent test={previewTest} variant={currentVariant} />
                )}

                {previewTab === 'matrix' && (
                  <AnswerMatrixContent test={previewTest} />
                )}

                {previewTab === 'solutions' && currentVariant && (
                  <SolutionsContent test={previewTest} variant={currentVariant} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen render container for PDF generation */}
      {exportState && previewTest && (
        <div 
          ref={exportContainerRef}
          id="offline-export-container"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '794px',
            backgroundColor: '#ffffff',
            color: '#111827',
            fontFamily: "'Times New Roman', Times, serif"
          }}
        >
          {exportState.type === 'single_variant' && (
            <div className="p-8 bg-white">
              <ExamPaperContent 
                test={previewTest} 
                variant={previewTest.variants?.find(v => v.code === exportState.variantCode) || previewTest.variants?.[0]} 
              />
            </div>
          )}

          {exportState.type === 'all_variants' && (
            <div>
              {(previewTest.variants || []).map((v) => (
                <div key={v.code} className="variant-export-page p-8 bg-white mb-6">
                  <ExamPaperContent test={previewTest} variant={v} />
                </div>
              ))}
            </div>
          )}

          {exportState.type === 'matrix' && (
            <div className="p-8 bg-white">
              <AnswerMatrixContent test={previewTest} />
            </div>
          )}

          {exportState.type === 'solutions' && (
            <div className="p-8 bg-white">
              <SolutionsContent 
                test={previewTest} 
                variant={previewTest.variants?.find(v => v.code === exportState.variantCode) || previewTest.variants?.[0]} 
              />
            </div>
          )}
        </div>
      )}

      {/* Download Success Floating Notification */}
      {latestPdfDownload && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] w-[92vw] sm:w-[420px] max-w-full bg-white border-2 border-emerald-500 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5"
          role="alert"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle size={20} />
          </div>

          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-gray-900 text-sm">Đã tạo tệp PDF thành công!</span>
            </div>
            <p className="text-gray-600 truncate mt-0.5 font-mono text-[11px]" title={latestPdfDownload.fileName}>
              {latestPdfDownload.fileName}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <a 
                href={latestPdfDownload.url} 
                download={latestPdfDownload.fileName}
                onClick={() => {
                  setTimeout(() => setLatestPdfDownload(null), 1200);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Tải về máy</span>
              </a>

              <a 
                href={latestPdfDownload.url} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Mở xem / In</span>
              </a>

              <button 
                type="button"
                onClick={() => setLatestPdfDownload(null)}
                className="px-2.5 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer ml-auto border border-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setLatestPdfDownload(null)}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full shrink-0 transition-colors cursor-pointer -mt-1 -mr-1"
            title="Đóng thông báo"
            aria-label="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
