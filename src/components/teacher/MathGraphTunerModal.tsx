import React, { useState, useMemo } from 'react';
import { X, Check, Activity, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { 
  createCubicGraphSvg, 
  createQuarticGraphSvg, 
  createRationalGraphSvg, 
  createParabolaGraphSvg 
} from '../../utils/mathGraphGenerator';

interface MathGraphTunerModalProps {
  show: boolean;
  onClose: () => void;
  onApply: (svg: string, description: string) => void;
  initialSvg?: string;
}

export default function MathGraphTunerModal({
  show,
  onClose,
  onApply
}: MathGraphTunerModalProps) {
  const [graphType, setGraphType] = useState<'cubic' | 'quartic' | 'rational' | 'parabola'>('cubic');

  // 1. Bậc ba: x1, y1, x2, y2
  const [cubicX1, setCubicX1] = useState<number>(-1);
  const [cubicY1, setCubicY1] = useState<number>(2);
  const [cubicX2, setCubicX2] = useState<number>(1);
  const [cubicY2, setCubicY2] = useState<number>(-2);

  // 2. Bậc bốn: x0, yExtremum, yIntercept
  const [quarticX0, setQuarticX0] = useState<number>(1);
  const [quarticYExt, setQuarticYExt] = useState<number>(-2);
  const [quarticYInt, setQuarticYInt] = useState<number>(-1);

  // 3. Phân thức 1/1: vertAsymptote, horizAsymptote, yIntercept
  const [ratVert, setRatVert] = useState<number>(1);
  const [ratHoriz, setRatHoriz] = useState<number>(1);
  const [ratYInt, setRatYInt] = useState<number>(-1);

  // 4. Parabol: vx, vy, openUp, yIntercept
  const [parabVx, setParabVx] = useState<number>(1);
  const [parabVy, setParabVy] = useState<number>(-2);
  const [parabOpenUp, setParabOpenUp] = useState<boolean>(true);
  const [parabYInt, setParabYInt] = useState<number>(-1);

  // Sinh mã SVG theo thời gian thực (100% chuẩn xác theo công thức toán)
  const { generatedSvg, description } = useMemo(() => {
    try {
      if (graphType === 'cubic') {
        const svg = createCubicGraphSvg({
          x1: cubicX1,
          y1: cubicY1,
          x2: cubicX2,
          y2: cubicY2
        });
        return {
          generatedSvg: svg,
          description: `Đồ thị hàm số bậc ba $y = f(x)$ có 2 điểm cực trị (${cubicX1}; ${cubicY1}) và (${cubicX2}; ${cubicY2})`
        };
      } else if (graphType === 'quartic') {
        const svg = createQuarticGraphSvg({
          x0: quarticX0,
          yExtremum: quarticYExt,
          yIntercept: quarticYInt
        });
        return {
          generatedSvg: svg,
          description: `Đồ thị hàm số bậc bốn trùng phương $y = ax^4 + bx^2 + c$`
        };
      } else if (graphType === 'rational') {
        const svg = createRationalGraphSvg({
          vertAsymptote: ratVert,
          horizAsymptote: ratHoriz,
          yIntercept: ratYInt
        });
        return {
          generatedSvg: svg,
          description: `Đồ thị hàm phân thức $y = \\frac{ax+b}{cx+d}$ (TCĐ: $x = ${ratVert}$, TCN: $y = ${ratHoriz}$)`
        };
      } else {
        const svg = createParabolaGraphSvg({
          vx: parabVx,
          vy: parabVy,
          openUp: parabOpenUp,
          yIntercept: parabYInt
        });
        return {
          generatedSvg: svg,
          description: `Đồ thị Parabol $y = ax^2 + bx + c$ có đỉnh $I(${parabVx}; ${parabVy})$`
        };
      }
    } catch {
      return { generatedSvg: '', description: '' };
    }
  }, [
    graphType,
    cubicX1, cubicY1, cubicX2, cubicY2,
    quarticX0, quarticYExt, quarticYInt,
    ratVert, ratHoriz, ratYInt,
    parabVx, parabVy, parabOpenUp, parabYInt
  ]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                Bộ hiệu chỉnh đồ thị Oxy chuẩn xác theo hình gốc
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">100% Chuẩn tọa độ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập số liệu điểm đặc biệt từ đề bài/hình gốc để đồ thị, đường gióng và nhãn số khớp hoàn toàn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left: Configuration Form */}
          <div className="md:col-span-5 p-5 border-b md:border-b-0 md:border-r border-slate-200 space-y-4 bg-slate-50/50">
            {/* Quick Presets */}
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
              <label className="text-[11px] font-bold text-blue-900 block mb-1.5 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                Mẫu nhanh phổ biến (Chuẩn 100% hình gốc SGK / Đề thi):
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setGraphType('parabola');
                    setParabVx(1);
                    setParabVy(4);
                    setParabOpenUp(false);
                    setParabYInt(3);
                  }}
                  className="px-2 py-1 bg-white text-blue-800 rounded-lg text-[11px] font-bold border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors shadow-2xs"
                >
                  y = -x² + 2x + 3 (Cắt Oy tại 3, Ox tại -1 và 3)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGraphType('parabola');
                    setParabVx(1);
                    setParabVy(-2);
                    setParabOpenUp(true);
                    setParabYInt(-1);
                  }}
                  className="px-2 py-1 bg-white text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
                >
                  y = x² - 2x - 1 (Đỉnh I(1; -2))
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGraphType('cubic');
                    setCubicX1(-1);
                    setCubicY1(2);
                    setCubicX2(1);
                    setCubicY2(-2);
                  }}
                  className="px-2 py-1 bg-white text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
                >
                  y = x³ - 3x (Cực trị ±1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGraphType('rational');
                    setRatVert(1);
                    setRatHoriz(1);
                    setRatYInt(-1);
                  }}
                  className="px-2 py-1 bg-white text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
                >
                  y = (x+1)/(x-1) (TCĐ: 1, TCN: 1)
                </button>
              </div>
            </div>

            {/* Function Type Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Loại hàm số đồ thị:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cubic', label: 'Bậc 3: ax³+bx²+cx+d' },
                  { id: 'quartic', label: 'Trùng phương: ax⁴+bx²+c' },
                  { id: 'rational', label: 'Phân thức: (ax+b)/(cx+d)' },
                  { id: 'parabola', label: 'Bậc hai / Parabol' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGraphType(item.id as any)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer border ${
                      graphType === item.id 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs based on type */}
            {graphType === 'cubic' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Tọa độ 2 điểm cực trị:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cực trị 1: Hoành độ x₁</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cubicX1}
                      onChange={(e) => setCubicX1(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cực trị 1: Tung độ y₁</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cubicY1}
                      onChange={(e) => setCubicY1(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cực trị 2: Hoành độ x₂</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cubicX2}
                      onChange={(e) => setCubicX2(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cực trị 2: Tung độ y₂</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cubicY2}
                      onChange={(e) => setCubicY2(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {graphType === 'quartic' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Điểm cực trị và giao điểm Oy:
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Khoảng cách cực trị đối xứng (x = ±x₀)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={quarticX0}
                      onChange={(e) => setQuarticX0(Math.abs(parseFloat(e.target.value)) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tung độ tại ±x₀</label>
                      <input
                        type="number"
                        step="0.5"
                        value={quarticYExt}
                        onChange={(e) => setQuarticYExt(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tung độ tại x = 0</label>
                      <input
                        type="number"
                        step="0.5"
                        value={quarticYInt}
                        onChange={(e) => setQuarticYInt(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {graphType === 'rational' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Tiệm cận & Giao điểm:
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tiệm cận đứng: x = x₀</label>
                      <input
                        type="number"
                        step="0.5"
                        value={ratVert}
                        onChange={(e) => setRatVert(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tiệm cận ngang: y = y₀</label>
                      <input
                        type="number"
                        step="0.5"
                        value={ratHoriz}
                        onChange={(e) => setRatHoriz(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Giao điểm trục Oy: (0; yᵢ)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={ratYInt}
                      onChange={(e) => setRatYInt(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {graphType === 'parabola' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Đỉnh Parabol I(x; y) & Hướng bề lõm:
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hoành độ đỉnh xᵢ</label>
                      <input
                        type="number"
                        step="0.5"
                        value={parabVx}
                        onChange={(e) => setParabVx(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tung độ đỉnh yᵢ</label>
                      <input
                        type="number"
                        step="0.5"
                        value={parabVy}
                        onChange={(e) => setParabVy(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Bề lõm Parabol</label>
                      <select
                        value={parabOpenUp ? 'up' : 'down'}
                        onChange={(e) => setParabOpenUp(e.target.value === 'up')}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      >
                        <option value="up">Quay lên trên (a &gt; 0)</option>
                        <option value="down">Quay xuống dưới (a &lt; 0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cắt trục Oy tại</label>
                      <input
                        type="number"
                        step="0.5"
                        value={parabYInt}
                        onChange={(e) => setParabYInt(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Interactive Vector Preview */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye size={15} className="text-blue-600" />
                  Xem trước hình vẽ vector SVG trực tiếp:
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  Tọa độ (X, Y) khớp 100%
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
                {generatedSvg ? (
                  <div 
                    className="w-full max-w-md mx-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-72 shadow-xs rounded-xl overflow-hidden bg-white border border-slate-200/80"
                    dangerouslySetInnerHTML={{ __html: generatedSvg }}
                  />
                ) : (
                  <div className="text-slate-400 text-xs italic">Đang tính toán vector...</div>
                )}
                <div className="mt-2 text-xs italic text-slate-600 text-center">
                  {description}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (generatedSvg) {
                    onApply(generatedSvg, description);
                    onClose();
                  }
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Check size={16} />
                Áp dụng đồ thị chuẩn xác này
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
