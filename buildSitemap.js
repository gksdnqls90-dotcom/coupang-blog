const fs = require("fs");
const path = require("path");

const postsDir = path.join(__dirname, 'public', 'posts');
const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".html"));

const urls = files.map(file => `
  <url>
    <loc>https://icbhplus.com/posts/${file}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://icbhplus.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls.join("\n")}
</urlset>`;

fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), sitemap);
console.log("✅ sitemap.xml 생성 완료");
