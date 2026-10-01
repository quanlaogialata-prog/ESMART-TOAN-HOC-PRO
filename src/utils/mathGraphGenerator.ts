/**
 * Bộ công cụ tạo hình vẽ đồ thị hàm số Oxy chuẩn xác 100% về mặt toán học.
 * Đảm bảo:
 * 1. Tọa độ (x, y) quy đổi sang pixel (X, Y) chuẩn xác theo công thức:
 *    X = X_O + x * S
 *    Y = Y_O - y * S  (trục Y hướng lên trên)
 * 2. Đường cong hàm số f(x) đi qua CHÍNH XÁC các điểm đặc biệt (cực trị, giao điểm, đỉnh, tiệm cận).
 * 3. Điểm đánh dấu, đường gióng nét đứt và nhãn số trên trục tọa độ trùng khớp tuyệt đối, không lệch dù chỉ 1 pixel.
 */

export interface Point2D {
  x: number;
  y: number;
  label?: string;
  showDashed?: boolean; // Vẽ đường gióng vuông góc xuống Ox và Oy
  pointColor?: string;
  labelPos?: 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface GraphConfig {
  width?: number;
  height?: number;
  xRange?: [number, number]; // [minX, maxX]
  yRange?: [number, number]; // [minY, maxY]
  grid?: boolean;
  axisStroke?: string;
  curveStroke?: string;
  curveWidth?: number;
  originLabel?: string;
  title?: string;
}

export class MathGraphBuilder {
  private width: number;
  private height: number;
  private xMin: number;
  private xMax: number;
  private yMin: number;
  private yMax: number;
  private originX: number;
  private originY: number;
  private scaleX: number;
  private scaleY: number;

  constructor(cfg?: GraphConfig) {
    this.width = cfg?.width || 380;
    this.height = cfg?.height || 260;
    this.xMin = cfg?.xRange?.[0] ?? -4;
    this.xMax = cfg?.xRange?.[1] ?? 4;
    this.yMin = cfg?.yRange?.[0] ?? -3.5;
    this.yMax = cfg?.yRange?.[1] ?? 3.5;

    // Tính toán scale và gốc tọa độ
    const paddingX = 35;
    const paddingY = 25;
    const plotWidth = this.width - 2 * paddingX;
    const plotHeight = this.height - 2 * paddingY;

    this.scaleX = plotWidth / (this.xMax - this.xMin);
    this.scaleY = plotHeight / (this.yMax - this.yMin);

    // Gốc tọa độ O (x=0, y=0) trong không gian SVG pixel
    this.originX = paddingX + (0 - this.xMin) * this.scaleX;
    this.originY = paddingY + (this.yMax - 0) * this.scaleY;
  }

  // Chuyển đổi tọa độ toán học (x, y) sang pixel SVG (X, Y)
  public toSvg(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.round((this.originX + x * this.scaleX) * 10) / 10,
      y: Math.round((this.originY - y * this.scaleY) * 10) / 10
    };
  }

  // Lấy gốc O pixel
  public getOrigin(): { x: number; y: number } {
    return { x: this.originX, y: this.originY };
  }

  // Tạo phần nền và hệ trục tọa độ Oxy chuẩn mực
  public renderAxes(cfg?: { showGrid?: boolean; axisLabels?: number[] }): string {
    const o = this.getOrigin();
    const arrowDef = `
    <defs>
      <marker id="math-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
      </marker>
    </defs>`;

    let gridLines = '';
    if (cfg?.showGrid) {
      for (let x = Math.ceil(this.xMin); x <= Math.floor(this.xMax); x++) {
        if (x === 0) continue;
        const p = this.toSvg(x, 0);
        gridLines += `<line x1="${p.x}" y1="15" x2="${p.x}" y2="${this.height - 15}" stroke="#f1f5f9" stroke-width="1" />\n`;
      }
      for (let y = Math.ceil(this.yMin); y <= Math.floor(this.yMax); y++) {
        if (y === 0) continue;
        const p = this.toSvg(0, y);
        gridLines += `<line x1="15" y1="${p.y}" x2="${this.width - 15}" y2="${p.y}" stroke="#f1f5f9" stroke-width="1" />\n`;
      }
    }

    const oxY = Math.max(20, Math.min(this.height - 20, o.y));
    const oyX = Math.max(20, Math.min(this.width - 20, o.x));

    const axes = `
  <!-- Trục hoành Ox -->
  <line x1="20" y1="${oxY}" x2="${this.width - 15}" y2="${oxY}" stroke="#1e293b" stroke-width="1.8" marker-end="url(#math-arrow)" />
  <text x="${this.width - 12}" y="${oxY + 16}" font-family="sans-serif" font-style="italic" font-weight="bold" font-size="14" fill="#1e293b">x</text>

  <!-- Trục tung Oy -->
  <line x1="${oyX}" y1="${this.height - 15}" x2="${oyX}" y2="15" stroke="#1e293b" stroke-width="1.8" marker-end="url(#math-arrow)" />
  <text x="${oyX - 16}" y="18" font-family="sans-serif" font-style="italic" font-weight="bold" font-size="14" fill="#1e293b">y</text>

  <!-- Gốc tọa độ O -->
  <text x="${oyX - 12}" y="${oxY + 15}" font-family="sans-serif" font-weight="bold" font-size="13" fill="#64748b">O</text>`;

    return arrowDef + (gridLines ? `\n  <!-- Grid -->\n  ${gridLines}` : '') + axes;
  }

  // Vẽ các điểm đặc trưng, đường gióng nét đứt và nhãn tọa độ trùng khớp 100%
  public renderPoints(points: Point2D[]): string {
    const o = this.getOrigin();
    let res = '';

    for (const pt of points) {
      const p = this.toSvg(pt.x, pt.y);
      const col = pt.pointColor || '#2563eb';

      // 1. Đường gióng nét đứt vuông góc
      if (pt.showDashed !== false) {
        // Gióng xuống Ox nếu không nằm trên Ox
        if (Math.abs(pt.y) > 0.05) {
          res += `  <line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${o.y}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />\n`;
          // Nhãn số x trên trục Ox
          const xText = pt.x % 1 === 0 ? pt.x.toString() : pt.x.toFixed(1);
          res += `  <text x="${p.x}" y="${o.y + (pt.y > 0 ? 14 : -6)}" text-anchor="middle" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">${xText}</text>\n`;
        }
        // Gióng sang Oy nếu không nằm trên Oy
        if (Math.abs(pt.x) > 0.05) {
          res += `  <line x1="${p.x}" y1="${p.y}" x2="${o.x}" y2="${p.y}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />\n`;
          // Nhãn số y trên trục Oy
          const yText = pt.y % 1 === 0 ? pt.y.toString() : pt.y.toFixed(1);
          res += `  <text x="${o.x + (pt.x > 0 ? -6 : 8)}" y="${p.y + 4}" text-anchor="${pt.x > 0 ? 'end' : 'start'}" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">${yText}</text>\n`;
        }
      } else {
        // Điểm nằm trực tiếp trên các trục tọa độ
        if (Math.abs(pt.y) <= 0.05 && Math.abs(pt.x) > 0.05) {
          // Nằm trên Ox: ghi nhãn số ở dưới trục Ox
          const xText = pt.x % 1 === 0 ? pt.x.toString() : pt.x.toFixed(1);
          res += `  <text x="${p.x}" y="${o.y + 14}" text-anchor="middle" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">${xText}</text>\n`;
        } else if (Math.abs(pt.x) <= 0.05 && Math.abs(pt.y) > 0.05) {
          // Nằm trên Oy: ghi nhãn số ở bên trái trục Oy
          const yText = pt.y % 1 === 0 ? pt.y.toString() : pt.y.toFixed(1);
          res += `  <text x="${o.x - 7}" y="${p.y + 4}" text-anchor="end" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">${yText}</text>\n`;
        }
      }

      // 2. Chấm tròn điểm tọa độ
      res += `  <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${col}" stroke="#ffffff" stroke-width="1.2" />\n`;

      // 3. Nhãn chữ cái tùy chọn (ví dụ: A, B, I, CĐ, CT)
      if (pt.label) {
        let lx = p.x + 8;
        let ly = p.y - 8;
        if (pt.labelPos === 'bottom') { lx = p.x; ly = p.y + 16; }
        else if (pt.labelPos === 'top') { lx = p.x; ly = p.y - 10; }
        else if (pt.labelPos === 'left') { lx = p.x - 12; ly = p.y + 4; }
        else if (pt.labelPos === 'right') { lx = p.x + 10; ly = p.y + 4; }
        else if (pt.labelPos === 'top-left') { lx = p.x - 10; ly = p.y - 8; }
        else if (pt.labelPos === 'bottom-left') { lx = p.x - 10; ly = p.y + 14; }
        else if (pt.labelPos === 'bottom-right') { lx = p.x + 8; ly = p.y + 14; }

        res += `  <text x="${lx}" y="${ly}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b">${pt.label}</text>\n`;
      }
    }

    return res;
  }

  // Lấy đường cong hàm số toán học y = f(x) dưới dạng <path>
  public renderFunctionPath(
    fn: (x: number) => number | null, 
    opt?: { color?: string; width?: number; samples?: number; xRange?: [number, number]; keyPoints?: number[] }
  ): string {
    const col = opt?.color || '#2563eb';
    const strokeWidth = opt?.width || 2.5;
    const samples = opt?.samples || 240;
    const [startSpan, endSpan] = opt?.xRange || [this.xMin, this.xMax];

    const step = (endSpan - startSpan) / samples;
    const rawXList: number[] = [];
    for (let i = 0; i <= samples; i++) {
      rawXList.push(startSpan + i * step);
    }
    if (opt?.keyPoints && opt.keyPoints.length > 0) {
      for (const kp of opt.keyPoints) {
        if (typeof kp === 'number' && !isNaN(kp) && kp >= startSpan && kp <= endSpan) {
          rawXList.push(kp);
        }
      }
    }
    // Sắp xếp tăng dần và loại bỏ các x trùng lặp rất gần nhau (< 0.0001)
    rawXList.sort((a, b) => a - b);
    const sortedX: number[] = [];
    for (const x of rawXList) {
      if (sortedX.length === 0 || Math.abs(x - sortedX[sortedX.length - 1]) > 0.0001) {
        sortedX.push(x);
      }
    }

    const segments: Array<Array<{ x: number; y: number }>> = [];
    let currentSegment: Array<{ x: number; y: number }> = [];

    for (const x of sortedX) {
      let y: number | null = null;
      try {
        y = fn(x);
      } catch {
        y = null;
      }

      if (y === null || isNaN(y) || !isFinite(y) || y < this.yMin - 3 || y > this.yMax + 3) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
        continue;
      }

      const p = this.toSvg(x, y);
      currentSegment.push(p);
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    let pathCommands = '';
    for (const seg of segments) {
      if (seg.length < 2) continue;
      let d = `M ${seg[0].x} ${seg[0].y}`;
      for (let j = 1; j < seg.length; j++) {
        d += ` L ${seg[j].x} ${seg[j].y}`;
      }
      pathCommands += `  <path d="${d}" fill="none" stroke="${col}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    }

    return pathCommands;
  }

  // Vẽ đường tiệm cận (đứng x = x0 hoặc ngang y = y0 hoặc xiên y = ax + b)
  public renderAsymptote(
    type: 'vertical' | 'horizontal' | 'slant', 
    val: number | { a: number; b: number }, 
    opt?: { label?: string; color?: string }
  ): string {
    const col = opt?.color || '#ef4444';
    let res = '';

    if (type === 'vertical') {
      const x = typeof val === 'number' ? val : 0;
      const p = this.toSvg(x, 0);
      res = `  <!-- Tiệm cận đứng x = ${x} -->\n  <line x1="${p.x}" y1="20" x2="${p.x}" y2="${this.height - 20}" stroke="${col}" stroke-width="1.4" stroke-dasharray="4,3" />\n`;
      if (opt?.label) {
        res += `  <text x="${p.x + 4}" y="35" font-family="sans-serif" font-size="11" font-weight="600" fill="${col}">${opt.label}</text>\n`;
      }
    } else if (type === 'horizontal') {
      const y = typeof val === 'number' ? val : 0;
      const p = this.toSvg(0, y);
      res = `  <!-- Tiệm cận ngang y = ${y} -->\n  <line x1="20" y1="${p.y}" x2="${this.width - 20}" y2="${p.y}" stroke="${col}" stroke-width="1.4" stroke-dasharray="4,3" />\n`;
      if (opt?.label) {
        res += `  <text x="25" y="${p.y - 4}" font-family="sans-serif" font-size="11" font-weight="600" fill="${col}">${opt.label}</text>\n`;
      }
    } else if (type === 'slant' && typeof val === 'object') {
      const { a, b } = val;
      const p1 = this.toSvg(this.xMin, a * this.xMin + b);
      const p2 = this.toSvg(this.xMax, a * this.xMax + b);
      res = `  <!-- Tiệm cận xiên y = ${a}x + ${b} -->\n  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${col}" stroke-width="1.4" stroke-dasharray="4,3" />\n`;
    }

    return res;
  }

  // Đóng gói thành chuỗi SVG vector hoàn chỉnh, hợp lệ, tự chứa
  public toSvgString(content: string): string {
    return `<svg viewBox="0 0 ${this.width} ${this.height}" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-w-md mx-auto">
  <rect width="${this.width}" height="${this.height}" fill="#ffffff" rx="8" />
${content}
</svg>`;
  }
}

/**
 * Các hàm tạo nhanh đồ thị phổ biến chuẩn xác 100% theo chương trình THCS & THPT:
 */

// 1. Đồ thị hàm bậc ba: y = ax^3 + bx^2 + cx + d
export function createCubicGraphSvg(params: {
  x1: number; y1: number; // Điểm cực trị 1
  x2: number; y2: number; // Điểm cực trị 2
  yIntercept?: number;    // Giao điểm trục Oy (tùy chọn)
  title?: string;
}): string {
  const { x1, y1, x2, y2 } = params;
  // Tính hệ số chính xác: f'(x) = 3a(x - x1)(x - x2) = 3a[x^2 - (x1+x2)x + x1*x2]
  // f(x) = a[x^3 - 1.5*(x1+x2)*x^2 + 3*x1*x2*x] + d
  // f(x1) - f(x2) = a * [ ... ]
  const deltaX = x1 - x2;
  const a = deltaX !== 0 ? (2 * (y2 - y1)) / Math.pow(x1 - x2, 3) : 1;
  const d = y1 - a * (Math.pow(x1, 3) - 1.5 * (x1 + x2) * Math.pow(x1, 2) + 3 * x1 * x2 * x1);

  const fn = (x: number) => a * (Math.pow(x, 3) - 1.5 * (x1 + x2) * Math.pow(x, 2) + 3 * x1 * x2 * x) + d;

  const minX = Math.min(x1, x2) - 1.8;
  const maxX = Math.max(x1, x2) + 1.8;
  const minY = Math.min(y1, y2, 0) - 1.5;
  const maxY = Math.max(y1, y2, 0) + 1.5;

  const builder = new MathGraphBuilder({
    xRange: [Math.min(minX, -3), Math.max(maxX, 3)],
    yRange: [Math.min(minY, -3), Math.max(maxY, 3)]
  });

  const points: Point2D[] = [
    { x: x1, y: y1, pointColor: '#dc2626', showDashed: true },
    { x: x2, y: y2, pointColor: '#dc2626', showDashed: true }
  ];

  const y0 = fn(0);
  if (Math.abs(y0) > 0.05 && Math.abs(y0 - y1) > 0.3 && Math.abs(y0 - y2) > 0.3) {
    points.push({ x: 0, y: y0, pointColor: '#2563eb', showDashed: false });
  }

  let body = builder.renderAxes({ showGrid: false });
  body += builder.renderFunctionPath(fn, { keyPoints: [x1, x2, 0] });
  body += builder.renderPoints(points);

  return builder.toSvgString(body);
}

// 2. Đồ thị hàm bậc bốn trùng phương: y = ax^4 + bx^2 + c
export function createQuarticGraphSvg(params: {
  x0: number; // Điểm cực trị đối xứng (x = ±x0)
  yExtremum: number; // Giá trị cực trị tại ±x0
  yIntercept: number; // Giá trị cực trị tại x = 0 (cực trị giữa)
  title?: string;
}): string {
  const { x0, yExtremum, yIntercept } = params;
  const absX0 = Math.abs(x0) || 1;
  // f'(x) = 4ax(x^2 - x0^2) => f(x) = a*x^4 - 2a*x0^2*x^2 + c
  // Tại x = x0: a*x0^4 - 2a*x0^4 + c = yExtremum => -a*x0^4 + c = yExtremum => a = (c - yExtremum)/x0^4
  const c = yIntercept;
  const a = (c - yExtremum) / Math.pow(absX0, 4);

  const fn = (x: number) => a * Math.pow(x, 4) - 2 * a * Math.pow(absX0, 2) * Math.pow(x, 2) + c;

  const minX = -absX0 - 1.5;
  const maxX = absX0 + 1.5;
  const minY = Math.min(yExtremum, c, 0) - 1.5;
  const maxY = Math.max(yExtremum, c, 0) + 1.5;

  const builder = new MathGraphBuilder({
    xRange: [Math.min(minX, -3.5), Math.max(maxX, 3.5)],
    yRange: [Math.min(minY, -3.5), Math.max(maxY, 3.5)]
  });

  const points: Point2D[] = [
    { x: -absX0, y: yExtremum, pointColor: '#dc2626', showDashed: true },
    { x: absX0, y: yExtremum, pointColor: '#dc2626', showDashed: true },
    { x: 0, y: c, pointColor: '#dc2626', showDashed: false }
  ];

  let body = builder.renderAxes({ showGrid: false });
  body += builder.renderFunctionPath(fn, { keyPoints: [-absX0, 0, absX0] });
  body += builder.renderPoints(points);

  return builder.toSvgString(body);
}

// 3. Đồ thị hàm phân thức bậc 1/1: y = (ax+b)/(cx+d)
export function createRationalGraphSvg(params: {
  vertAsymptote: number;  // Tiệm cận đứng x = x0
  horizAsymptote: number; // Tiệm cận ngang y = y0
  yIntercept: number;     // Giao điểm trục Oy (0, y_i)
  title?: string;
}): string {
  const { vertAsymptote: x0, horizAsymptote: y0, yIntercept: yi } = params;
  // y = y0 + k / (x - x0)
  // Tại x = 0: yi = y0 + k / (-x0) => k = -x0 * (yi - y0)
  const k = -x0 * (yi - y0) || 1;

  const fn = (x: number) => {
    if (Math.abs(x - x0) < 0.05) return null;
    return y0 + k / (x - x0);
  };

  const builder = new MathGraphBuilder({
    xRange: [Math.min(x0 - 3.5, -4), Math.max(x0 + 3.5, 4)],
    yRange: [Math.min(y0 - 3.5, -4), Math.max(y0 + 3.5, 4)]
  });

  const points: Point2D[] = [
    { x: 0, y: yi, pointColor: '#2563eb', showDashed: true }
  ];

  // Giao điểm Ox: y = 0 => 0 = y0 + k / (x - x0) => x - x0 = -k/y0 => x = x0 - k/y0
  if (Math.abs(y0) > 0.05) {
    const xi = x0 - k / y0;
    if (Math.abs(xi) > 0.1 && Math.abs(xi) < 6) {
      points.push({ x: Math.round(xi * 10) / 10, y: 0, pointColor: '#2563eb', showDashed: false });
    }
  }

  let body = builder.renderAxes({ showGrid: false });
  body += builder.renderAsymptote('vertical', x0, { label: `x = ${x0}` });
  body += builder.renderAsymptote('horizontal', y0, { label: `y = ${y0}` });
  body += builder.renderFunctionPath(fn, { xRange: [builder['xMin'], x0 - 0.08] });
  body += builder.renderFunctionPath(fn, { xRange: [x0 + 0.08, builder['xMax']] });
  body += builder.renderPoints(points);

  return builder.toSvgString(body);
}

// 4. Đồ thị Parabol bậc hai: y = ax^2 + bx + c
export function createParabolaGraphSvg(params: {
  vx: number; // Đỉnh hoành độ
  vy: number; // Đỉnh tung độ
  yIntercept?: number;
  openUp?: boolean;
}): string {
  const { vx, vy, yIntercept, openUp = true } = params;
  let a = openUp ? 1 : -1;
  if (yIntercept !== undefined && vx !== 0) {
    a = (yIntercept - vy) / Math.pow(vx, 2);
  }

  const fn = (x: number) => a * Math.pow(x - vx, 2) + vy;

  const points: Point2D[] = [
    { x: vx, y: vy, pointColor: '#2563eb', showDashed: true }
  ];

  // Giao điểm trục tung Oy
  const y0 = fn(0);
  if (Math.abs(vx) > 0.05 && Math.abs(y0) < 10) {
    points.push({ x: 0, y: Math.round(y0 * 10) / 10, pointColor: '#2563eb', showDashed: false });
  }

  // Giao điểm trục hoành Ox (nghiệm phương trình y = 0)
  let root1: number | null = null;
  let root2: number | null = null;
  const underRadical = -vy / a;
  if (underRadical > 0.01) {
    const r = Math.sqrt(underRadical);
    root1 = Math.round((vx - r) * 10) / 10;
    root2 = Math.round((vx + r) * 10) / 10;
    points.push({ x: root1, y: 0, pointColor: '#2563eb', showDashed: false });
    points.push({ x: root2, y: 0, pointColor: '#2563eb', showDashed: false });
  }

  const minX = Math.min(vx - 2.5, root1 !== null ? root1 - 1.2 : -3.5, -3.5);
  const maxX = Math.max(vx + 2.5, root2 !== null ? root2 + 1.2 : 3.5, 3.5);
  const minY = Math.min(vy, 0, y0) - 1.5;
  const maxY = Math.max(vy, 0, y0) + 1.5;

  const builder = new MathGraphBuilder({
    xRange: [minX, maxX],
    yRange: [minY, maxY]
  });

  const keyPoints: number[] = [vx, 0];
  if (root1 !== null) keyPoints.push(root1);
  if (root2 !== null) keyPoints.push(root2);

  let body = builder.renderAxes({ showGrid: false });
  body += builder.renderFunctionPath(fn, { keyPoints });
  body += builder.renderPoints(points);

  return builder.toSvgString(body);
}
