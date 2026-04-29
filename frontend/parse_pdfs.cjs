const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');
const path = require('path');

const dir = '../spec book references';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

async function extractTOC(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  
  let text = '';
  // Scan first 30 pages
  const max = Math.min(pdf.numPages, 30);
  for(let i=1; i<=max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageStr = content.items.map(item => item.str).join(' ');
    // Simple heuristic: Does page contain CSI patterns or index keywords?
    if (pageStr.match(/\b\d{6}\b/) || pageStr.match(/\b\d{2}\s\d{2}\s\d{2}\b/) || pageStr.toLowerCase().includes('table of contents') || pageStr.toLowerCase().includes('index')) {
        text += `\n--- PAGE ${i} ---\n` + content.items.map(item => item.str).join(' | ');
    }
  }
  return text.substring(0, 5000); // just grab sample
}

async function run() {
  for (const f of files) {
    try {
      const p = path.join(dir, f);
      const text = await extractTOC(p);
      console.log(`\n\n=================================\nFILE: ${f}\n=================================\n`);
      console.log(text);
    } catch (e) {
      console.error(`Error on ${f}:`, e.message);
    }
  }
}
run();
