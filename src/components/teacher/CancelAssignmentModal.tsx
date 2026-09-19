import React from 'react';
import { AlertTriangle, Trash2, X, Calendar, Users, Clock, FileText } from 'lucide-react';

interface CancelAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  submissionCount: number;
  studentCount: number;
  onConfirmCancel: (assignmentId: string) => Promise<void>;
  isProcessing: boolean;
}

export default function CancelAssignmentModal({
  isOpen,
  onClose,
  assignment,
  submissionCount,
  studentCount,
  onConfirmCancel,
  isProcessing
}: CancelAssignmentModalProps) {
  if (!isOpen || !assignment) return null;

  const isOverdue = assignment.dueDate ? new Date(assignment.dueDate).getTime() < Date.now() : false;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ngày ${d.toLocaleDateString('vi-VN')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-70 animate-in fade-in duration-150"
      onClick={() => !isProcessing && onClose()}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Xác nhận hủy giao bài</h2>
              <p className="text-xs text-rose-700 font-medium">Gỡ bài kiểm tra đã giao khỏi danh sách học sinh</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {/* Assignment Info Card */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
            <div className="flex items-start gap-2">
              <FileText size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 font-semibold block uppercase">Bài kiểm tra</span>
                <span className="font-bold text-gray-800 text-base">{assignment.testTitle || 'Bài kiểm tra'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200/80">
              <div>
                <span className="text-xs text-gray-500 block">Lớp nhận bài:</span>
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <Users size={14} className="text-blue-600" />
                  Lớp {assignment.className}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Tiến độ nộp bài:</span>
                <span className={`font-bold inline-flex items-center gap-1 ${submissionCount > 0 ? 'text-amber-700' : 'text-gray-600'}`}>
                  {submissionCount} / {studentCount || 0} học sinh
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Thời gian giao:</span>
                <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
                  <Clock size={12} className="text-gray-400" />
                  {formatDate(assignment.assignedDate || assignment.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Hạn nộp bài:</span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? 'text-rose-600' : 'text-gray-700'}`}>
                  <Calendar size={12} className={isOverdue ? 'text-rose-500' : 'text-gray-400'} />
                  {formatDate(assignment.dueDate)} {isOverdue && '(Đã hết hạn)'}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {submissionCount > 0 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                Cảnh báo quan trọng: Đã có {submissionCount} học sinh nộp bài!
              </p>
              <p>
                Khi xác nhận hủy giao bài, hệ thống sẽ <strong>gỡ hoàn toàn bài tập này</strong> khỏi tài khoản của học sinh lớp <strong>{assignment.className}</strong>.
              </p>
              <p className="text-amber-950 font-medium">
                Đồng thời, toàn bộ <strong>{submissionCount} bài làm đã nộp</strong> cùng điểm số liên quan của đợt giao này sẽ bị xóa vĩnh viễn để tránh sai lệch dữ liệu.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs leading-relaxed">
              <p className="font-semibold text-blue-800 mb-1">Thông tin hủy giao bài:</p>
              <p>
                Bài tập sẽ được gỡ khỏi danh sách &quot;Bài tập cần làm&quot; của học sinh lớp <strong>{assignment.className}</strong>. Đề thi gốc vẫn được giữ nguyên vẹn trong kho đề của bạn.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Quay lại
          </button>

          <button
            type="button"
            onClick={() => onConfirmCancel(assignment.id)}
            disabled={isProcessing}
            className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang hủy giao...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Xác nhận hủy giao bài</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
