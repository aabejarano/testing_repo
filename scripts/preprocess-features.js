/**
 * Feature file preprocessor — resolves QAF-style external data references.
 *
 * Replaces:
 *   Examples: {'datafile':'manufacturers.json'}
 * with a real Gherkin Examples table sourced from data/<filename>.
 *
 * Reads from:  features/
 * Writes to:   .features-staged/   (gitignored, consumed by bddgen)
 *
 * Data files live in the top-level data/ directory.
 * The JSON must be an array of objects whose keys match the Scenario Outline
 * parameter names (e.g. [{ "query": "...", "expected_domain": "..." }]).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(ROOT, 'features');
const DATA_DIR     = path.join(ROOT, 'data');
const STAGED_DIR   = path.join(ROOT, '.features-staged');

// Matches:  Examples: {'datafile':'some-file.json'}
// — handles single or double quotes and optional whitespace
const DATAFILE_RE = /^(\s*)Examples:\s*\{\s*['"]datafile['"]\s*:\s*['"]([^'"]+)['"]\s*\}/m;

function buildExamplesTable(indent, data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data file must contain a non-empty JSON array');
  }
  const keys    = Object.keys(data[0]);
  const rowIndent = indent + '  ';

  const header = `${indent}Examples:\n${rowIndent}| ${keys.join(' | ')} |`;
  const rows   = data.map(row =>
    `${rowIndent}| ${keys.map(k => String(row[k])).join(' | ')} |`
  );
  return [header, ...rows].join('\n');
}

function processFeatureContent(content, featurePath) {
  let match;
  // Replace every occurrence in the file
  while ((match = DATAFILE_RE.exec(content)) !== null) {
    const [fullMatch, indent, dataFile] = match;
    const dataPath = path.join(DATA_DIR, dataFile);

    if (!fs.existsSync(dataPath)) {
      throw new Error(
        `[preprocess] Data file not found: ${dataPath}\n` +
        `  Referenced in: ${featurePath}`
      );
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    } catch (e) {
      throw new Error(`[preprocess] Failed to parse ${dataPath}: ${e.message}`);
    }

    const table = buildExamplesTable(indent, data);
    content = content.slice(0, match.index) + table + content.slice(match.index + fullMatch.length);
  }
  return content;
}

function processDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src  = path.join(srcDir,  entry.name);
    const dest = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      processDir(src, dest);
    } else if (entry.name.endsWith('.feature')) {
      const original  = fs.readFileSync(src, 'utf-8');
      const processed = processFeatureContent(original, src);
      fs.writeFileSync(dest, processed);

      const changed = original !== processed;
      console.log(`  ${changed ? '✓ expanded' : '· unchanged'}  ${entry.name}`);
    }
  }
}

// ── main ────────────────────────────────────────────────────────────────────
console.log('[preprocess] Staging feature files...');

// Clean previous output so stale files don't linger
if (fs.existsSync(STAGED_DIR)) {
  fs.rmSync(STAGED_DIR, { recursive: true, force: true });
}

processDir(FEATURES_DIR, STAGED_DIR);
console.log('[preprocess] Done.\n');
