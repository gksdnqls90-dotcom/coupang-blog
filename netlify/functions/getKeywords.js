// netlify/functions/getKeywords.js
const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
    // ★ Blobs 초기화
    connectLambda(event);

    const store = getStore('keywords-store');
    const list = (await store.get('list', { type: 'json' })) || [];

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(list),
    };
};
