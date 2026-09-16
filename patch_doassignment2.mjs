import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const regex1 = /if \(!assignmentId\) return;\n      const assignSnap = await getDoc\(doc\(db, 'assignments', assignmentId\)\);/;
const replace1 = `if (!assignmentId) return;

      // Check existing submission
      if (user?.email) {
        const subQ = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId), where('studentEmail', '==', user.email));
        const subSnap = await getDocs(subQ);
        if (!subSnap.empty) {
          const subData = subSnap.docs[0].data();
          setSubmitted(true);
          setResult(subData);
          
          // Pre-fill answers from submission
          const prevAnswers: any = {};
          if (subData.feedback) {
            subData.feedback.forEach((fb: any) => {
              if (fb.studentAnswer) {
                prevAnswers[fb.questionId] = fb.studentAnswer;
              }
            });
          }
          setAnswers(prevAnswers);
        }
      }

      const assignSnap = await getDoc(doc(db, 'assignments', assignmentId));`;

content = content.replace(regex1, replace1);

// Add missing imports in DoAssignment.tsx if necessary (query, where, getDocs)
if (!content.includes('getDocs')) {
    content = content.replace(/import \{ collection, addDoc, doc, getDoc \} from 'firebase\/firestore';/, "import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';");
} else {
    // If it's already there, make sure it has what we need
    content = content.replace(/import \{([^}]+)\} from 'firebase\/firestore';/, (match, p1) => {
        let imports = p1.split(',').map(s => s.trim());
        if (!imports.includes('query')) imports.push('query');
        if (!imports.includes('where')) imports.push('where');
        if (!imports.includes('getDocs')) imports.push('getDocs');
        return `import { ${imports.join(', ')} } from 'firebase/firestore';`;
    });
}

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log("Patched DoAssignment.tsx for existing submissions");
