const fs = require('fs');
const path = require('path');

function convertHtmlToJsx(html) {
    let jsx = html.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    jsx = jsx.replace(/onclick=/gi, 'onClick=');
    jsx = jsx.replace(/tabindex=/gi, 'tabIndex=');
    jsx = jsx.replace(/stroke-width/g, 'strokeWidth');
    jsx = jsx.replace(/stroke-linecap/g, 'strokeLinecap');
    jsx = jsx.replace(/stroke-linejoin/g, 'strokeLinejoin');
    jsx = jsx.replace(/stroke-dasharray/g, 'strokeDasharray');
    jsx = jsx.replace(/stroke-opacity/g, 'strokeOpacity');
    jsx = jsx.replace(/fill-rule/g, 'fillRule');
    jsx = jsx.replace(/clip-rule/g, 'clipRule');
    
    // self close tags
    const tags = ['img', 'input', 'circle', 'line', 'path', 'rect', 'polyline', 'stop', 'feGaussianBlur', 'feMergeNode'];
    tags.forEach(tag => {
        const regex = new RegExp(`(<${tag}[^>]+)(?<!/)>`, 'gi');
        jsx = jsx.replace(regex, '$1 />');
    });

    // Remove inline style tags or attributes if they're causing issues, but let's try to fix style strings
    // style="animation: spin 0.8s linear infinite;" -> style={{animation: 'spin 0.8s linear infinite'}}
    jsx = jsx.replace(/style="([^"]+)"/g, (match, p1) => {
        const rules = p1.split(';').filter(r => r.trim());
        let styleObj = {};
        rules.forEach(rule => {
            let parts = rule.split(':');
            if (parts.length >= 2) {
                let key = parts[0].trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                let val = parts.slice(1).join(':').trim();
                styleObj[key] = val;
            }
        });
        return `style={{${Object.entries(styleObj).map(([k, v]) => `${k}: '${v}'`).join(', ')}}}`;
    });

    const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<script/i);
    if (bodyMatch) {
        jsx = bodyMatch[1].trim();
    }
    return jsx;
}

const files = [
    {html: '../login.html', css: '../login.css', js: '../login.js', out: 'src/pages/Login.jsx', name: 'Login'},
    {html: '../index.html', css: '../styles.css', js: '../script.js', out: 'src/pages/Dashboard.jsx', name: 'Dashboard'},
    {html: '../add-project.html', css: '../add-project.css', js: '../add-project.js', out: 'src/pages/AddProject.jsx', name: 'AddProject'},
    {html: '../reports.html', css: '../reports.css', js: '../reports.js', out: 'src/pages/Reports.jsx', name: 'Reports'}
];

files.forEach(file => {
    const html = fs.readFileSync(file.html, 'utf-8');
    const jsx = convertHtmlToJsx(html);
    
    // Read the js file content to embed it inside useEffect
    let jsContent = '';
    if (fs.existsSync(file.js)) {
        jsContent = fs.readFileSync(file.js, 'utf-8');
        // comment out DOMContentLoaded since we are in React
        jsContent = jsContent.replace(/document\.addEventListener\("DOMContentLoaded", \(\) => {/g, '// document.addEventListener("DOMContentLoaded", () => {');
        jsContent = jsContent.replace(/}\);[\s]*$/g, '// });\n');
        
        // Remove or fix location.href stuff
        jsContent = jsContent.replace(/window\.location\.href\s*=\s*["']([^"']+)["']/g, '/* window.location.href = "$1" */');
    }

    const component = `import React, { useEffect } from 'react';
import './${file.name}.css';
import { Link } from 'react-router-dom';

const ${file.name} = () => {
  useEffect(() => {
    ${jsContent}
  }, []);

  return (
    <>
      ${jsx}
    </>
  );
};

export default ${file.name};
`;

    fs.writeFileSync(file.out, component, 'utf-8');
    
    if (fs.existsSync(file.css)) {
        const css = fs.readFileSync(file.css, 'utf-8');
        fs.writeFileSync(`src/pages/${file.name}.css`, css, 'utf-8');
    }
});

console.log("Conversion complete.");
