import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calculator, Delete, X, ChevronDown, ChevronUp, Sparkles, Check } from 'lucide-react';
import MathText from '../MathText';

interface MathRadicalInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  showQuickPresets?: boolean;
}

/**
 * Format math expression to LaTeX for MathText preview
 */
export function formatMathForPreview(val: string): string {
  if (!val || typeof val !== 'string') return '';
  let s = val.trim();
  if (!s) return '';
  // Bỏ dấu $ nếu đã có
  s = s.replace(/^\$+|\$+$/g, '').trim();

  // Chuẩn hóa căn bậc 3
  s = s.replace(/\\sqrt\[3\]\s*\{([^{}]+)\}/g, '\\sqrt[3]{$1}');
  s = s.replace(/∛\s*\{([^{}]+)\}/g, '\\sqrt[3]{$1}');
  s = s.replace(/∛\s*\(([^()]+)\)/g, '\\sqrt[3]{$1}');
  s = s.replace(/∛\s*([0-9a-zA-Z.]+)/g, '\\sqrt[3]{$1}');

  // Chuẩn hóa căn bậc 2
  s = s.replace(/√\s*\{([^{}]+)\}/g, '\\sqrt{$1}');
  s = s.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([0-9a-zA-Z.]+)/g, '\\sqrt{$1}');
  s = s.replace(/sqrt\s*\(([^()]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/căn\s*([0-9a-zA-Z.]+)/gi, '\\sqrt{$1}');

  // Chuẩn hóa phân số đơn giản dạng A/B hoặc (A)/B
  const fracMatch = s.match(/^\(?([^/()]+|\([^/()]+\))\)?\s*\/\s*\(?([^/()]+|\([^/()]+\))\)?$/);
  if (fracMatch && !s.includes('\\frac')) {
    const num = fracMatch[1].replace(/^\(|\)$/g, '');
    const den = fracMatch[2].replace(/^\(|\)$/g, '');
    s = `\\frac{${num}}{${den}}`;
  }

  // Chuẩn hóa pi, cộng trừ
  s = s.replace(/π/g, '\\pi');
  s = s.replace(/±/g, '\\pm');
  s = s.replace(/²/g, '^2');
  s = s.replace(/³/g, '^3');

  return `$${s}$`;
}

export default function MathRadicalInput({
  value,
  onChange,
  placeholder = 'Nhập kết quả hoặc đáp số (ví dụ: √2, 2√3, √3/2, 3.5, -1/2)...',
  disabled = false,
  className = '',
  id,
  name,
  showQuickPresets = true
}: MathRadicalInputProps) {
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper chèn chuỗi vào vị trí con trỏ hiện tại
  const insertTextAtCursor = useCallback((prefix: string, suffix: string = '') => {
    if (disabled) return;
    const input = inputRef.current;
    if (!input) {
      onChange(value + prefix + suffix);
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const selectedText = value.substring(start, end);

    let newText = '';
    let newCursorPos = start + prefix.length;

    if (selectedText.length > 0) {
      // Bọc phần text đang bôi đen
      newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      newText = value.substring(0, start) + prefix + suffix + value.substring(end);
      newCursorPos = start + prefix.length;
    }

    onChange(newText);

    // Khôi phục focus và vị trí con trỏ
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  }, [value, onChange, disabled]);

  // Xóa 1 ký tự phía trước con trỏ (Backspace)
  const handleBackspace = useCallback(() => {
    if (disabled || !value) return;
    const input = inputRef.current;
    if (!input) {
      onChange(value.slice(0, -1));
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    if (start !== end) {
      // Có bôi đen -> xóa vùng bôi đen
      const newText = value.substring(0, start) + value.substring(end);
      onChange(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start);
      }, 10);
    } else if (start > 0) {
      // Kiểm tra xem phía trước có phải token căn bậc 2 không "√(" hay "√"
      let deleteLen = 1;
      if (value.substring(start - 2, start) === '√(' || value.substring(start - 2, start) === '∛(') {
        deleteLen = 2;
      }
      const newText = value.substring(0, start - deleteLen) + value.substring(start);
      onChange(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start - deleteLen, start - deleteLen);
      }, 10);
    }
  }, [value, onChange, disabled]);

  // Làm sạch toàn bộ (Clear)
  const handleClear = useCallback(() => {
    if (disabled) return;
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange, disabled]);

  // Các mẫu đáp số căn thường gặp trong đề thi Toán
  const commonRadicalPresets = [
    { label: '√2', val: '√2' },
    { label: '√3', val: '√3' },
    { label: '√5', val: '√5' },
    { label: '2√3', val: '2√3' },
    { label: '3√2', val: '3√2' },
    { label: '√3/2', val: '√3/2' },
    { label: '√2/2', val: '√2/2' },
    { label: '1/√2', val: '1/√2' },
    { label: '-√3', val: '-√3' },
    { label: 'π', val: 'π' },
  ];

  const hasContent = value && value.trim().length > 0;
  const previewFormula = hasContent ? formatMathForPreview(value) : '';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Ô nhập liệu chính */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-3.5 pr-24 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 font-semibold text-base transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400 placeholder:font-normal placeholder:text-gray-400 placeholder:text-sm"
        />

        {/* Nút xóa nhanh và nút bật/tắt bàn phím toán */}
        <div className="absolute right-2 flex items-center gap-1">
          {hasContent && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Xóa ô nhập"
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            disabled={disabled}
            title={showKeypad ? 'Thu gọn bàn phím' : 'Mở bàn phím ký hiệu căn & phân số'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              showKeypad
                ? 'bg-blue-600 text-white shadow-blue-200'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Calculator size={14} className="shrink-0" />
            <span className="hidden sm:inline">Phím căn</span>
            {showKeypad ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Thanh công cụ chèn căn & ký hiệu nhanh (Luôn hiển thị) */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Sparkles size={12} className="text-amber-500" />
            Chèn nhanh:
          </span>

          {/* Nút căn bậc 2: chèn √( */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('√(', ')')}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-2xs hover:shadow-xs flex items-center gap-1"
            title="Chèn căn bậc hai √(x)"
          >
            <span className="text-sm font-extrabold text-amber-700">√</span>
            <span>căn</span>
          </button>

          {/* Nút ký hiệu √ đơn lẻ */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('√')}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-2xs"
            title="Chèn ký hiệu căn √"
          >
            √x
          </button>

          {/* Mẫu a√b (ví dụ 2√3) */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('√')}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Hệ số nhân căn (ví dụ 2√3)"
          >
            a√b
          </button>

          {/* Phân số có căn √a/b */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('√', '/')}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Phân số chứa căn √a / b"
          >
            √a/b
          </button>

          {/* Phân số / */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('/')}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-all active:scale-95"
            title="Dấu phân số (/)"
          >
            a/b
          </button>

          {/* Mũ 2 (bình phương) */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('^2')}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Bình phương (^2)"
          >
            x²
          </button>

          {/* Căn bậc 3 */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('∛(', ')')}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Căn bậc ba ∛(x)"
          >
            ∛x
          </button>

          {/* Ký hiệu Pi */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('π')}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Số Pi (π)"
          >
            π
          </button>

          {/* Ký hiệu ± */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('±')}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Cộng trừ (±)"
          >
            ±
          </button>

          {/* Cặp ngoặc đơn ( ) */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('(', ')')}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Cặp ngoặc đơn ( )"
          >
            ( )
          </button>
        </div>
      )}

      {/* Xem trước công thức toán học hiển thị chuẩn LaTeX */}
      {hasContent && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 animate-fadeIn">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Check size={13} className="text-blue-600" />
            Hiển thị chuẩn:
          </span>
          <div className="font-semibold text-base text-blue-950 flex-1 overflow-x-auto py-0.5">
            <MathText content={previewFormula} />
          </div>
        </div>
      )}

      {/* Bàn phím số & ký hiệu mở rộng (Virtual Math Keypad) */}
      {showKeypad && !disabled && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-3 animate-fadeIn">
          {/* Nhóm căn thức phổ biến */}
          {showQuickPresets && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Các giá trị căn thức hay gặp:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {commonRadicalPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => insertTextAtCursor(preset.val)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lưới bàn phím đầy đủ */}
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 pt-1 border-t border-slate-200/80">
            {/* Hàng 1: Ký hiệu căn & toán học đặc biệt */}
            <button
              type="button"
              onClick={() => insertTextAtCursor('√(', ')')}
              className="p-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl font-bold text-sm shadow-2xs active:scale-95 transition-all text-center"
              title="Căn bậc hai"
            >
              √( )
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('∛(', ')')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-sm shadow-2xs active:scale-95 transition-all text-center"
              title="Căn bậc ba"
            >
              ∛( )
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('/')}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-sm shadow-2xs active:scale-95 transition-all text-center"
              title="Dấu chia / phân số"
            >
              / (phân số)
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('^2')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold text-sm shadow-2xs active:scale-95 transition-all text-center"
              title="Bình phương"
            >
              x²
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('^')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold text-sm shadow-2xs active:scale-95 transition-all text-center"
              title="Mũ n"
            >
              xⁿ
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-sm shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1 col-span-1"
              title="Xóa 1 ký tự"
            >
              <Delete size={16} />
              <span className="hidden sm:inline text-xs">Xóa</span>
            </button>

            {/* Hàng số 7, 8, 9, phép toán */}
            <button
              type="button"
              onClick={() => insertTextAtCursor('7')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('8')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('9')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('+')}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('(')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              (
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor(')')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              )
            </button>

            {/* Hàng số 4, 5, 6, trừ */}
            <button
              type="button"
              onClick={() => insertTextAtCursor('4')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('5')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('6')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('-')}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('*')}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
              title="Dấu nhân"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('π')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
              title="Số Pi"
            >
              π
            </button>

            {/* Hàng số 1, 2, 3, phẩy */}
            <button
              type="button"
              onClick={() => insertTextAtCursor('1')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('2')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('3')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('.')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
              title="Dấu chấm thập phân"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor(',')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
              title="Dấu phẩy"
            >
              ,
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('±')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95"
              title="Cộng trừ"
            >
              ±
            </button>

            {/* Hàng số 0, xóa hết, đóng */}
            <button
              type="button"
              onClick={() => insertTextAtCursor('0')}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-base shadow-2xs active:scale-95 col-span-2"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs shadow-2xs active:scale-95 col-span-2"
              title="Xóa toàn bộ"
            >
              AC (Xóa sạch)
            </button>
            <button
              type="button"
              onClick={() => setShowKeypad(false)}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs active:scale-95 col-span-1 sm:col-span-2 flex items-center justify-center gap-1"
            >
              <Check size={14} />
              <span>Xong</span>
            </button>
          </div>
        </div>
      )}

      {/* Dòng hướng dẫn ngắn gọn cho học sinh */}
      <p className="text-xs text-gray-500 mt-1">
        * Học sinh có thể bấm nút <strong className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">√ căn</strong> để nhập đáp số chứa căn thức (ví dụ: <code className="text-blue-700 font-bold">√2</code>, <code className="text-blue-700 font-bold">2√3</code>, <code className="text-blue-700 font-bold">√3/2</code>, <code className="text-blue-700 font-bold">-1/2</code> hoặc số thập phân <code className="text-blue-700 font-bold">3.5</code>).
      </p>
    </div>
  );
}
