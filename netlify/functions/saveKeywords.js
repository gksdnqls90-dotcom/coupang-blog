// netlify/functions/saveKeywords.js

const { getStore, connectLambda } = require('@netlify/blobs');
const { randomUUID } = require('crypto');
const CoupangPartners = require('../../CoupangPartners');

const coupang = new CoupangPartners();

function makeSlug(keyword) {
    const base = keyword.trim().replace(/\s+/g, '-');
    return encodeURIComponent(base);
}

exports.handler = async (event) => {
    // Blobs 초기화 (netlify dev / lambda 환경용)
    connectLambda(event);

    // POST 외에는 거절
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: 'Method Not Allowed',
        };
    }

    // body 파싱
    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: 'invalid json',
        };
    }

    const keyword = (body.keyword || '').trim();
    if (!keyword) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: 'keyword is required',
        };
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

    if (!Array.isArray(list)) list = [];

    // 중복 키워드 방지(키워드 기준)
    const exist = list.find((item) => item.keyword === keyword);
    if (exist) {
        // ➜ 더 이상 400 말고 200 + duplicated 플래그
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                ok: true,
                duplicated: true,
                item: exist,
            }),
        };
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

        if (raw && raw.rCode === '0') {
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
        } else {
            console.log(
                '[saveKeywords] coupang api error:',
                raw && (raw.rMessage || raw.message || raw.rCode)
            );
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
        createdAt: new Date().toISOString(),
    };

    // 리스트에 추가 + 저장
    try {
        list.push(item);
        await store.setJSON('list', list);
    } catch (e) {
        console.error('[saveKeywords] blobs set error:', e);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: 'blob save error',
        };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ ok: true, duplicated: false, item }),
    };
};
