// netlify/functions/saveKeywords.js
const { getStore, connectLambda } = require('@netlify/blobs');
const { randomUUID } = require('crypto');

function makeSlug(keyword) {
    const base = keyword.trim().replace(/\s+/g, '-');
    return encodeURIComponent(base);
}

exports.handler = async (event) => {
    // ★ Lambda + Blobs 환경 초기화
    connectLambda(event);

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const keyword = (body.keyword || '').trim();

    if (!keyword) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'keyword is required' }),
        };
    }

    const store = getStore('keywords-store');

    // 기존 리스트 불러오기
    const list = (await store.get('list', { type: 'json' })) || [];

    const item = {
        id: randomUUID(),
        keyword,
        slug: makeSlug(keyword),
    };

    list.push(item);

    // JSON으로 통째 저장
    await store.setJSON('list', list);

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(item),
    };
};
