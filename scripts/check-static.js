#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = ['index.html', '404.html'];
const requiredSections = ['overview', 'calculator', 'map', 'shape', 'style', 'hosiery', 'heels', 'vpa', 'hair', 'privacy'];

const errors = [];

for (const file of htmlFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing file: ${file}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (/<script[^>]+src\s*=\s*"https?:\/\//i.test(content)) {
    errors.push(`${file}: External script reference detected.`);
  }
  if (file === 'index.html') {
    if (!content.includes('Content-Security-Policy')) {
      errors.push('index.html: Missing CSP meta tag.');
    }
    requiredSections.forEach((id) => {
      if (!content.includes(`id="${id}`)) {
        errors.push(`index.html: Missing section #${id}.`);
      }
    });
  }
}

if (errors.length > 0) {
  console.error('Static checks failed:\n- ' + errors.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Static checks passed.');
}
