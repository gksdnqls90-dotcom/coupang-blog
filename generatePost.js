const fs = require('fs');
const path = require('path');
const CoupangPartners = require('./CoupangPartners');
require('dotenv').config();

const keyword = process.argv[2];
if (!keyword) {
  console.error('❌ 키워드를 입력하세요. 예) node generatePost.js "공기청정기 추천"');
  process.exit(1);
}

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '')
    .replace(/\-+/g, '-');
}

(async () => {
  try {
    const client = new CoupangPartners();
    const res = await client.searchProducts(keyword, 10);

    if (res.rCode !== '0') {
      console.error('API 오류:', res.rMessage || res);
      process.exit(1);
    }

    const products = res.data.productData || [];
    if (!products.length) {
      console.error('상품 데이터가 없습니다.');
      process.exit(1);
    }

    const slug = slugify(keyword) || `post-${Date.now()}`;
    const title = `${keyword} TOP ${products.length} 추천 (쿠팡 인기상품 모음)`;
    const landingUrl = res.data.landingUrl;

    // ================== 개별 포스트 ==================
    let postHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${keyword} 관련 인기 상품 추천 리스트">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index,follow">
  <style>
    body { font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif; margin:0; padding:24px; background:#f5f5f7; color:#111827; }
    a { color:#2563eb; text-decoration:none; }
    a:hover { text-decoration:underline; }
    header { max-width:960px; margin:0 auto 24px; }
    .back { font-size:13px; color:#6b7280; }
    h1 { font-size:26px; margin:8px 0 12px; }
    .desc { font-size:14px; color:#4b5563; line-height:1.6; }
    .cards { max-width:960px; margin:24px auto; display:flex; flex-direction:column; gap:14px; }
    .card { display:flex; gap:14px; padding:14px; border-radius:14px; background:#ffffff; box-shadow:0 10px 30px rgba(15,23,42,0.06); }
    .thumb img { width:140px; height:140px; object-fit:cover; border-radius:10px; border:1px solid #e5e7eb; }
    .meta h3 { margin:0 0 6px; font-size:16px; color:#111827; }
    .price { font-weight:700; margin:0 0 4px; color:#111827; }
    .tags { font-size:12px; color:#6b7280; margin:0 0 4px; }
    .btn { display:inline-block; margin-top:6px; padding:6px 12px; border-radius:999px; border:1px solid #f97316; font-size:12px; color:#f97316; }
    .btn:hover { background:#fff7ed; }
    footer { max-width:960px; margin:24px auto 0; font-size:11px; color:#9ca3af; line-height:1.6; }
  </style>
</head>
<body>
<header>
  <div class="back"><a href="/">← 추천 리스트 홈으로</a></div>
  <h1>${title}</h1>
  <p class="desc">
    ${keyword}을(를) 기준으로 쿠팡 파트너스 상품 데이터를 분석해 인기 상품을 정리했습니다.<br>
    아래 링크에는 쿠팡 파트너스 링크가 포함되어 있으며, 구매 시 작성자는 일정액의 수수료를 제공받을 수 있으나,
    구매자에게 추가 비용은 발생하지 않습니다.
  </p>
  <p><a href="${landingUrl}" target="_blank" rel="nofollow">👉 "${keyword}" 전체 상품 보러가기</a></p>
</header>

<section class="cards">
`;

    for (const p of products) {
      postHtml += `
  <article class="card">
    <div class="thumb">
      <a href="${p.productUrl}" target="_blank" rel="nofollow">
        <img src="${p.productImage}" alt="${p.productName}">
      </a>
    </div>
    <div class="meta">
      <h3>${p.rank}. ${p.productName}</h3>
      <p class="price">${p.productPrice.toLocaleString()}원</p>
      <p class="tags">
        ${p.isRocket ? '🚀 로켓배송' : '📦 일반배송'}
        ${p.isFreeShipping ? ' · 무료배송 가능' : ''}
        ${p.categoryName ? ` · ${p.categoryName}` : ''}
      </p>
      <a class="btn" href="${p.productUrl}" target="_blank" rel="nofollow">상품 상세 보기</a>
    </div>
  </article>
`;
    }

    postHtml += `
</section>

<footer>
  이 페이지는 자동화된 스크립트로 생성된 쿠팡 파트너스 추천 콘텐츠입니다.
  쿠팡 파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다.
</footer>
</body>
</html>`;

    // /public/posts 저장
    const postsDir = path.join(__dirname, 'public', 'posts');
    if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

    const postPath = path.join(postsDir, `${slug}.html`);
    fs.writeFileSync(postPath, postHtml.trim(), 'utf8');
    console.log(`✅ 포스트 생성: ${postPath}`);

    // ================== index.html 재생성 ==================
    const files = fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith('.html'))
      .sort();

    let indexHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>icbhplus · 쿠팡 추천 리스트 자동 모음</title>
  <meta name="description" content="쿠팡 파트너스 API로 자동 생성되는 추천 상품 페이지 모음">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif; margin:0; padding:32px; background:#020817; color:#e5e7eb; }
    header.wrap { max-width:1080px; margin:0 auto 24px; }
    .topbar { font-size:11px; color:#64748b; margin-bottom:4px; }
    h1 { margin:0 0 8px; font-size:28px; }
    p.sub { margin:0 0 24px; font-size:14px; color:#9ca3af; line-height:1.6; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; max-width:1080px; margin:0 auto; }
    .card { background:#111827; border-radius:16px; padding:14px; border:1px solid rgba(148,163,253,0.16); box-shadow:0 16px 40px rgba(15,23,42,0.55); transition:all .18s ease; }
    .card:hover { transform:translateY(-4px); box-shadow:0 24px 55px rgba(15,23,42,0.9); border-color:#38bdf8; }
    .card-title { font-size:16px; margin:0 0 6px; color:#e5e7eb; }
    .card-link { font-size:13px; color:#38bdf8; text-decoration:none; }
    .badge { display:inline-block; margin-top:4px; padding:2px 8px; border-radius:999px; font-size:10px; background:rgba(56,189,248,0.12); color:#38bdf8; }
    .empty { max-width:1080px; margin:40px auto; font-size:13px; color:#9ca3af; }
  </style>
</head>
<body>
<header class="wrap">
  <div class="topbar">icbhplus · 자동화된 쿠팡 추천 포털</div>
  <h1>자동 생성 추천 리스트</h1>
  <p class="sub">
    이 페이지는 관리자(당신)가 입력한 키워드를 기반으로 자동 생성된 쿠팡 추천 페이지 모음입니다.<br>
    방문자는 아래 카드들을 통해 원하는 주제의 추천 상품을 확인할 수 있습니다.
  </p>
</header>

<main class="grid">
`;

    if (files.length === 0) {
      indexHtml += `
</main>
<div class="empty">
  아직 생성된 추천 페이지가 없습니다.<br>
  관리자용 스크립트나 /admin 페이지에서 키워드를 입력해 첫 페이지를 생성하세요.
</div>
</body>
</html>`;
    } else {
      for (const file of files) {
        const base = file.replace('.html', '');
        const display = decodeURIComponent(base).replace(/-/g, ' ');
        indexHtml += `
  <article class="card">
    <div class="card-title">${display}</div>
    <a class="card-link" href="posts/${file}">바로 보기 →</a>
    <div class="badge">자동 생성</div>
  </article>
`;
      }
      indexHtml += `
</main>
</body>
</html>`;
    }

    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml.trim(), 'utf8');
    console.log('✅ index.html 업데이트 완료');
  } catch (err) {
    console.error('❌ 에러:', err.response?.data || err.message || err);
    process.exit(1);
  }
})();
