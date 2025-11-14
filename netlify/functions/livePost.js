// netlify/functions/livePost.js
const path = require("path");

// 루트에 있는 CoupangPartners.js 재사용
const CoupangPartners = require("../CoupangPartners");

// 간단한 HTML 템플릿 함수
function renderHtml(keyword, products) {
    const title = `${keyword} 추천 쿠팡 상품 모음`;

    const itemsHtml = products
        .map((p) => {
            return `
        <article class="item">
          <a href="${p.productUrl}" target="_blank" rel="nofollow noopener noreferrer">
            <img src="${p.productImage}" alt="${p.productName}">
            <h2>${p.productName}</h2>
            <p class="price">${p.productPrice.toLocaleString()}원</p>
            <p class="meta">
              ${p.isRocket ? "로켓배송 · " : ""}${p.isFreeShipping ? "무료배송" : ""}
            </p>
          </a>
        </article>
      `;
        })
        .join("");

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${keyword} 관련 추천 쿠팡 상품을 자동으로 모아서 보여주는 페이지입니다.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      margin: 0;
      padding: 24px;
      background: #020817;
      color: #e5e7eb;
    }
    header {
      max-width: 1080px;
      margin: 0 auto 24px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
    }
    .sub {
      margin: 0;
      font-size: 13px;
      color: #9ca3af;
    }
    main {
      max-width: 1080px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .item {
      background: #0f172a;
      border-radius: 14px;
      padding: 12px;
      border: 1px solid rgba(148, 163, 253, 0.18);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.75);
      transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
    }
    .item:hover {
      transform: translateY(-4px);
      box-shadow: 0 24px 55px rgba(15, 23, 42, 0.9);
      border-color: #38bdf8;
    }
    .item a {
      color: inherit;
      text-decoration: none;
      display: block;
    }
    img {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 8px;
      object-fit: cover;
      max-height: 200px;
    }
    h2 {
      font-size: 14px;
      margin: 4px 0 6px;
      min-height: 2.7em;
    }
    .price {
      margin: 0;
      font-weight: 600;
      color: #f97316;
      font-size: 14px;
    }
    .meta {
      margin: 2px 0 0;
      font-size: 11px;
      color: #9ca3af;
    }
    footer {
      max-width: 1080px;
      margin: 24px auto 0;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <header>
    <h1>${keyword} 추천 상품</h1>
    <p class="sub">쿠팡 파트너스 API를 통해 자동으로 불러온 ${keyword} 관련 인기 상품 목록입니다.</p>
  </header>
  <main>
    ${itemsHtml}
  </main>
  <footer>
    이 포스팅은 쿠팡 파트너스 활동의 일환으로 이에 따른 일정액의 수수료를 제공받습니다.
  </footer>
</body>
</html>`;
}

exports.handler = async (event) => {
    try {
        const slug = event.queryStringParameters.slug;
        if (!slug) {
            return { statusCode: 400, body: "slug is required" };
        }

        // 슬러그 → 키워드로 변환 (예: "공기청정기-추천" → "공기청정기 추천")
        const decoded = decodeURIComponent(slug);
        const keyword = decoded.replace(/-/g, " ");

        const cp = new CoupangPartners(
            process.env.CP_ACCESS_KEY,
            process.env.CP_SECRET_KEY
        );

        // 예: 10개만 가져오기 (네가 쓰던 searchProducts 시그니처 맞춰서 숫자 조절)
        const products = await cp.searchProducts(keyword, 10);

        const html = renderHtml(keyword, products);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
            body: html,
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
