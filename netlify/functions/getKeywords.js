// netlify/functions/getKeywords.js

const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
    const store = getStore({
        name: 'keywords',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN,
    });

    let list = [];
    try {
        list = (await store.get('list', { type: 'json' })) || [];
    } catch (e) {
        console.error('[getKeywords] blobs get error:', e);
        list = [];
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(list),
    };
};
