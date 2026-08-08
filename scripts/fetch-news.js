const https = require('https');
const fs = require('fs');
const path = require('path');

// NHKニュースRSS カテゴリ一覧(チャンネルタイトルで実際に確認済みのマッピング)
const CATEGORIES = [
  { key: 'cat0', label: '主要' },
  { key: 'cat1', label: '社会' },
  { key: 'cat4', label: '政治' },
  { key: 'cat5', label: '経済' },
  { key: 'cat6', label: '国際' },
  { key: 'cat3', label: '科学・医療' },
  { key: 'cat2', label: '文化・エンタメ' },
  { key: 'cat7', label: 'スポーツ' },
];

function decodeEntities(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? decodeEntities(m[1]) : '';
}

function parseRss(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks) {
    items.push({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link'),
      description: extractTag(block, 'description'),
      pubDate: extractTag(block, 'pubDate'),
    });
  }
  return items;
}

function fetchRss(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchRss(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function main() {
  const results = await Promise.all(
    CATEGORIES.map(async (category) => {
      try {
        const xml = await fetchRss(`https://www3.nhk.or.jp/rss/news/${category.key}.xml`);
        const items = parseRss(xml).slice(0, 3);
        return { key: category.key, label: category.label, items, error: null };
      } catch (err) {
        return { key: category.key, label: category.label, items: [], error: err.message };
      }
    })
  );

  const payload = { updatedAt: new Date().toISOString(), categories: results };
  const outPath = path.join(__dirname, '..', 'data', 'news.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`書き出し完了: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
