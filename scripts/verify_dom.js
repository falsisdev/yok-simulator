const fs = require('fs');
const appJs = fs.readFileSync('js/app.js', 'utf8');
const mapJs = fs.readFileSync('js/map.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
const ids = new Set();
let match;
while ((match = regex.exec(appJs)) !== null) {
  ids.add(match[1]);
}
while ((match = regex.exec(mapJs)) !== null) {
  ids.add(match[1]);
}

const missing = [];
ids.forEach(id => {
  if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
    missing.push(id);
  }
});

console.log(`Total unique getElementById IDs checked: ${ids.size}`);
console.log('Missing IDs count:', missing.length);
if (missing.length > 0) {
  console.log('Missing IDs:', missing);
  process.exit(1);
} else {
  console.log('All IDs verified successfully in index.html!');
}
