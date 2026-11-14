import React, { useState } from 'react';
import { Maximize2, X, Table as TableIcon, Image as ImageIcon } from 'lucide-react';
import MathText, { MathTableRenderer } from '../MathText';
import { healMathSvg, cleanHtmlAndSvgContainers } from '../../lib/vietnameseFont';

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

  // Parse markdown-style, delimited, JSON, or HTML table into MathTableRenderer
  const renderTableContent = (tableText: string) => {
    if (!tableText) return null;
    const rawTrimmed = tableText.trim();

    // 1. If HTML table, convert to Markdown pipe table via cleanHtmlAndSvgContainers and render with MathTableRenderer
    if (rawTrimmed.startsWith('<table') && rawTrimmed.endsWith('</table>')) {
      const converted = cleanHtmlAndSvgContainers(rawTrimmed);
      if (converted.includes('|')) {
        return <MathTableRenderer rawTable={converted} />;
      }
      return (
        <div 
          className="overflow-x-auto my-2 border border-slate-300 rounded-xl bg-white shadow-xs p-3 text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:text-center"
          dangerouslySetInnerHTML={{ __html: rawTrimmed }}
        />
      );
    }

    // 2. Try JSON table format { headers: [...], rows: [...] }
    if (rawTrimmed.startsWith('{') || rawTrimmed.startsWith('[')) {
      try {
        const json = JSON.parse(rawTrimmed);
        const parsedRows: string[][] = [];
        if (Array.isArray(json)) {
          json.forEach(r => parsedRows.push(Array.isArray(r) ? r.map(String) : [String(r)]));
        } else if (json && typeof json === 'object') {
          if (Array.isArray(json.headers)) parsedRows.push(json.headers.map(String));
          if (Array.isArray(json.rows)) {
            json.rows.forEach((r: any) => {
              if (Array.isArray(r)) parsedRows.push(r.map(String));
            });
          }
        }
        if (parsedRows.length > 0) {
          const mdPipe = parsedRows.map(r => `| ${r.join(' | ')} |`).join('\n');
          return <MathTableRenderer rawTable={mdPipe} />;
        }
      } catch (e) {}
    }

    // 3. If tab-delimited without pipes, convert to pipe table
    if (!rawTrimmed.includes('|') && rawTrimmed.includes('\t')) {
      const mdPipe = rawTrimmed
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => `| ${l.split('\t').map(c => c.trim()).join(' | ')} |`)
        .join('\n');
      return <MathTableRenderer rawTable={mdPipe} />;
    }

    // 4. Standard Markdown pipe table (including Bảng xét dấu & Bảng biến thiên)
    return <MathTableRenderer rawTable={rawTrimmed} />;
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
            dangerouslySetInnerHTML={{ __html: healMathSvg(figureSvg) }} 
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
                  dangerouslySetInnerHTML={{ __html: healMathSvg(figureSvg) }} 
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
