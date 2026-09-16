import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const regex = /if \(splitData\.cleanTestHtml && splitData\.answersHtml\) \{[\s\S]*?\} else \{/g;
const replacement = `if (splitData.cleanTestHtml && splitData.answersHtml) {
                    const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
                    testData.fileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']], displayMath: [['$$$$','$$$$'], ['\\\\[','\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.cleanTestHtml + "</body></html>");
                    testData.fileName = "de_thi_sach.html";
                    testData.answerFileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']], displayMath: [['$$$$','$$$$'], ['\\\\[','\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.answersHtml + "</body></html>");
                    testData.answerFileName = "dap_an_chi_tiet.html";
                 } else {`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Fixed mess");
