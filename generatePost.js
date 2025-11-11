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

    // ----- 개별 포스트 HTML -----
    let postHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${keyword} 관련 인기 상품 추천 리스트">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index,follow">
</head>
<body>
  <h1>${title}</h1>
  <p>본 페이지에는 쿠팡 파트너스 링크가 포함되어 있으며, 이를 통해 일정액의 수수료를 제공받을 수 있습니다.</p>
  <p><a href="${landingUrl}" target="_blank" rel="nofollow">👉 ${keyword} 전체 상품 보러가기</a></p>
`;

    for (const p of products) {
      postHtml += `
  <div style="border:1px solid #ddd; padding:10px; margin:10px 0; display:flex; gap:10px;">
    <a href="${p.productUrl}" target="_blank" rel="nofollow">
      <img src="${p.productImage}" alt="${p.productName}" style="width:140px; height:140px; object-fit:cover;">
    </a>
    <div>
      <h3>${p.rank}. ${p.productName}</h3>
      <p><b>${p.productPrice.toLocaleString()}원</b></p>
      <p style="font-size:12px; color:#555;">
        ${p.isRocket ? '🚀 로켓배송' : '📦 일반배송'}
        ${p.isFreeShipping ? ' · 무료배송 가능' : ''}
        ${p.categoryName ? ' · ' + p.categoryName : ''}
      </p>
      <a href="${p.productUrl}" target="_blank" rel="nofollow">상품 자세히 보기</a>
    </div>
  </div>`;
    }

    postHtml += `
  <p style="font-size:11px; color:#777;">
    쿠팡 파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다.
  </p>
</body>
</html>`;

    // ----- /public/posts 에 저장 -----
    const postsDir = path.join(__dirname, 'public', 'posts');
    if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

    const postPath = path.join(postsDir, `${slug}.html`);
    fs.writeFileSync(postPath, postHtml.trim(), 'utf8');
    console.log(`✅ 생성: ${postPath}`);

    // ----- index.html 재생성 -----
    const files = fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith('.html'))
      .sort();

    let indexHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>icbhplus · 쿠팡 추천 리스트</title>
  <meta name="description" content="자동 생성된 쿠팡 추천 상품 페이지 모음">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>icbhplus 자동 추천 리스트</h1>
  <p>아래 링크들은 자동 생성된 쿠팡 파트너스 추천 페이지입니다.</p>
  <ul>
`;

    for (const file of files) {
      const name = file.replace('.html', '');
      indexHtml += `    <li><a href="posts/${file}">${name}</a></li>\n`;
    }

    indexHtml += `  </ul>
  <p style="font-size:11px; color:#777;">
    관리자 스크립트로 생성되며, 방문자는 이 목록과 각 상세 페이지만 보게 됩니다.
  </p>
</body>
</html>`;

    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml.trim(), 'utf8');
    console.log('✅ index.html 업데이트 완료');
  } catch (err) {
    console.error('❌ 에러:', err.response?.data || err.message || err);
    process.exit(1);
  }
})();
