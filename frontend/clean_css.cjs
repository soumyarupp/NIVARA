const fs = require('fs');
let css = fs.readFileSync('src/pages/Dashboard.css', 'utf8');

// Remove global * and html, body selectors
css = css.replace(/\*\s*\{[^}]*\}/g, '');
css = css.replace(/html,\s*body\s*\{[^}]*\}/g, '');
css = css.replace(/:root\s*\{[^}]*\}/g, ''); // maybe keep root variables, let's NOT remove :root

fs.writeFileSync('src/pages/Dashboard.css', css);
console.log('Cleaned Dashboard.css');
