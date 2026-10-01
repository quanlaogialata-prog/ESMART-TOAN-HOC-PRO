import { 
  createCubicGraphSvg, 
  createQuarticGraphSvg, 
  createRationalGraphSvg, 
  createParabolaGraphSvg 
} from './mathGraphGenerator';

export interface MathFigureTemplate {
  id: string;
  name: string;
  category: 'geometry' | 'graph' | 'table';
  figureType: 'svg' | 'table';
  figureSvg?: string;
  figureTable?: string;
  figureDescription: string;
}

export const MATH_FIGURE_TEMPLATES: MathFigureTemplate[] = [
  {
    id: 'pyramid_sabc',
    name: 'Hình chóp S.ABC (SA ⊥ đáy)',
    category: 'geometry',
    figureType: 'svg',
    figureDescription: 'Hình chóp S.ABC có SA vuông góc với đáy (ABC)',
    figureSvg: `<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-w-md mx-auto">
  <rect width="360" height="260" fill="#f8fafc" rx="8"/>
  <!-- Nét đứt cho cạnh khuất AC -->
  <line x1="70" y1="210" x2="290" y2="200" stroke="#64748b" stroke-width="1.8" stroke-dasharray="5,4" />
  <!-- Đáy ABC -->
  <line x1="70" y1="210" x2="170" y2="240" stroke="#0f172a" stroke-width="2" />
  <line x1="170" y1="240" x2="290" y2="200" stroke="#0f172a" stroke-width="2" />
  <!-- Chiều cao SA -->
  <line x1="70" y1="210" x2="70" y2="40" stroke="#0f172a" stroke-width="2.2" />
  <!-- Ký hiệu góc vuông tại A -->
  <polyline points="70,195 85,195 85,210" fill="none" stroke="#2563eb" stroke-width="1.5" />
  <!-- Các cạnh bên SB, SC -->
  <line x1="70" y1="40" x2="170" y2="240" stroke="#0f172a" stroke-width="2" />
  <line x1="70" y1="40" x2="290" y2="200" stroke="#0f172a" stroke-width="2" />
  <!-- Điểm và Tên đỉnh -->
  <circle cx="70" cy="40" r="3.5" fill="#2563eb" />
  <circle cx="70" cy="210" r="3.5" fill="#2563eb" />
  <circle cx="170" cy="240" r="3.5" fill="#2563eb" />
  <circle cx="290" cy="200" r="3.5" fill="#2563eb" />
  <text x="65" y="30" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">S</text>
  <text x="48" y="218" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">A</text>
  <text x="170" y="258" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">B</text>
  <text x="300" y="206" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">C</text>
</svg>`
  },
  {
    id: 'pyramid_sabcd',
    name: 'Hình chóp tứ giác S.ABCD (SA ⊥ đáy)',
    category: 'geometry',
    figureType: 'svg',
    figureDescription: 'Hình chóp S.ABCD có đáy ABCD là hình bình hành/hình chữ nhật, SA vuông góc với đáy',
    figureSvg: `<svg viewBox="0 0 380 270" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-w-md mx-auto">
  <rect width="380" height="270" fill="#f8fafc" rx="8"/>
  <!-- Nét đứt đáy AD, CD và cạnh bên SD -->
  <line x1="80" y1="200" x2="220" y2="180" stroke="#64748b" stroke-width="1.8" stroke-dasharray="5,4" />
  <line x1="220" y1="180" x2="330" y2="200" stroke="#64748b" stroke-width="1.8" stroke-dasharray="5,4" />
  <line x1="80" y1="40" x2="220" y2="180" stroke="#64748b" stroke-width="1.8" stroke-dasharray="5,4" />
  <!-- Nét liền đáy AB, BC -->
  <line x1="80" y1="200" x2="190" y2="245" stroke="#0f172a" stroke-width="2" />
  <line x1="190" y1="245" x2="330" y2="200" stroke="#0f172a" stroke-width="2" />
  <!-- Chiều cao SA -->
  <line x1="80" y1="200" x2="80" y2="40" stroke="#0f172a" stroke-width="2.2" />
  <!-- Ký hiệu góc vuông -->
  <polyline points="80,185 95,185 95,200" fill="none" stroke="#2563eb" stroke-width="1.5" />
  <!-- Cạnh bên SB, SC -->
  <line x1="80" y1="40" x2="190" y2="245" stroke="#0f172a" stroke-width="2" />
  <line x1="80" y1="40" x2="330" y2="200" stroke="#0f172a" stroke-width="2" />
  <!-- Đỉnh -->
  <circle cx="80" cy="40" r="3.5" fill="#2563eb" />
  <circle cx="80" cy="200" r="3.5" fill="#2563eb" />
  <circle cx="190" cy="245" r="3.5" fill="#2563eb" />
  <circle cx="330" cy="200" r="3.5" fill="#2563eb" />
  <circle cx="220" cy="180" r="3" fill="#64748b" />
  <text x="75" y="30" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">S</text>
  <text x="58" y="210" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">A</text>
  <text x="190" y="262" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">B</text>
  <text x="340" y="206" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">C</text>
  <text x="225" y="175" font-family="sans-serif" font-weight="bold" font-size="16" fill="#475569">D</text>
</svg>`
  },
  {
    id: 'prism_triangular',
    name: 'Hình lăng trụ đứng tam giác ABC.A\'B\'C\'',
    category: 'geometry',
    figureType: 'svg',
    figureDescription: 'Lăng trụ đứng tam giác ABC.A\'B\'C\'',
    figureSvg: `<svg viewBox="0 0 360 280" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-w-md mx-auto">
  <rect width="360" height="280" fill="#f8fafc" rx="8"/>
  <!-- Nét đứt đáy dưới AC -->
  <line x1="80" y1="230" x2="280" y2="210" stroke="#64748b" stroke-width="1.8" stroke-dasharray="5,4" />
  <!-- Đáy dưới AB, BC -->
  <line x1="80" y1="230" x2="180" y2="260" stroke="#0f172a" stroke-width="2" />
  <line x1="180" y1="260" x2="280" y2="210" stroke="#0f172a" stroke-width="2" />
  <!-- Đáy trên A'B'C' -->
  <line x1="80" y1="80" x2="280" y2="60" stroke="#0f172a" stroke-width="2" />
  <line x1="80" y1="80" x2="180" y2="110" stroke="#0f172a" stroke-width="2" />
  <line x1="180" y1="110" x2="280" y2="60" stroke="#0f172a" stroke-width="2" />
  <!-- Cạnh bên AA', BB', CC' -->
  <line x1="80" y1="230" x2="80" y2="80" stroke="#0f172a" stroke-width="2" />
  <line x1="180" y1="260" x2="180" y2="110" stroke="#0f172a" stroke-width="2" />
  <line x1="280" y1="210" x2="280" y2="60" stroke="#0f172a" stroke-width="2" />
  <!-- Điểm và chữ cái -->
  <text x="60" y="75" font-family="sans-serif" font-weight="bold" font-size="15" fill="#1e293b">A'</text>
  <text x="180" y="128" font-family="sans-serif" font-weight="bold" font-size="15" fill="#1e293b">B'</text>
  <text x="290" y="65" font-family="sans-serif" font-weight="bold" font-size="15" fill="#1e293b">C'</text>
  <text x="60" y="240" font-family="sans-serif" font-weight="bold" font-size="15" fill="#1e293b">A</text>
  <text x="180" y="278" font-family="sans-serif" font-weight="bold" font-size="15" fill="#1e293b">B</text>
  <text x="290" y="218" font-family="sans-serif" font-weight="bold" font-size="15" fill="#1e293b">C</text>
</svg>`
  },
  {
    id: 'graph_cubic_std',
    name: 'Đồ thị bậc ba y = x³ - 3x (CĐ: (-1; 2), CT: (1; -2))',
    category: 'graph',
    figureType: 'svg',
    figureDescription: 'Đồ thị hàm số bậc ba y = f(x) có điểm cực đại (-1; 2) và cực tiểu (1; -2)',
    figureSvg: createCubicGraphSvg({ x1: -1, y1: 2, x2: 1, y2: -2 })
  },
  {
    id: 'graph_cubic_inv',
    name: 'Đồ thị bậc ba y = -x³ + 3x (CT: (-1; -2), CĐ: (1; 2))',
    category: 'graph',
    figureType: 'svg',
    figureDescription: 'Đồ thị hàm số bậc ba y = f(x) có điểm cực tiểu (-1; -2) và cực đại (1; 2)',
    figureSvg: createCubicGraphSvg({ x1: -1, y1: -2, x2: 1, y2: 2 })
  },
  {
    id: 'graph_quartic_w',
    name: 'Đồ thị bậc bốn trùng phương chữ W (y = x⁴ - 2x² - 1)',
    category: 'graph',
    figureType: 'svg',
    figureDescription: 'Đồ thị hàm số bậc bốn trùng phương y = f(x) dạng chữ W',
    figureSvg: createQuarticGraphSvg({ x0: 1, yExtremum: -2, yIntercept: -1 })
  },
  {
    id: 'graph_quartic_m',
    name: 'Đồ thị bậc bốn trùng phương chữ M (y = -x⁴ + 2x² + 1)',
    category: 'graph',
    figureType: 'svg',
    figureDescription: 'Đồ thị hàm số bậc bốn trùng phương y = f(x) dạng chữ M',
    figureSvg: createQuarticGraphSvg({ x0: 1, yExtremum: 2, yIntercept: 1 })
  },
  {
    id: 'graph_rational',
    name: 'Đồ thị phân thức y = (x+1)/(x-1) (TCĐ: x=1, TCN: y=1)',
    category: 'graph',
    figureType: 'svg',
    figureDescription: 'Đồ thị hàm số phân thức hữu tỉ y = f(x) với tiệm cận đứng x = 1 và tiệm cận ngang y = 1',
    figureSvg: createRationalGraphSvg({ vertAsymptote: 1, horizAsymptote: 1, yIntercept: -1 })
  },
  {
    id: 'graph_parabola',
    name: 'Đồ thị Parabol y = x² - 2x - 1 (Đỉnh I(1; -2))',
    category: 'graph',
    figureType: 'svg',
    figureDescription: 'Đồ thị Parabol y = ax² + bx + c có đỉnh I(1; -2)',
    figureSvg: createParabolaGraphSvg({ vx: 1, vy: -2, yIntercept: -1, openUp: true })
  },
  {
    id: 'graph_parabola_inv',
    name: 'Đồ thị Parabol y = -x² + 2x + 3 (Đỉnh I(1; 4), cắt Oy tại 3, cắt Ox tại -1 và 3)',
    category: 'graph',
    figureType: 'svg',
    figureDescription: 'Đồ thị hàm số bậc hai y = -x² + 2x + 3 có đỉnh I(1; 4), cắt trục tung tại y = 3 và cắt trục hoành tại x = -1, x = 3',
    figureSvg: createParabolaGraphSvg({ vx: 1, vy: 4, yIntercept: 3, openUp: false })
  },
  {
    id: 'table_variation_cubic',
    name: 'Bảng biến thiên hàm số bậc ba',
    category: 'table',
    figureType: 'table',
    figureDescription: 'Bảng biến thiên của hàm số y = f(x)',
    figureTable: `| $x$ | $-\\infty$ | | $-1$ | | $1$ | | $+\\infty$ |
|---|---|---|---|---|---|---|---|
| $f'(x)$ | | $+$ | $0$ | $-$ | $0$ | $+$ | |
| $f(x)$ | $-\\infty$ | $\\nearrow$ | $2$ | $\\searrow$ | $-2$ | $\\nearrow$ | $+\\infty$ |`
  },
  {
    id: 'table_variation_fraction',
    name: 'Bảng biến thiên hàm phân thức bậc 1/1',
    category: 'table',
    figureType: 'table',
    figureDescription: 'Bảng biến thiên hàm số nhất biến y = (ax+b)/(cx+d)',
    figureTable: `| $x$ | $-\\infty$ | | $1$ | | $+\\infty$ |
|---|---|---|---|---|---|
| $y'$ | | $-$ | $\\|$ | $-$ | |
| $y$ | $1$ | $\\searrow$ | $-\\infty \\quad \\| \\quad +\\infty$ | $\\searrow$ | $1$ |`
  },
  {
    id: 'table_statistics_grouped',
    name: 'Bảng số liệu thống kê ghép nhóm',
    category: 'table',
    figureType: 'table',
    figureDescription: 'Bảng phân bố tần số của mẫu số liệu ghép nhóm',
    figureTable: `| Nhóm điểm | $[0; 2)$ | $[2; 4)$ | $[4; 6)$ | $[6; 8)$ | $[8; 10]$ |
|---|---|---|---|---|---|
| Tần số ($n_i$) | $3$ | $7$ | $15$ | $18$ | $7$ |
| Giá trị đại diện ($c_i$) | $1$ | $3$ | $5$ | $7$ | $9$ |`
  }
];
