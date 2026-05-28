#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// build-pdfs.mjs – PDF-Pipeline für FiBu-Fachbücher
// ═══════════════════════════════════════════════════════════════════════
//
// Verwendung:
//   npm run build           → Alle 5 Bücher als PDF erzeugen
//   npm run build:book1     → Nur Buch 1 (IHK Bilanzbuchhalter)
//   npm run build:book2     → Nur Buch 2 (BC E2E-Blueprints)
//   npm run build:book3     → Nur Buch 3 (BC Schweiz DE/CH)
//   npm run build:book4     → Nur Buch 4 (BC Extensions DACH)
//   npm run build:book5     → Nur Buch 5 (BC Standardprozesse DE)
//
// Voraussetzungen:
//   npm install             → Installiert marked + puppeteer (inkl. Chromium)
//
// Ausgabe:
//   ./build/*.pdf           → Fertige PDFs im build-Ordner
// ═══════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

// ── Pfade ──────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Konfiguration ──────────────────────────────────────────────────────
const BOOKS = [
  {
    file: 'FiBu_Buch_Bilanzbuchhalter_IHK.md',
    title: 'FiBu-Buch 1: Bilanzbuchhalter IHK',
    subtitle: 'Prüfungsvorbereitung Bachelor Professional in Bilanzbuchhaltung',
  },
  {
    file: 'FiBu_Buch_BC_Blueprint_E2E_Prozesse.md',
    title: 'FiBu-Buch 2: BC E2E-Prozess-Blueprints',
    subtitle: 'End-to-End-Prozesse in Microsoft Dynamics 365 Business Central',
  },
  {
    file: 'FiBu_Buch_BC_Einfuehrung_Schweiz_Separate_Firma_USt_DE-CH.md',
    title: 'FiBu-Buch 3: BC Schweiz – DE/CH-Steuer',
    subtitle: 'Einführung Schweiz, USt/MWST-Konstellationen, Dreiecks-/Reihengeschäfte',
  },
  {
    file: 'FiBu_Buch_BC_Extensions_Prozesse.md',
    title: 'FiBu-Buch 4: BC Extensions DACH',
    subtitle: 'GoBD-konforme Finance-Prozesse mit Continia, OPplus, DATEV',
  },
  {
    file: 'FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md',
    title: 'FiBu-Buch 5: BC Standardprozesse DE',
    subtitle: 'End-to-End-Master-Blueprint mit Musterfirma, Abweichungen und Quellen',
  },
];

const PDF_OPTIONS = {
  format: 'A4',
  margin: { top: '28mm', bottom: '22mm', left: '20mm', right: '20mm' },
  printBackground: true,
  displayHeaderFooter: true,
  // Header: Buchtitel (wird pro Buch dynamisch gesetzt)
  headerTemplate: `
    <div style="width:100%; text-align:center; font-size:8px; color:#999;
                font-family:'Segoe UI',sans-serif; padding-top:2mm;">
      <span class="title"></span>
    </div>`,
  // Footer: Seitenzahl
  footerTemplate: `
    <div style="width:100%; text-align:center; font-size:9px; color:#666;
                font-family:'Segoe UI',sans-serif; padding-bottom:2mm;">
      Seite <span class="pageNumber"></span> von <span class="totalPages"></span>
    </div>`,
};

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
const RENDER_TIMEOUT = 180_000; // 3 Minuten pro Buch (große Dokumente)
const OUT_DIR = join(__dirname, 'build');

// ── CLI-Argument: einzelnes Buch ───────────────────────────────────────
function getSelectedBooks() {
  const bookArg = process.argv.find(a => a.startsWith('--book='));
  if (bookArg) {
    const idx = parseInt(bookArg.split('=')[1], 10) - 1;
    if (idx >= 0 && idx < BOOKS.length) return [BOOKS[idx]];
    console.error(`❌ Ungültige Buchnummer. Verfügbar: 1–${BOOKS.length}`);
    process.exit(1);
  }
  return BOOKS;
}

// ── CSS laden ──────────────────────────────────────────────────────────
function loadCSS() {
  const cssPath = join(__dirname, 'pdf-style.css');
  if (!existsSync(cssPath)) {
    console.error('❌ pdf-style.css nicht gefunden!');
    process.exit(1);
  }
  return readFileSync(cssPath, 'utf-8');
}

// ── Markdown → HTML konvertieren ───────────────────────────────────────
function markdownToHtml(mdContent) {
  // marked mit GFM (Tabellen, Strikethrough etc.)
  marked.setOptions({
    gfm: true,
    breaks: false,
  });
  return marked.parse(mdContent);
}

// ── Mermaid-Code-Blöcke für Browser-Rendering vorbereiten ──────────────
// marked erzeugt: <pre><code class="language-mermaid">...</code></pre>
// Mermaid braucht: <div class="mermaid">...</div>
// Wir machen die Konvertierung im Browser-Script (sicherer wg. HTML-Entities)
function getMermaidInitScript() {
  return `
    <script>
      // Warte bis Mermaid geladen ist, dann konvertiere Code-Blöcke
      function initMermaidDiagrams() {
        // Finde alle Mermaid-Code-Blöcke
        const codeBlocks = document.querySelectorAll('pre code.language-mermaid');
        codeBlocks.forEach((codeEl, i) => {
          const pre = codeEl.parentElement;
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.id = 'mermaid-' + i;
          div.textContent = codeEl.textContent;
          pre.replaceWith(div);
        });

        // Mermaid initialisieren und rendern
        if (typeof mermaid !== 'undefined' && document.querySelectorAll('.mermaid').length > 0) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              nodeSpacing: 20,
              rankSpacing: 25,
              padding: 8,
            },
            securityLevel: 'loose',
          });
          return mermaid.run({ querySelector: '.mermaid' }).then(() => {
            // Post-Render: Überdimensionierte SVGs auf Seitenhöhe skalieren
            const MAX_SVG_HEIGHT = 580; // pt ≈ 80% der A4-Druckhöhe
            document.querySelectorAll('.mermaid svg').forEach(svg => {
              const bbox = svg.getBoundingClientRect();
              if (bbox.height > MAX_SVG_HEIGHT) {
                const scale = MAX_SVG_HEIGHT / bbox.height;
                svg.style.transform = 'scale(' + scale + ')';
                svg.style.transformOrigin = 'top center';
                svg.parentElement.style.height = MAX_SVG_HEIGHT + 'pt';
                svg.parentElement.style.overflow = 'visible';
              }
            });
          });
        }
        return Promise.resolve();
      }
    </script>
  `;
}

// ── Inhaltsverzeichnis generieren ──────────────────────────────────────
function generateToc(html) {
  const headingRegex = /<h([23])\b[^>]*>([\s\S]*?)<\/h[23]>/gi;
  const entries = [];
  let counter = 0;
  let match;

  // Headings sammeln und IDs zuweisen
  const processedHtml = html.replace(headingRegex, (fullMatch, level, content) => {
    const id = `sec-${counter++}`;
    const cleanText = content.replace(/<[^>]+>/g, '').trim();

    // Sehr lange Heading-Texte kürzen (für TOC)
    const tocText = cleanText.length > 120
      ? cleanText.substring(0, 117) + '…'
      : cleanText;

    entries.push({
      level: parseInt(level, 10),
      text: tocText,
      id,
    });

    return `<h${level} id="${id}">${content}</h${level}>`;
  });

  // TOC-HTML bauen
  if (entries.length === 0) return { html: processedHtml, tocHtml: '' };

  let tocHtml = '<div class="toc">\n<h2>Inhaltsverzeichnis</h2>\n<ul>\n';
  for (const entry of entries) {
    const cssClass = entry.level === 2 ? 'toc-h2' : 'toc-h3';
    tocHtml += `  <li class="${cssClass}"><a href="#${entry.id}">${entry.text}</a></li>\n`;
  }
  tocHtml += '</ul>\n</div>\n';

  return { html: processedHtml, tocHtml };
}

// ── Titelseite generieren ──────────────────────────────────────────────
function generateTitlePage(book) {
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  return `
    <div class="title-page">
      <h1>${book.title}</h1>
      <div class="subtitle">${book.subtitle}</div>
      <div class="meta">
        Rechtsstand: 15.03.2026<br>
        PDF erstellt: ${today}<br><br>
        <em>Dieses Dokument ist eine Lernunterlage und ersetzt keine<br>
        individuelle Steuer- oder Rechtsberatung.</em>
      </div>
    </div>
  `;
}

// ── Vollständige HTML-Seite zusammenbauen ──────────────────────────────
function buildFullHtml(book, bodyHtml, tocHtml, css) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${book.title}</title>
  <style>${css}</style>
  <script src="${MERMAID_CDN}"></script>
  ${getMermaidInitScript()}
</head>
<body>
  ${generateTitlePage(book)}
  ${tocHtml}
  ${bodyHtml}

  <script>
    // Mermaid-Rendering starten
    initMermaidDiagrams().then(() => {
      // Signal dass alles fertig ist
      window.__RENDER_COMPLETE = true;
    }).catch(err => {
      console.error('Mermaid-Fehler:', err);
      window.__RENDER_COMPLETE = true; // Trotzdem weitermachen
    });
  </script>
</body>
</html>`;
}

// ── Einzelnes Buch → PDF ───────────────────────────────────────────────
async function buildBookPdf(browser, book, css) {
  const srcPath = join(__dirname, book.file);
  if (!existsSync(srcPath)) {
    console.error(`  ❌ Datei nicht gefunden: ${book.file}`);
    return false;
  }

  const outPath = join(OUT_DIR, book.file.replace('.md', '.pdf'));

  // 1. Markdown lesen
  console.log(`  📖 Lese ${book.file}…`);
  const mdContent = readFileSync(srcPath, 'utf-8');
  const lineCount = mdContent.split('\n').length;
  console.log(`     ${lineCount.toLocaleString('de-DE')} Zeilen`);

  // 2. Markdown → HTML
  console.log('  🔄 Konvertiere Markdown → HTML…');
  let bodyHtml = markdownToHtml(mdContent);

  // 3. Inhaltsverzeichnis + Heading-IDs
  console.log('  📑 Erzeuge Inhaltsverzeichnis…');
  const { html: htmlWithIds, tocHtml } = generateToc(bodyHtml);
  bodyHtml = htmlWithIds;

  // 4. Vollständiges HTML
  const fullHtml = buildFullHtml(book, bodyHtml, tocHtml, css);

  // 5. Puppeteer: HTML laden, Mermaid rendern, PDF erzeugen
  console.log('  🌐 Lade in Chromium (Mermaid-Rendering)…');
  const page = await browser.newPage();

  try {
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0',
      timeout: RENDER_TIMEOUT,
    });

    // Warte auf Mermaid-Rendering (max 60s)
    console.log('  ⏳ Warte auf Mermaid-Diagramme…');
    await page.waitForFunction(
      () => window.__RENDER_COMPLETE === true,
      { timeout: 60_000 }
    ).catch(() => {
      console.log('  ⚠️  Mermaid-Timeout – fahre ohne Diagramme fort');
    });

    // Kurze Pause für CSS-Rendering
    await new Promise(r => setTimeout(r, 1000));

    // PDF erzeugen
    console.log('  📄 Erzeuge PDF…');
    await page.pdf({
      ...PDF_OPTIONS,
      path: outPath,
      headerTemplate: PDF_OPTIONS.headerTemplate.replace(
        '<span class="title"></span>',
        `<span>${book.title}</span>`
      ),
    });

    // Dateigröße ausgeben
    const stat = readFileSync(outPath);
    const sizeMB = (stat.length / 1024 / 1024).toFixed(1);
    console.log(`  ✅ ${basename(outPath)} (${sizeMB} MB)`);
    return true;
  } catch (err) {
    console.error(`  ❌ Fehler bei ${book.file}:`, err.message);
    return false;
  } finally {
    await page.close();
  }
}

// ── Hauptprogramm ──────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  FiBu-Fachbücher – PDF-Pipeline                    ║');
  console.log('║  Markdown → HTML → Mermaid → PDF (A4)              ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  const selectedBooks = getSelectedBooks();
  const css = loadCSS();

  // Build-Ordner anlegen
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
    console.log(`📁 Build-Ordner erstellt: ${OUT_DIR}`);
  }

  // Browser starten (einmal für alle Bücher)
  console.log('🚀 Starte Chromium…');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const startTime = Date.now();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < selectedBooks.length; i++) {
    const book = selectedBooks[i];
    console.log(`\n── Buch ${i + 1}/${selectedBooks.length}: ${book.title} ──`);

    const ok = await buildBookPdf(browser, book, css);
    if (ok) success++;
    else failed++;
  }

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(55));
  console.log(`✅ Fertig: ${success} PDF(s) erstellt, ${failed} Fehler`);
  console.log(`⏱️  Gesamtdauer: ${elapsed} Sekunden`);
  console.log(`📂 Ausgabe: ${OUT_DIR}`);
  console.log('═'.repeat(55));
  console.log('');
}

main().catch(err => {
  console.error('Fataler Fehler:', err);
  process.exit(1);
});
