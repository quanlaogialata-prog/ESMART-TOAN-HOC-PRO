import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const regex1 = /"<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi<\/title><script type='text\/javascript' async src='https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/mathjax\/2\.7\.7\/MathJax\.js\?config=TeX-MML-AM_CHTML'><\/script><\/head><body style='font-family: Arial; line-height: 1\.6; padding: 20px; max-width: 800px; margin: 0 auto;'>"/g;
const replace1 = `"<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\\\\\(','\\\\\\\\)']], displayMath: [['$$','$$'], ['\\\\\\\\[','\\\\\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>"`

const regex2 = /"<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án<\/title><script type='text\/javascript' async src='https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/mathjax\/2\.7\.7\/MathJax\.js\?config=TeX-MML-AM_CHTML'><\/script><\/head><body style='font-family: Arial; line-height: 1\.6; padding: 20px; max-width: 800px; margin: 0 auto;'>"/g;
const replace2 = `"<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\\\\\(','\\\\\\\\)']], displayMath: [['$$','$$'], ['\\\\\\\\[','\\\\\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>"`

content = content.replace(regex1, replace1);
content = content.replace(regex2, replace2);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Patched MathJax config");
