const fs = require('fs');

const files = [
    'src/pages/Login.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/AddProject.jsx',
    'src/pages/Reports.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/<br>/gi, '<br />');
    content = content.replace(/<hr>/gi, '<hr />');
    content = content.replace(/<input([^>]*?)>/gi, (match, p1) => {
        if (p1.endsWith('/')) return match;
        return `<input${p1} />`;
    });
    fs.writeFileSync(file, content, 'utf-8');
});

console.log("br/hr/input fixed.");
