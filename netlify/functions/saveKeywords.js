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
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const keyword = (body.keyword || '').trim();

        if (!keyword) {
            return { statusCode: 400, body: 'keyword is required' };
        }

        const store = getStore('keywords-store');
        const list = (await store.get('list', { type: 'json' })) || [];

        // 중복 체크 (같은 키워드 이미 있으면 막기)
        if (list.some((item) => item.keyword === keyword)) {
            return {
                statusCode: 400,
                body: 'duplicate keyword',
            };
        }

        // 🔥 대표 상품(리뷰 많은 제품) 썸네일 찾기
        let thumbUrl = null;
        let bestProductName = null;

        try {
            const products = await coupang.searchProducts(keyword, 20);

            if (Array.isArray(products) && products.length > 0) {
                let best = products[0];

                for (const p of products) {
                    const reviews =
                        (p.reviewCount ?? p.ratingCount ?? 0);
                    const bestReviews =
                        (best.reviewCount ?? best.ratingCount ?? 0);

                    if (reviews > bestReviews) {
                        best = p;
                    }
                }

                thumbUrl = best.imageUrl || null;
                bestProductName = best.productName || null;
            }
        } catch (e) {
            console.error('thumbnail fetch error:', e);
            // 썸네일 못 구해도 키워드 저장은 계속 진행
        }

        const item = {
            id: randomUUID(),
            keyword,
            slug: makeSlug(keyword),
            // 인덱스 카드에서 쓸 이미지
            imageUrl: thumbUrl,
            bestProductName,
        };

        list.push(item);
        await store.setJSON('list', list);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify(item),
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: 'internal error',
        };
    }
};
