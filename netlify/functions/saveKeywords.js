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

    // Blobs 스토어 핸들
    const store = getStore({
        name: 'keywords',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN,
    });

    // 기존 리스트 불러오기
    let list = [];
    try {
        list = (await store.get('list', { type: 'json' })) || [];
    } catch (e) {
        console.error('[saveKeywords] blobs get error:', e);
        list = [];
    }

    // 중복 키워드 방지
    if (list.some((item) => item.keyword === keyword)) {
        return { statusCode: 400, body: 'duplicate keyword' };
    }

    // 🔥 대표 상품 썸네일 추출 (실패해도 키워드는 저장되게 try/catch)
    let thumbUrl = null;
    let bestProductName = null;

    try {
        const raw = await coupang.searchProducts(keyword);

        console.log(
            '[saveKeywords] coupang raw sample:',
            JSON.stringify(raw).slice(0, 1500)
        );

        // rCode 체크: 에러면 바로 패스
        if (raw.rCode !== '0') {
            console.log('[saveKeywords] coupang api error:', raw.rMessage);
        } else {
            // 정상일 때 data.productData 에서 상품 배열 꺼내기
            let products = [];

            if (raw.data && Array.isArray(raw.data.productData)) {
                products = raw.data.productData;
            } else if (Array.isArray(raw.productData)) {
                products = raw.productData;
            }

            if (products.length > 0) {
                let best = products[0];

                for (const p of products) {
                    const reviews = p.reviewCount ?? p.ratingCount ?? 0;
                    const bestReviews = best.reviewCount ?? best.ratingCount ?? 0;
                    if (reviews > bestReviews) {
                        best = p;
                    }
                }

                thumbUrl =
                    best.productImage ??
                    best.productImageUrl ??
                    best.imageUrl ??
                    best.productImageLarge ??
                    null;

                bestProductName = best.productName ?? best.itemName ?? null;
            }
        }

        console.log('[saveKeywords] thumbnail selected:', {
            keyword,
            hasImage: !!thumbUrl,
            bestProductName,
        });
    } catch (e) {
        console.error('[saveKeywords] thumbnail fetch error:', e);
    }

    const item = {
        id: randomUUID(),
        keyword,
        slug: makeSlug(keyword),
        imageUrl: thumbUrl, // 인덱스에서 쓸 이미지
        bestProductName,
    };

    // 리스트에 추가 + 저장
    try {
        list.push(item);
        await store.setJSON('list', list);
    } catch (e) {
        console.error('[saveKeywords] blobs set error:', e);
        return { statusCode: 500, body: 'blob save error' };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(item),
    };
};
