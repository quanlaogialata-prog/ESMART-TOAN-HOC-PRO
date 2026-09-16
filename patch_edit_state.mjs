import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Add editingElementId state
content = content.replace(
  'const [activeElementId, setActiveElementId] = useState<string | null>(null);',
  'const [activeElementId, setActiveElementId] = useState<string | null>(null);\n  const [editingElementId, setEditingElementId] = useState<string | null>(null);'
);

// clear canvas logic
content = content.replace(
  'setActiveElementId(null);',
  'setActiveElementId(null);\n    setEditingElementId(null);'
);
// replace multiple occurrences maybe. Let's do it strategically.

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched 1');
