const fs = require('fs');

const files = [
    'src/pages/Login.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/AddProject.jsx',
    'src/pages/Reports.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    // Remove closing tags for SVG elements we self-closed earlier
    const tags = ['img', 'input', 'circle', 'line', 'path', 'rect', 'polyline', 'stop', 'feGaussianBlur', 'feMergeNode'];
    tags.forEach(tag => {
        const regex = new RegExp(`</${tag}>`, 'gi');
        content = content.replace(regex, '');
    });
    
    fs.writeFileSync(file, content, 'utf-8');
});

console.log("Closing tags removed.");
