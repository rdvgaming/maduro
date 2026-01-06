import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('dist/index.html', 'utf-8');
const jsFile = html.match(/src="\.\/([^"]+\.js)"/)?.[1];

if (jsFile) {
  const js = readFileSync(`dist/${jsFile}`, 'utf-8');
  const bundled = html.replace(
    `<script type="module" crossorigin src="./${jsFile}"></script>`,
    `<script type="module">${js}</script>`
  );
  writeFileSync('dist/standalone.html', bundled);
  console.log('Created dist/standalone.html');
}
