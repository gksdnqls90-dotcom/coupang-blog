// netlify/functions/livePost.js
const CoupangPartners = require('../../CoupangPartners');
const { getStore, connectLambda } = require('@netlify/blobs');

const coupang = new CoupangPartners();

// slug → keyword 찾기
async function getKeywordFromStore(slug) {
    const store = getStore('keywords-store');
    const list = (await store.get('list', { type: 'json' })) || [];
    const hit = list.find((item) => item.slug === slug);
    return hit ? hit.keyword : decodeURIComponent(slug).replace(/-/g, ' ');
}

exports.handler = async (event) => {
    try {
        // ★ Blobs 초기화
        connectLambda(event);

        const slug = (event.queryStringParameters || {}).slug;
        if (!slug) {
            return {
                statusCode: 400,
                body: 'slug is required',
            };
        }

        const keyword = await getKeywordFromStore(slug);

        const products = await coupang.searchProducts(keyword, 20);

        const itemsHtml = products
            .map((p) => {
                return `
        <article class="item">
          <a href="${p.coupangUrl}" target="_blank" rel="nofollow noopener">
            <img src="${p.imageUrl}" alt="${p.productName}">
            <h2>${p.productName}</h2>
            <p class="price">${p.price}원</p>
          </a>
        </article>
      `;
            })
            .join('');

        const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${keyword} · 쿠팡 추천</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      margin: 0;
      padding: 24px;
      background: #020817;
      color: #e5e7eb;
    }
    .wrap {
      max-width: 1080px;
      margin: 0 auto;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 8px;
    }
    p.sub {
      margin: 0 0 16px;
      font-size: 13px;
      color: #9ca3af;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    .item {
      background: #111827;
      border-radius: 14px;
      padding: 10px;
      border: 1px solid rgba(148, 163, 253, 0.2);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.6);
    }
    img {
      width: 100%;
      border-radius: 8px;
      display: block;
      margin-bottom: 6px;
    }
    h2 {
      font-size: 13px;
      margin: 0 0 4px;
      color: #e5e7eb;
    }
    .price {
      font-size: 13px;
      color: #f97316;
      margin: 0;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${keyword} · 쿠팡 추천</h1>
    <p class="sub">아래 상품을 클릭하면 쿠팡 상세페이지로 이동합니다.</p>
    <section class="grid">
      ${itemsHtml || '<p>상품을 불러오지 못했습니다.</p>'}
    </section>
  </div>
</body>
</html>`;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: html,
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
};
