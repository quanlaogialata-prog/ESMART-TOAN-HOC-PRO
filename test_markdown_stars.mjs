import React from 'react';
import ReactMarkdown from 'react-markdown';
import { renderToString } from 'react-dom/server';

let content = "Từ (*) và (**) suy ra:";
let ele = React.createElement(ReactMarkdown, {}, content);
console.log("Original:", renderToString(ele));

let escapedContent = content.replace(/\(\*/g, '(\\*').replace(/\*\)/g, '\\*)');
let ele2 = React.createElement(ReactMarkdown, {}, escapedContent);
console.log("Escaped:", renderToString(ele2));
