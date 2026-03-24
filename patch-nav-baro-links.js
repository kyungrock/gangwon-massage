/**
 * regions/*.html, districts/*.html 등에 "바로가기" → links.html 네비 한 줄 삽입 (아직 없을 때만)
 * 사용: node patch-nav-baro-links.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function relLinksHref(filePath) {
  const rel = path.relative(ROOT, filePath);
  const depth = rel.split(path.sep).length - 1;
  return depth > 0 ? `${'../'.repeat(depth)}links.html` : 'links.html';
}

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('href="') && html.includes('links.html')) {
    return false;
  }
  if (!html.includes('class="main-nav"')) {
    return false;
  }
  const baro =
    '<a href="' +
    relLinksHref(filePath) +
    '" class="nav-link">바로가기</a>\n          ';
  // 메인 링크 바로 다음에 삽입
  const re =
    /(<a[^>]+class="nav-link[^"]*"[^>]*>메인<\/a>\s*\n\s*)(<a[^>]+class="nav-link)/;
  if (!re.test(html)) {
    return false;
  }
  const next = html.replace(re, `$1${baro}$2`);
  if (next === html) return false;
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      out.push(...walk(p));
    } else if (name.endsWith('.html') && name !== 'links.html') {
      out.push(p);
    }
  }
  return out;
}

function main() {
  const dirs = [
    path.join(ROOT, 'regions'),
    path.join(ROOT, 'districts'),
    path.join(ROOT, 'shops'),
  ];
  const rootExtras = ['detail.html'].map((f) => path.join(ROOT, f));
  let n = 0;
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of walk(d)) {
      if (patchFile(f)) {
        n++;
        console.log('patched', path.relative(ROOT, f));
      }
    }
  }
  for (const f of rootExtras) {
    if (fs.existsSync(f) && patchFile(f)) {
      n++;
      console.log('patched', path.relative(ROOT, f));
    }
  }
  console.log('done. patched', n, 'files.');
}

main();
