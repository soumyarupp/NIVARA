const fs = require('fs');
let css = fs.readFileSync('src/pages/Dashboard.css', 'utf8');
css = css.replace(/line-height:\s*1(\.\d+)?;?/g, '');
fs.writeFileSync('src/pages/Dashboard.css', css);

let reportsCss = fs.readFileSync('src/pages/Reports.css', 'utf8');
reportsCss = reportsCss.replace(/line-height:\s*1(\.\d+)?;?/g, '');
fs.writeFileSync('src/pages/Reports.css', reportsCss);
console.log('Done');
