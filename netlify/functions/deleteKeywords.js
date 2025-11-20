// netlify/functions/deleteKeywords.js
const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
    connectLambda(event);

    if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return { statusCode: 400, body: 'invalid json' };
    }

    const id = body.id;
    if (!id) {
        return { statusCode: 400, body: 'id is required' };
    }

    const store = getStore({
        name: 'keywords',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN,
    });

    let list = (await store.get('list', { type: 'json' })) || [];
    if (!Array.isArray(list)) list = [];

    const beforeLen = list.length;
    list = list.filter((item) => item.id !== id);
    const deleted = beforeLen !== list.length;

    await store.setJSON('list', list);

    console.log('[deleteKeywords] deleted:', deleted, 'id:', id);

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ ok: true, deleted }),
    };
};
