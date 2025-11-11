const fs = require('fs');
const CoupangPartners = require('./CoupangPartners');

const keyword = process.argv[2];
if (!keyword) {
    console.error('❌ 키워드를 입력하세요. 예) node generatePost.js "공기청정기 추천"');
    process.exit(1);
}

(async () => {
    try {
        const client = new CoupangPartners();
        const res = await client.searchProducts(keyword, 10);

        if (res.rCode !== '0') {
            console.error('API 오류:', res.rMessage || res);
            return;
        }

        const landingUrl = res.data.landingUrl;
        const products = res.data.productData || [];

        if (!products.length) {
            console.error('상품 데이터가 없습니다.');
            return;
        }

        // ===== 제목 =====
        const title = `${keyword} TOP ${products.length} 추천 (가성비+프리미엄 한 번에 비교)`;

        // ===== HTML 본문 =====
        let html = `
<h2>${keyword} 구매 전 꼭 체크할 포인트</h2>
<ul>
  <li>예산: 내 생활패턴에 맞는 가격대인지</li>
  <li>브랜드 신뢰도 및 AS</li>
  <li>사용 공간(평수)과 기능(필터, 모드 등)</li>
</ul>

<p>아래 추천 리스트는 쿠팡 파트너스 데이터를 기반으로 인기/평가/구성 등을 함께 고려해 정리한 것이며,
구매 시 파트너스 활동을 통해 일정액의 수수료를 제공받을 수 있습니다. (구매자 추가 비용 없음)</p>

<p><a href="${landingUrl}" target="_blank" rel="nofollow">👉 ${keyword} 전체 상품 한 번에 보기</a></p>
`;

        for (const p of products) {
            html += `
<div style="border:1px solid #ddd; border-radius:10px; padding:10px; margin:10px 0; display:flex; gap:10px;">
  <a href="${p.productUrl}" target="_blank" rel="nofollow" style="flex-shrink:0;">
    <img src="${p.productImage}" alt="${p.productName}" style="width:180px; height:180px; object-fit:cover; border-radius:8px;">
  </a>
  <div style="flex:1;">
    <h3 style="margin:0 0 6px; font-size:17px;">${p.rank}. ${p.productName}</h3>
    <p style="margin:0 0 4px;"><strong>가격:</strong> ${p.productPrice.toLocaleString()}원</p>
    <p style="margin:0 0 4px; font-size:13px; color:#666;">
      카테고리: ${p.categoryName} /
      ${p.isRocket ? '🚀 로켓배송' : '📦 일반배송'} /
      ${p.isFreeShipping ? '무료배송 가능' : '배송비 조건 확인'}
    </p>
    <a href="${p.productUrl}" target="_blank" rel="nofollow"
       style="display:inline-block; padding:6px 10px; border-radius:6px; border:1px solid #ff7f00; font-size:13px; text-decoration:none;">
      상품 상세보기
    </a>
  </div>
</div>`;
        }

        html += `
<p style="margin-top:24px; font-size:13px; color:#666;">
이 포스팅은 쿠팡 파트너스 활동의 일환으로 작성되었으며,<br>
이를 통해 일정액의 수수료를 제공받을 수 있습니다.
</p>
`;

        // ===== 태그 =====
        const tags = [
            keyword,
            '#쿠팡파트너스',
            '#쿠팡추천',
            '#가성비추천',
            '#인기상품',
            '#리뷰',
            '#쇼핑',
            '#온라인쇼핑',
            '#로켓배송',
            '#제품추천',
            '#비교분석',
            '#블로그수익',
            '#티스토리',
            '#추천리스트',
            '#필수템',
            '#스마트쇼핑',
            '#혜택',
            '#트렌드',
            '#생활꿀템',
            '#정보공유'
        ];

        // 파일명 안전하게
        const safeName = keyword.replace(/[\\/:*?"<>|]/g, '_');
        const filePath = `${safeName}.html`;
        fs.writeFileSync(filePath, html.trim(), 'utf-8');

        console.log('\n===== 제목 =====');
        console.log(title);
        console.log('\n===== HTML 본문 (티스토리 HTML 모드에 붙여넣기) =====');
        console.log(html.trim());
        console.log('\n===== 태그 =====');
        console.log(tags.join(', '));
        console.log(`\n✅ 생성 완료: ${filePath}`);
    } catch (err) {
        console.error('❌ 에러:', err.response?.data || err.message || err);
    }
})();
