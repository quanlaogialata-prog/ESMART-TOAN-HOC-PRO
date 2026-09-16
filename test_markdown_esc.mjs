import React from 'react';
import ReactMarkdown from 'react-markdown';
import { renderToString } from 'react-dom/server';

let content = "Từ (*) và (**) suy ra:";
let ele = React.createElement(ReactMarkdown, {}, content.replace(/\(\*/g, '( *').replace(/\*\)/g, '* )'));
console.log("With spaces:", renderToString(ele));

let ele3 = React.createElement(ReactMarkdown, {}, content.replace(/\(\*\)/g, '(<span>*</span>)'));
console.log("With span:", renderToString(ele3));

let ele4 = React.createElement(ReactMarkdown, {}, content.replace(/\(\*\)/g, '(&#42;)'));
console.log("With html entity:", renderToString(ele4));

