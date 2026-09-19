import React, { useState } from 'react';
import { BookOpen, Sparkles, ChevronDown, ChevronUp, Lightbulb, Edit3, Award } from 'lucide-react';
import MathText from '../MathText';
import { QuestionReference } from '../../types/test';

interface QuestionReferenceBadgeProps {
  reference?: QuestionReference;
  defaultExpanded?: boolean;
  className?: string;
  allowToggle?: boolean;
}

export default function QuestionReferenceBadge({
  reference,
  defaultExpanded = false,
  className = '',
  allowToggle = true,
}: QuestionReferenceBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!reference) return null;

  const {
    topic,
    curriculumLesson,
    cognitiveLevel,
    competency,
    coreKnowledge,
    variationGuide
  } = reference;

  // Determine color styling for cognitive levels
  const getLevelBadge = (level?: string) => {
    if (!level) return null;
    const l = level.toLowerCase();
    if (l.includes('nhận biết') || l.includes('nb')) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Nhận biết'
      };
    }
    if (l.includes('thông hiểu') || l.includes('th')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Thông hiểu'
      };
    }
    if (l.includes('vận dụng cao') || l.includes('vdc')) {
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        label: 'Vận dụng cao'
      };
    }
    if (l.includes('vận dụng') || l.includes('vd')) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Vận dụng'
      };
    }
    return {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      label: level
    };
  };

  const levelInfo = getLevelBadge(cognitiveLevel);

  return (
    <div className={`rounded-xl border border-indigo-100 bg-linear-to-r from-indigo-50/70 via-blue-50/50 to-slate-50/80 p-3 shadow-2xs ${className}`}>
      {/* Header Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {levelInfo && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${levelInfo.bg}`}>
              {levelInfo.label}
            </span>
          )}

          {curriculumLesson && (
            <span className="text-xs font-semibold text-indigo-900 bg-white/90 px-2.5 py-0.5 rounded-lg border border-indigo-200/80 flex items-center gap-1.5 shadow-2xs">
              <BookOpen size={12} className="text-indigo-600" />
              <span className="truncate max-w-[280px] sm:max-w-md">{curriculumLesson}</span>
            </span>
          )}

          {topic && !curriculumLesson && (
            <span className="text-xs font-medium text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
              {topic}
            </span>
          )}
        </div>

        {allowToggle && (coreKnowledge || variationGuide || competency) && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <Sparkles size={13} className="text-indigo-600" />
            <span>{isExpanded ? 'Thu gọn tham chiếu' : 'Nội dung tham chiếu & Hướng dẫn sửa đề'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Expanded Pedagogical Reference Details */}
      {(isExpanded || !allowToggle) && (
        <div className="mt-3 pt-3 border-t border-indigo-100/80 space-y-2.5 text-xs text-slate-700">
          {topic && curriculumLesson && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-800 shrink-0 min-w-[120px]">Chủ đề tham chiếu:</span>
              <span className="font-medium text-indigo-950">{topic}</span>
            </div>
          )}

          {competency && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-800 shrink-0 min-w-[120px] flex items-center gap-1">
                <Award size={13} className="text-amber-600" /> Năng lực mục tiêu:
              </span>
              <span className="font-medium text-slate-800">{competency}</span>
            </div>
          )}

          {coreKnowledge && (
            <div className="p-2.5 bg-white/90 rounded-lg border border-indigo-100 shadow-2xs">
              <div className="font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                <Lightbulb size={13} className="text-amber-500" />
                Kiến thức then chốt & Công thức cốt lõi:
              </div>
              <div className="text-slate-800 leading-relaxed font-medium pl-4">
                <MathText content={coreKnowledge} />
              </div>
            </div>
          )}

          {variationGuide && (
            <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200/80 shadow-2xs">
              <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <Edit3 size={13} className="text-amber-700" />
                Gợi ý cho giáo viên khi sửa đề / Thay đổi số liệu:
              </div>
              <div className="text-amber-950 leading-relaxed font-medium pl-4">
                <MathText content={variationGuide} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
