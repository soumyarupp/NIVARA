const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/Login.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/AddProject.jsx',
    'src/pages/Reports.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    // Replace HTML comments with JSX comments
    content = content.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
    fs.writeFileSync(file, content, 'utf-8');
});

console.log("Comments fixed.");
