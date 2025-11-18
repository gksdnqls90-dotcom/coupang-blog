const { getStore } = require('@netlify/blobs');
const { randomUUID } = require('crypto');

function makeSlug(keyword) {
    const base = keyword.trim().replace(/\s+/g, '-');
    return encodeURIComponent(base);
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const keyword = (body.keyword || '').trim();

    if (!keyword) {
        return { statusCode: 400, body: 'keyword is required' };
    }

    const store = getStore('keywords-store');
    const list = await store.get('list', { type: 'json' }) || [];

    const item = {
        id: randomUUID(),
        keyword,
        slug: makeSlug(keyword)
    };

    list.push(item);
    await store.setJSON('list', list);

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(item)
    };
};
