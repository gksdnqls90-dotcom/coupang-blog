// netlify/functions/saveKeywords.js
const { getStore } = require('@netlify/blobs');
const { randomUUID } = require('crypto');
const CoupangPartners = require('../../CoupangPartners');

const coupang = new CoupangPartners();

function makeSlug(keyword) {
    const base = keyword.trim().replace(/\s+/g, '-');
    return encodeURIComponent(base);
}

exports.handler = async (event) => {
    // POST만 허용
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return { statusCode: 400, body: 'invalid json' };
    }

    const keyword = (body.keyword || '').trim();
    if (!keyword) {
        return { statusCode: 400, body: 'keyword is required' };
    }

    // Blobs 스토어
    const store = getStore({
        name: 'keywords',                      // 스토어 이름
        siteID: process.env.NETLIFY_SITE_ID,   // 환경변수에서 가져옴
        token: process.env.NETLIFY_API_TOKEN,
    });

    // 기존 리스트 불러오기
    let list = [];
    try {
        list = (await store.get('list', { type: 'json' })) || [];
    } catch (e) {
        console.error('blobs get error:', e);
        list = [];
    }

    // 중복 키워드 방지
    if (list.some((item) => item.keyword === keyword)) {
        return { statusCode: 400, body: 'duplicate keyword' };
    }

    // 🔥 쿠팡에서 대표 상품 썸네일 뽑기 (실패해도 키워드는 저장되게)
    let thumbUrl = null;
    let bestProductName = null;

    try {
        const raw = await coupang.searchProducts(keyword, 20);

        // 응답 형태 정규화
        let products = raw;
        if (!Array.isArray(products)) {
            products =
                raw?.productData ||
                raw?.data ||
                raw?.rData ||
                [];
        }

        if (Array.isArray(products) && products.length > 0) {
            let best = products[0];

            for (const p of products) {
                const reviews = p.reviewCount ?? p.ratingCount ?? 0;
                const bestReviews = best.reviewCount ?? best.ratingCount ?? 0;
                if (reviews > bestReviews) {
                    best = p;
                }
            }

            thumbUrl = best.imageUrl || null;
            bestProductName = best.productName || null;
        }
    } catch (e) {
        console.error('thumbnail fetch error:', e);
        // 썸네일 못 구해도 그냥 진행
    }

    // 저장될 아이템
    const item = {
        id: randomUUID(),
        keyword,
        slug: makeSlug(keyword),
        imageUrl: thumbUrl,        // 인덱스 카드에서 쓸 대표 이미지
        bestProductName,           // 나중에 필요하면 사용
    };

    // 리스트에 추가 + 저장
    try {
        list.push(item);
        await store.setJSON('list', list);
    } catch (e) {
        console.error('blobs set error:', e);
        return { statusCode: 500, body: 'blob save error' };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(item),
    };
};
