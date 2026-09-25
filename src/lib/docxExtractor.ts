import JSZip from 'jszip';
import { repairVietnameseDocument, convertTcvn3ToUnicode, hasVietnameseText, rescueVietnameseMathBlocks } from './vietnameseFont';

/**
 * Converts Word OMML (Office Math Markup Language) XML into standard LaTeX math.
 */
export function ommlToLatex(ommlXml: string): string {
  if (!ommlXml) return '';
  let s = ommlXml;

  // Fractions: <m:f>...<m:num>...</m:num>...<m:den>...</m:den>...</m:f>
  s = s.replace(/<m:f\b[^>]*>[\s\S]*?<m:num\b[^>]*>([\s\S]*?)<\/m:num>[\s\S]*?<m:den\b[^>]*>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/g, (_m, num, den) => {
    return `\\frac{${ommlToLatex(num)}}{${ommlToLatex(den)}}`;
  });

  // Radicals: <m:rad>...<m:deg>...</m:deg>...<m:e>...</m:e>...</m:rad>
  s = s.replace(/<m:rad\b[^>]*>[\s\S]*?(?:<m:deg\b[^>]*>([\s\S]*?)<\/m:deg>)?[\s\S]*?<m:e\b[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:rad>/g, (_m, deg, e) => {
    const degText = deg && deg.trim() ? `[${ommlToLatex(deg)}]` : '';
    return `\\sqrt${degText}{${ommlToLatex(e)}}`;
  });

  // Superscript: <m:sSup>...<m:e>...</m:e>...<m:sup>...</m:sup>...</m:sSup>
  s = s.replace(/<m:sSup\b[^>]*>[\s\S]*?<m:e\b[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:sup\b[^>]*>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSup>/g, (_m, e, sup) => {
    return `{${ommlToLatex(e)}}^{${ommlToLatex(sup)}}`;
  });

  // Subscript: <m:sSub>...<m:e>...</m:e>...<m:sub>...</m:sub>...</m:sSub>
  s = s.replace(/<m:sSub\b[^>]*>[\s\S]*?<m:e\b[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub\b[^>]*>([\s\S]*?)<\/m:sub>[\s\S]*?<\/m:sSub>/g, (_m, e, sub) => {
    return `{${ommlToLatex(e)}}_{${ommlToLatex(sub)}}`;
  });

  // Sub-Superscript: <m:sSubSup>...<m:e>...</m:e>...<m:sub>...</m:sub>...<m:sup>...</m:sup>...</m:sSubSup>
  s = s.replace(/<m:sSubSup\b[^>]*>[\s\S]*?<m:e\b[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub\b[^>]*>([\s\S]*?)<\/m:sub>[\s\S]*?<m:sup\b[^>]*>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSubSup>/g, (_m, e, sub, sup) => {
    return `{${ommlToLatex(e)}}_{${ommlToLatex(sub)}}^{${ommlToLatex(sup)}}`;
  });

  // Limits / Lower bounds: <m:limLow>...<m:e>...</m:e>...<m:lim>...</m:lim>...</m:limLow>
  s = s.replace(/<m:limLow\b[^>]*>[\s\S]*?<m:e\b[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:lim\b[^>]*>([\s\S]*?)<\/m:lim>[\s\S]*?<\/m:limLow>/g, (_m, e, lim) => {
    return `\\lim_{${ommlToLatex(lim)}} {${ommlToLatex(e)}}`;
  });

  // Accents / Vectors / Bar / Arc: <m:acc>...<m:accPr><m:chr m:val="→"/>...</m:accPr><m:e>...</m:e>...</m:acc>
  s = s.replace(/<m:acc\b[^>]*>[\s\S]*?<m:accPr\b[^>]*>(?:<m:chr\s+m:val="([^"]*)")?[\s\S]*?<\/m:accPr>[\s\S]*?<m:e\b[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:acc>/g, (_m, chr, e) => {
    const inner = ommlToLatex(e);
    if (chr === '→' || chr === '⃗') return `\\vec{${inner}}`;
    if (chr === '̅' || chr === '¯') return `\\overline{${inner}}`;
    if (chr === '^' || chr === '̂') return `\\widehat{${inner}}`;
    if (chr === '⌒' || chr === '⌢' || chr === '⏜' || chr === '⏠' || chr === '˘' || chr === '︶') return `\\overgroup{${inner}}`;
    return `\\vec{${inner}}`;
  });

  // Functions: <m:func>...<m:fName>...</m:fName>...<m:e>...</m:e>...</m:func>
  s = s.replace(/<m:func\b[^>]*>[\s\S]*?<m:fName\b[^>]*>([\s\S]*?)<\/m:fName>[\s\S]*?<m:e\b[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:func>/g, (_m, fName, e) => {
    return `${ommlToLatex(fName)} ${ommlToLatex(e)}`;
  });

  // Delimiters / Parentheses / Braces / Systems of equations: <m:d>...<m:e>...</m:e>...</m:d>
  s = s.replace(/<m:d\b[^>]*>([\s\S]*?)<\/m:d>/g, (_m, dContent) => {
    const begMatch = dContent.match(/<m:begChr\s+m:val="([^"]*)"/);
    const endMatch = dContent.match(/<m:endChr\s+m:val="([^"]*)"/);
    const beg = begMatch ? begMatch[1] : '(';
    const end = endMatch ? endMatch[1] : ')';
    
    // Check if inner content is an equation array (<m:eqArr>) inside a left brace -> \begin{cases}
    if (beg === '{' && (!end || end === '}' || end === '')) {
      const eqArrMatch = dContent.match(/<m:eqArr\b[^>]*>([\s\S]*?)<\/m:eqArr>/);
      if (eqArrMatch) {
        const eMatches = eqArrMatch[1].match(/<m:e\b[^>]*>([\s\S]*?)<\/m:e>/g) || [];
        const lines = eMatches.map(em => ommlToLatex(em)).filter(Boolean);
        return `\\begin{cases} ${lines.join(' \\\\ ')} \\end{cases}`;
      }
    }

    const eMatches = dContent.match(/<m:e\b[^>]*>([\s\S]*?)<\/m:e>/g) || [];
    const inner = eMatches.map(em => ommlToLatex(em)).join(', ');

    if (beg === '{' && (!end || end === '}' || end === '')) {
      return `\\left\\{ ${inner} \\right.`;
    }
    return `\\left${beg || '.'} ${inner} \\right${end || '.'}`;
  });

  // N-ary: Integrals, Sums, Products: <m:nary>
  s = s.replace(/<m:nary\b[^>]*>([\s\S]*?)<\/m:nary>/g, (_m, naryContent) => {
    const chrMatch = naryContent.match(/<m:chr\s+m:val="([^"]*)"/);
    const chr = chrMatch ? chrMatch[1] : '∫';
    let op = '\\int';
    if (chr === '∑' || chr.includes('sum')) op = '\\sum';
    else if (chr === '∏') op = '\\prod';
    else if (chr === '∬') op = '\\iint';
    else if (chr === '∭') op = '\\iiint';

    const subMatch = naryContent.match(/<m:sub\b[^>]*>([\s\S]*?)<\/m:sub>/);
    const supMatch = naryContent.match(/<m:sup\b[^>]*>([\s\S]*?)<\/m:sup>/);
    const eMatch = naryContent.match(/<m:e\b[^>]*>([\s\S]*?)<\/m:e>/);

    const sub = subMatch ? `_{${ommlToLatex(subMatch[1])}}` : '';
    const sup = supMatch ? `^{${ommlToLatex(supMatch[1])}}` : '';
    const e = eMatch ? ommlToLatex(eMatch[1]) : '';
    return `${op}${sub}${sup} ${e}`;
  });

  // Matrices: <m:m>
  s = s.replace(/<m:m\b[^>]*>([\s\S]*?)<\/m:m>/g, (_m, mContent) => {
    const rows: string[] = [];
    const mrMatches = mContent.match(/<m:mr\b[^>]*>([\s\S]*?)<\/m:mr>/g) || [];
    for (const mr of mrMatches) {
      const eMatches = mr.match(/<m:e\b[^>]*>([\s\S]*?)<\/m:e>/g) || [];
      const cells = eMatches.map(em => ommlToLatex(em)).join(' & ');
      rows.push(cells);
    }
    return `\\begin{matrix} ${rows.join(' \\\\ ')} \\end{matrix}`;
  });

  // Equation Arrays: <m:eqArr>
  s = s.replace(/<m:eqArr\b[^>]*>([\s\S]*?)<\/m:eqArr>/g, (_m, arrContent) => {
    const eMatches = arrContent.match(/<m:e\b[^>]*>([\s\S]*?)<\/m:e>/g) || [];
    const lines = eMatches.map(em => ommlToLatex(em)).filter(Boolean);
    return `\\begin{aligned} ${lines.join(' \\\\ ')} \\end{aligned}`;
  });

  // Extract text runs inside math: <m:t>
  s = s.replace(/<m:t\b[^>]*>(.*?)<\/m:t>/g, (_m, text) => {
    // Convert common Word Math unicode symbols to LaTeX equivalents
    return text
      .replace(/∞/g, '\\infty ')
      .replace(/≤/g, '\\le ')
      .replace(/≥/g, '\\ge ')
      .replace(/≠/g, '\\neq ')
      .replace(/±/g, '\\pm ')
      .replace(/×/g, '\\times ')
      .replace(/÷/g, '\\div ')
      .replace(/∈/g, '\\in ')
      .replace(/∉/g, '\\notin ')
      .replace(/⊂/g, '\\subset ')
      .replace(/∪/g, '\\cup ')
      .replace(/∩/g, '\\cap ')
      .replace(/∅/g, '\\emptyset ')
      .replace(/∀/g, '\\forall ')
      .replace(/∃/g, '\\exists ')
      .replace(/⇒/g, '\\Rightarrow ')
      .replace(/⇔/g, '\\Leftrightarrow ')
      .replace(/→/g, '\\to ')
      .replace(/α/g, '\\alpha ')
      .replace(/β/g, '\\beta ')
      .replace(/γ/g, '\\gamma ')
      .replace(/θ/g, '\\theta ')
      .replace(/π/g, '\\pi ')
      .replace(/Δ/g, '\\Delta ')
      .replace(/⊥/g, '\\perp ')
      .replace(/∥/g, '\\parallel ');
  });

  // Clean remaining XML tags
  s = s.replace(/<[^>]+>/g, '');
  // Normalize arc commands to standard KaTeX \overgroup
  s = s.replace(/\\overparen\{([^}]+)\}/g, '\\overgroup{$1}');
  s = s.replace(/\\wideparen\{([^}]+)\}/g, '\\overgroup{$1}');
  s = s.replace(/\\arc\{([^}]+)\}/g, '\\overgroup{$1}');
  return s.trim();
}

/**
 * Extracts a single paragraph XML (<w:p>) into clean Markdown with LaTeX math,
 * superscripts, subscripts, tabs, and linebreaks.
 */
function parseDocxParagraph(pXml: string, imageMap?: Record<string, string>): string {
  if (!pXml) return '';

  // Check heading style
  const headingMatch = pXml.match(/<w:pStyle\s+w:val="Heading(\d)"/i) 
    || pXml.match(/<w:pStyle\s+w:val="TieuDe(\d)?"/i)
    || pXml.match(/<w:pStyle\s+w:val="Title"/i);

  let prefix = '';
  if (headingMatch) {
    if (headingMatch[0].toLowerCase().includes('title')) {
      prefix = '# ';
    } else {
      const level = parseInt(headingMatch[1] || '1', 10);
      prefix = `${'#'.repeat(Math.min(Math.max(level, 1), 4))} `;
    }
  }

  // Check list bullet or numbered item
  const hasNumPr = /<w:numPr\b/i.test(pXml);
  if (!prefix && hasNumPr) {
    prefix = '- ';
  }

  // Parse runs and tokens inside paragraph sequentially
  // Tokens include: <m:oMathPara>, <m:oMath>, <w:r>, <w:tab/>, <w:br/>, <w:drawing>, <w:txbxContent>
  const tokenRegex = /<m:oMathPara\b[\s\S]*?<\/m:oMathPara>|<m:oMath\b[\s\S]*?<\/m:oMath>|<w:r\b[\s\S]*?<\/w:r>|<w:tab\b[^>]*\/?>|<w:br\b[^>]*\/?>|<w:cr\b[^>]*\/?>|<w:drawing\b[\s\S]*?<\/w:drawing>|<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/g;

  const tokens = pXml.match(tokenRegex) || [];
  const parts: string[] = [];

  for (const token of tokens) {
    // 1. Math Paragraph (Display math)
    if (token.startsWith('<m:oMathPara')) {
      const mathLatex = ommlToLatex(token);
      if (mathLatex) {
        if (hasVietnameseText(mathLatex) && mathLatex.trim().includes(' ')) {
          parts.push(`\n\n${rescueVietnameseMathBlocks(mathLatex)}\n\n`);
        } else {
          parts.push(`\n\n$$ ${mathLatex} $$\n\n`);
        }
      }
      continue;
    }

    // 2. Inline Math
    if (token.startsWith('<m:oMath')) {
      const mathLatex = ommlToLatex(token);
      if (mathLatex) {
        if (hasVietnameseText(mathLatex) && mathLatex.trim().includes(' ')) {
          parts.push(` ${rescueVietnameseMathBlocks(mathLatex)} `);
        } else {
          parts.push(` $${mathLatex}$ `);
        }
      }
      continue;
    }

    // 3. Tab character
    if (token.startsWith('<w:tab')) {
      parts.push('    ');
      continue;
    }

    // 4. Line break
    if (token.startsWith('<w:br') || token.startsWith('<w:cr')) {
      parts.push('\n');
      continue;
    }

    // 5. Embedded image
    if (token.startsWith('<w:drawing')) {
      if (imageMap) {
        const blipMatch = token.match(/<a:blip\b[^>]*r:embed="([^"]+)"/i) || token.match(/r:embed="([^"]+)"/i);
        const rId = blipMatch ? blipMatch[1] : '';
        if (rId && imageMap[rId]) {
          parts.push(`\n\n![Hình minh họa](${imageMap[rId]})\n\n`);
        }
      }
      continue;
    }

    // 6. Textbox content
    if (token.startsWith('<w:txbxContent')) {
      const subTMatches = token.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const boxText = subTMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ').trim();
      if (boxText) {
        parts.push(`\n\n> 💡 **Khung ghi chú:** ${boxText}\n\n`);
      }
      continue;
    }

    // 7. Word Run (<w:r>)
    if (token.startsWith('<w:r')) {
      // Check formatting: superscript, subscript, bold, italic
      const isSuper = /<w:vertAlign\s+w:val="superscript"/i.test(token);
      const isSub = /<w:vertAlign\s+w:val="subscript"/i.test(token);
      const isBold = /<w:b\b/i.test(token);
      const isItalic = /<w:i\b/i.test(token);

      // Check inner math or tabs inside run
      if (/<w:tab\b/i.test(token)) {
        parts.push('    ');
      }

      // Extract all text inside run
      const tMatches = Array.from(token.matchAll(/<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g));
      for (const tm of tMatches) {
        let text = tm[2] || '';
        // Unescape XML entities
        text = text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");

        if (text) {
          if (isSuper) {
            // If superscript is numeric or short, wrap as math exponent
            parts.push(`^{${text.trim()}}`);
          } else if (isSub) {
            parts.push(`_{${text.trim()}}`);
          } else if (isBold && isItalic) {
            parts.push(`***${text}***`);
          } else if (isBold && text.trim().length > 0) {
            parts.push(`**${text}**`);
          } else if (isItalic && text.trim().length > 0) {
            parts.push(`*${text}*`);
          } else {
            parts.push(text);
          }
        }
      }
    }
  }

  const rawLine = parts.join('');
  if (!rawLine.trim()) return '';

  return `${prefix}${rawLine}`.trim();
}

/**
 * Extracts a Word Table (<w:tbl>) into a valid Markdown table.
 */
function parseDocxTable(tblXml: string, imageMap?: Record<string, string>): string {
  if (!tblXml) return '';

  const rows: string[][] = [];
  const trMatches = tblXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || [];

  for (const tr of trMatches) {
    const rowCells: string[] = [];
    const tcMatches = tr.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) || [];

    for (const tc of tcMatches) {
      // Each cell can have multiple paragraphs
      const pMatches = tc.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
      const cellParagraphs: string[] = [];

      for (const p of pMatches) {
        const pText = parseDocxParagraph(p, imageMap);
        if (pText) cellParagraphs.push(pText);
      }

      // If no paragraphs matched, fallback to raw text tags
      if (cellParagraphs.length === 0) {
        const tMatches = tc.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        const rawT = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ').trim();
        cellParagraphs.push(rawT);
      }

      let cellCombined = cellParagraphs.join(' <br> ').trim();
      // Replace pipe characters inside cell content to avoid breaking markdown table
      cellCombined = cellCombined.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
      rowCells.push(cellCombined || ' ');
    }

    if (rowCells.length > 0) {
      rows.push(rowCells);
    }
  }

  if (rows.length === 0) return '';

  const colCount = Math.max(...rows.map(r => r.length));
  const normalizedRows = rows.map(r => {
    while (r.length < colCount) r.push(' ');
    return `| ${r.join(' | ')} |`;
  });

  const separator = `| ${Array(colCount).fill('---').join(' | ')} |`;
  return `\n\n${normalizedRows[0]}\n${separator}\n${normalizedRows.slice(1).join('\n')}\n\n`;
}

/**
 * Extracts 100% of the content from a DOCX document buffer,
 * preserving Word Equations (OMML to LaTeX), Tables, Lists, Superscripts, Textboxes, and Images.
 */
export async function extractDocxFullContent(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      return '';
    }

    const docXml = await docXmlFile.async('string');
    if (!docXml) return '';

    // Step 1: Load image relationships from word/_rels/document.xml.rels if available
    const imageMap: Record<string, string> = {};
    const relsFile = zip.file('word/_rels/document.xml.rels');
    if (relsFile) {
      try {
        const relsXml = await relsFile.async('string');
        const relMatches = Array.from(relsXml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/gi));
        for (const rm of relMatches) {
          const id = rm[1];
          const target = rm[2];
          if (/\.(png|jpeg|jpg|gif|svg|webp)$/i.test(target)) {
            const cleanPath = target.startsWith('media/') ? `word/${target}` : (target.startsWith('/') ? target.slice(1) : `word/${target}`);
            const imgFile = zip.file(cleanPath);
            if (imgFile) {
              const imgBuffer = await imgFile.async('nodebuffer');
              const ext = target.split('.').pop()?.toLowerCase() || 'png';
              const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
              imageMap[id] = `data:${mime};base64,${imgBuffer.toString('base64')}`;
            }
          }
        }
      } catch (relsErr) {
        console.warn('Could not extract images from docx rels:', relsErr);
      }
    }

    // Step 2: Extract document body content
    const bodyMatch = docXml.match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/);
    const bodyXml = bodyMatch ? bodyMatch[1] : docXml;

    // Step 3: Match top-level blocks (<w:p> and <w:tbl>) in exact sequential document order
    const blockRegex = /<w:p\b[\s\S]*?<\/w:p>|<w:tbl\b[\s\S]*?<\/w:tbl>/g;
    const blocks = bodyXml.match(blockRegex) || [];

    const outputLines: string[] = [];

    for (const block of blocks) {
      if (block.startsWith('<w:tbl')) {
        // Table element
        const tableMd = parseDocxTable(block, imageMap);
        if (tableMd) {
          outputLines.push(tableMd);
        }
      } else if (block.startsWith('<w:p')) {
        // Paragraph element
        const pText = parseDocxParagraph(block, imageMap);
        if (pText) {
          outputLines.push(pText);
        } else {
          outputLines.push('');
        }
      }
    }

    // Fallback: If for any reason no blocks were matched, parse all paragraphs
    if (outputLines.length === 0) {
      const pMatches = docXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
      for (const p of pMatches) {
        const pText = parseDocxParagraph(p, imageMap);
        if (pText) outputLines.push(pText);
      }
    }

    const fullRaw = outputLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    // Sửa phông chữ tiếng Việt (TCVN3 / .VnTime, VNI Windows) và công thức toán học
    const repaired = repairVietnameseDocument(fullRaw);
    return convertTcvn3ToUnicode(repaired);
  } catch (err) {
    console.warn("extractDocxFullContent error:", err);
    return '';
  }
}
