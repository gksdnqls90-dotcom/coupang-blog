// netlify/functions/deleteKeywords.js
const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
    // ★ Blobs 초기화
    connectLambda(event);

    if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const id = body.id;

    if (!id) {
        return { statusCode: 400, body: 'id is required' };
    }

    const store = getStore('keywords-store');
    const list = (await store.get('list', { type: 'json' })) || [];

    const newList = list.filter((item) => item.id !== id);
    await store.setJSON('list', newList);

    return { statusCode: 200, body: 'OK' };
};
