import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const regex1 = /testData\.fileUrl = "data:text\/html;base64," \+ encodeBase64\("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi<\/title><script type='text\/x-mathjax-config'>MathJax\.Hub\.Config\(\{tex2jax: \{inlineMath: \[\[' \+ splitData\.cleanTestHtml \+ "<\/body><\/html>"\);/g;
const replace1 = `testData.fileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\\\\\(','\\\\\\\\)']], displayMath: [['$$$$','$$$$'], ['\\\\\\\\[','\\\\\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.cleanTestHtml + "</body></html>");`;

const regex2 = /testData\.answerFileUrl = "data:text\/html;base64," \+ encodeBase64\("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án<\/title><script type='text\/x-mathjax-config'>MathJax\.Hub\.Config\(\{tex2jax: \{inlineMath: \[\[' \+ splitData\.answersHtml \+ "<\/body><\/html>"\);/g;
const replace2 = `testData.answerFileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\\\\\(','\\\\\\\\)']], displayMath: [['$$$$','$$$$'], ['\\\\\\\\[','\\\\\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.answersHtml + "</body></html>");`;

content = content.replace(regex1, replace1);
content = content.replace(regex2, replace2);

// Fix $ replacing issue. Wait, if I use a string, `$` is interpreted. Let's use a function for replacement.
const regexFix = /testData\.fileUrl = "data:text\/html;base64," \+ encodeBase64\("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi<\/title><script type='text\/x-mathjax-config'>MathJax\.Hub\.Config\(\{tex2jax: \{inlineMath: \[\[' \+ splitData\.cleanTestHtml \+ "<\/body><\/html>"\);/g;

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Fixed syntax");
