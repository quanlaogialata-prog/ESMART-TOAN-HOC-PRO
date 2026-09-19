import React, { useState } from 'react';
import { Maximize2, X, Table as TableIcon, Image as ImageIcon } from 'lucide-react';
import MathText from '../MathText';

interface QuestionVisualRendererProps {
  figureType?: 'none' | 'svg' | 'table' | 'image' | string;
  figureSvg?: string;
  figureTable?: string;
  figureDescription?: string;
  imageUrl?: string;
  className?: string;
  interactive?: boolean;
}

export default function QuestionVisualRenderer({
  figureType,
  figureSvg,
  figureTable,
  figureDescription,
  imageUrl,
  className = '',
  interactive = true,
}: QuestionVisualRendererProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  // Normalize figure presence: Only render if figureType is not 'none' (or explicit image)
  const isNone = figureType === 'none';
  const hasSvg = !isNone && Boolean(figureSvg && figureSvg.trim().startsWith('<svg'));
  const hasTable = !isNone && Boolean(figureTable && figureTable.trim().length > 0);
  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  if (!hasSvg && !hasTable && !hasImage) {
    return null;
  }

  // Parse markdown-style, delimited, JSON, or HTML table into rows & cells
  const renderTableContent = (tableText: string) => {
    if (!tableText) return null;
    const rawTrimmed = tableText.trim();

    // 1. If HTML table, render safely
    if (rawTrimmed.startsWith('<table') && rawTrimmed.endsWith('</table>')) {
      return (
        <div 
          className="overflow-x-auto my-2 border border-slate-300 rounded-xl bg-white shadow-xs p-3 text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:text-center"
          dangerouslySetInnerHTML={{ __html: rawTrimmed }}
        />
      );
    }

    // 2. Try JSON table format { headers: [...], rows: [...] }
    let parsedRows: string[][] = [];
    if (rawTrimmed.startsWith('{') || rawTrimmed.startsWith('[')) {
      try {
        const json = JSON.parse(rawTrimmed);
        if (Array.isArray(json)) {
          parsedRows = json.map(r => Array.isArray(r) ? r.map(String) : [String(r)]);
        } else if (json && typeof json === 'object') {
          if (Array.isArray(json.headers)) parsedRows.push(json.headers.map(String));
          if (Array.isArray(json.rows)) {
            json.rows.forEach((r: any) => {
              if (Array.isArray(r)) parsedRows.push(r.map(String));
            });
          }
        }
      } catch (e) {}
    }

    // 3. Markdown or pipe / tab delimited parser
    if (parsedRows.length === 0) {
      const rawLines = rawTrimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      for (const line of rawLines) {
        // Skip separator lines like |---|---| or +---+---+
        if (/^[|+:\-\s]+$/.test(line) && line.includes('-')) continue;

        let clean = line;
        if (clean.startsWith('|')) clean = clean.substring(1);
        if (clean.endsWith('|')) clean = clean.substring(0, clean.length - 1);

        const cells = clean.includes('|') 
          ? clean.split('|').map(c => c.trim())
          : (clean.includes('\t') ? clean.split('\t').map(c => c.trim()) : [clean]);

        // If cells are not just markdown separator dashes
        if (cells.some(c => c.length > 0 && !/^:?-+:?$/.test(c))) {
          parsedRows.push(cells);
        }
      }
    }

    if (parsedRows.length === 0) return null;

    // Detect if this is a Function Variation Table (Bảng biến thiên: rows labeled x, y', y, f'(x), f(x))
    const firstColLabels = parsedRows.map(r => (r[0] || '').replace(/[\$\s]/g, '').toLowerCase());
    const isVariationTable = firstColLabels.some(l => 
      l === 'x' || l === "y'" || l === 'y' || l === "f'(x)" || l === 'f(x)' || l.includes('đạo hàm')
    );

    return (
      <div className="overflow-x-auto my-2 border border-slate-300 rounded-xl bg-white shadow-xs">
        <table className="w-full text-center border-collapse text-sm min-w-[340px]">
          <tbody>
            {parsedRows.map((row, rIdx) => {
              const isHeaderRow = !isVariationTable && rIdx === 0;

              return (
                <tr 
                  key={rIdx} 
                  className={rIdx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}
                >
                  {row.map((cell, cIdx) => {
                    const isFirstCol = cIdx === 0;
                    const isUndefinedBar = cell === '||' || cell === '$||$' || cell === '|||';

                    // Ensure LaTeX variation symbols (nearrow, searrow, infty, etc.) inside cells are wrapped in $
                    let formattedCell = cell;
                    if (!isUndefinedBar) {
                      formattedCell = formattedCell.replace(/(?<!\$)\\?(nearrow|searrow|uparrow|downarrow|infty|pm|mp)\b(?!\$)/g, '$\\$1$');
                    }

                    return (
                      <td
                        key={cIdx}
                        className={`px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-300 text-slate-800 ${
                          isHeaderRow || (isVariationTable && isFirstCol)
                            ? 'font-bold bg-slate-100/90 border-r-2 border-r-slate-400 text-slate-900'
                            : 'text-slate-700'
                        }`}
                      >
                        {isUndefinedBar ? (
                          <span className="inline-flex items-center justify-center gap-1 font-bold text-slate-500 tracking-tighter text-base select-none px-1" title="Không xác định">
                            <span className="w-0.5 h-6 bg-slate-400 inline-block"></span>
                            <span className="w-0.5 h-6 bg-slate-400 inline-block"></span>
                          </span>
                        ) : (
                          <MathText content={formattedCell} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`my-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/90 ${className}`}>
      {/* Description / Caption header */}
      {figureDescription && (
        <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-slate-600">
          {hasTable ? (
            <TableIcon size={14} className="text-emerald-600 shrink-0" />
          ) : (
            <ImageIcon size={14} className="text-blue-600 shrink-0" />
          )}
          <span className="italic"><MathText content={figureDescription} /></span>
        </div>
      )}

      {/* SVG Vector Drawing */}
      {hasSvg && figureSvg && (
        <div className="relative group text-center bg-white p-3 rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col items-center justify-center">
          <div 
            className="w-full max-w-md mx-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-72"
            dangerouslySetInnerHTML={{ __html: figureSvg }} 
          />
          {interactive && (
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-600 hover:text-blue-600 p-1.5 rounded-lg border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 font-medium cursor-pointer"
              title="Phóng to hình vẽ"
            >
              <Maximize2 size={13} /> Xem lớn
            </button>
          )}
        </div>
      )}

      {/* Markdown / Statistical / Variation Table */}
      {hasTable && figureTable && (
        <div className="text-center">
          {renderTableContent(figureTable)}
        </div>
      )}

      {/* Uploaded or linked Image */}
      {hasImage && imageUrl && (
        <div className="relative group text-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <img 
            src={imageUrl} 
            alt={figureDescription || "Hình vẽ câu hỏi"} 
            className="max-w-full h-auto max-h-72 mx-auto rounded object-contain"
          />
          {interactive && (
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-600 hover:text-blue-600 p-1.5 rounded-lg border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 font-medium cursor-pointer"
              title="Phóng to ảnh"
            >
              <Maximize2 size={13} /> Xem lớn
            </button>
          )}
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-600" />
                {figureDescription ? <MathText content={figureDescription} /> : 'Hình vẽ / Bảng biểu minh họa'}
              </h4>
              <button 
                type="button"
                onClick={() => setIsZoomed(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-center items-center py-4">
              {hasSvg && figureSvg && (
                <div 
                  className="w-full max-w-xl mx-auto [&>svg]:w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: figureSvg }} 
                />
              )}
              {hasTable && figureTable && (
                <div className="w-full">
                  {renderTableContent(figureTable)}
                </div>
              )}
              {hasImage && imageUrl && (
                <img 
                  src={imageUrl} 
                  alt={figureDescription || "Hình vẽ"} 
                  className="max-w-full h-auto max-h-[70vh] rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
