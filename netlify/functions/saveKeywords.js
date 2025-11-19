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
    // POST 외에는 거절
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // body 파싱
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

    const store = getStore('keywords-store');

    // 기존 리스트 불러오기 (에러 나면 그냥 빈 배열로)
    let list = [];
    try {
        list = (await store.get('list', { type: 'json' })) || [];
    } catch (e) {
        console.error('blobs get error:', e);
        list = [];
    }

    // 중복 키워드 방지 (같은 키워드 있으면 에러)
    if (list.some((item) => item.keyword === keyword)) {
        return { statusCode: 400, body: 'duplicate keyword' };
    }

    // 🔥 대표 상품 썸네일 추출 (실패해도 키워드는 저장되게 try/catch)
    let thumbUrl = null;
    let bestProductName = null;

    try {
        const raw = await coupang.searchProducts(keyword, 20);

        // 응답 형태가 배열이 아닐 수도 있으니 안전하게 변환
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
                const reviews = (p.reviewCount ?? p.ratingCount ?? 0);
                const bestReviews = (best.reviewCount ?? best.ratingCount ?? 0);
                if (reviews > bestReviews) {
                    best = p;
                }
            }

            thumbUrl = best.imageUrl || null;
            bestProductName = best.productName || null;
        }
    } catch (e) {
        console.error('thumbnail fetch error:', e);
        // 썸네일 못 구해도 그냥 넘어감
    }

    const item = {
        id: randomUUID(),
        keyword,
        slug: makeSlug(keyword),
        imageUrl: thumbUrl,      // 인덱스 카드에서 쓸 대표 이미지
        bestProductName,         // (필요하면 나중에 써먹을 수 있음)
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
