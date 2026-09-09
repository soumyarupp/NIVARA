import os
import re

def convert_html_to_jsx(html):
    # Basic replacements
    jsx = html.replace('class=', 'className=')
    jsx = jsx.replace('for=', 'htmlFor=')
    jsx = jsx.replace('onclick=', 'onClick=')
    jsx = jsx.replace('tabindex=', 'tabIndex=')
    jsx = jsx.replace('stroke-width', 'strokeWidth')
    jsx = jsx.replace('stroke-linecap', 'strokeLinecap')
    jsx = jsx.replace('stroke-linejoin', 'strokeLinejoin')
    jsx = jsx.replace('stroke-dasharray', 'strokeDasharray')
    jsx = jsx.replace('stroke-opacity', 'strokeOpacity')
    
    # Self close img and input tags
    jsx = re.sub(r'(<img[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<input[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<circle[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<line[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<path[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<rect[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<polyline[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<stop[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<feGaussianBlur[^>]+)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<feMergeNode[^>]+)(?<!/)>', r'\1 />', jsx)
    
    # Remove HTML, HEAD, BODY wrapper to just extract the body content
    body_match = re.search(r'<body[^>]*>(.*?)<script', jsx, re.DOTALL | re.IGNORECASE)
    if body_match:
        jsx = body_match.group(1).strip()
    return jsx

files = [
    {'html': '../login.html', 'css': '../login.css', 'js': '../login.js', 'out': 'src/pages/Login.jsx', 'name': 'Login'},
    {'html': '../index.html', 'css': '../styles.css', 'js': '../script.js', 'out': 'src/pages/Dashboard.jsx', 'name': 'Dashboard'},
    {'html': '../add-project.html', 'css': '../add-project.css', 'js': '../add-project.js', 'out': 'src/pages/AddProject.jsx', 'name': 'AddProject'},
    {'html': '../reports.html', 'css': '../reports.css', 'js': '../reports.js', 'out': 'src/pages/Reports.jsx', 'name': 'Reports'}
]

for file in files:
    with open(file['html'], 'r', encoding='utf-8') as f:
        html = f.read()
    
    jsx = convert_html_to_jsx(html)
    
    component = f"""import React, {{ useEffect }} from 'react';
import './{file['name']}.css';
import {{ Link }} from 'react-router-dom';

const {file['name']} = () => {{
  useEffect(() => {{
    // You'll need to manually adapt logic from {file['js']} here or import it if modified
    // This is just a placeholder for the component lifecycle
  }}, []);

  return (
    <>
      {jsx}
    </>
  );
}};

export default {file['name']};
"""
    # Replace href="index.html" with react router links? We'll leave it as href or maybe adjust manually later
    
    with open(file['out'], 'w', encoding='utf-8') as f:
        f.write(component)
        
    # Copy CSS
    with open(file['css'], 'r', encoding='utf-8') as f:
        css = f.read()
    with open(f"src/pages/{file['name']}.css", 'w', encoding='utf-8') as f:
        f.write(css)

print("Conversion complete.")
