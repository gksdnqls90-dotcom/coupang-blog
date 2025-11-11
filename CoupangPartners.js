const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const ACCESS_KEY = process.env.CP_ACCESS_KEY;
const SECRET_KEY = process.env.CP_SECRET_KEY;
const DOMAIN = 'https://api-gateway.coupang.com';

function generateHmac(method, uri, accessKey, secretKey) {
    const [path, query = ''] = uri.split('?');

    const now = new Date();
    const yyyy = now.getUTCFullYear().toString().slice(2);
    const MM = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const HH = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    const datetime = `${yyyy}${MM}${dd}T${HH}${mm}${ss}Z`;

    const message = datetime + method + path + query;

    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(message)
        .digest('hex');

    return `CEA algorithm=HmacSHA256,access-key=${accessKey},signed-date=${datetime},signature=${signature}`;
}

class CoupangPartners {
    constructor() {
        if (!ACCESS_KEY || !SECRET_KEY) {
            throw new Error('CP_ACCESS_KEY 또는 CP_SECRET_KEY가 없습니다. .env를 확인하세요.');
        }
        this.accessKey = ACCESS_KEY;
        this.secretKey = SECRET_KEY;
    }

    async searchProducts(keyword, limit = 10) {
        if (!limit || limit < 1 || limit > 100) limit = 10;

        const uri =
            `/v2/providers/affiliate_open_api/apis/openapi/products/search` +
            `?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;

        const authorization = generateHmac('GET', uri, this.accessKey, this.secretKey);

        const res = await axios.get(`${DOMAIN}${uri}`, {
            headers: {
                Authorization: authorization,
                'Content-Type': 'application/json',
            },
        });
        return res.data;
    }
}

module.exports = CoupangPartners;
