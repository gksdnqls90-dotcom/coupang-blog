const CoupangPartners = require('../../CoupangPartners');
const { getStore } = require('@netlify/blobs');

const coupang = new CoupangPartners(); // 기존 클래스 그대로 사용

async function getKeywordFromStore(slug) {
    const store = getStore('keywords-store');
    const list = await store.get('list', { type: 'json' }) || [];
    const hit = list.find((item) => item.slug === slug);
    return hit ? hit.keyword : decodeURIComponent(slug).replace(/-/g, ' ');
}

exports.handler = async (event) => {
    try {
        const slug = (event.queryStringParameters || {}).slug;
        if (!slug) {
            return { statusCode: 400, body: 'missing slug' };
        }

        const keyword = await getKeywordFromStore(slug);
        const products = await coupang.searchProducts(keyword, 20);

        const itemsHtml = products.map((p) => {
            return `
        <article class="item">
          <a href="${p.coupangUrl}" target="_blank" rel="nofollow noopener">
            <img src="${p.imageUrl}" alt="${p.productName}">
            <h2>${p.productName}</h2>
            <p class="price">${p.price}원</p>
          </a>
        </article>
      `;
        }).join('');

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
      margin-bottom: 12px;
    }
    p.sub {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 18px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill,minmax(180px,1fr));
      gap: 16px;
    }
    .item {
      background: #111827;
      border-radius: 12px;
      padding: 10px;
      border: 1px solid rgba(148,163,253,0.2);
    }
    .item img {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 6px;
    }
    .item h2 {
      font-size: 13px;
      margin: 0 0 4px;
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
    <h1>${keyword} 추천</h1>
    <p class="sub">쿠팡 파트너스 API로 실시간 생성된 추천 리스트입니다.</p>
    <section class="grid">
      ${itemsHtml}
    </section>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
      이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
    </p>
  </div>
</body>
</html>`;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: html
        };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: 'internal error' };
    }
};
