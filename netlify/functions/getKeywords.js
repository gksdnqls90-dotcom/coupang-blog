const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
    const store = getStore('keywords-store');
    const list = await store.get('list', { type: 'json' }) || [];

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(list)
    };
};
