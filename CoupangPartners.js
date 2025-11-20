// CoupangPartners.js

const crypto = require('crypto');
const axios = require('axios');

const ACCESS_KEY = process.env.CP_ACCESS_KEY;
const SECRET_KEY = process.env.CP_SECRET_KEY;
const DOMAIN = 'https://api-gateway.coupang.com';

// 👉 이 값만 안전하게 10으로 고정 (계정별 허용 limit 이 10까지인 듯)
const SAFE_LIMIT = 10;

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
            throw new Error(
                'CP_ACCESS_KEY 또는 CP_SECRET_KEY가 없습니다. Netlify 환경변수(.env) 확인해주세요.'
            );
        }
        this.accessKey = ACCESS_KEY;
        this.secretKey = SECRET_KEY;
    }

    async searchProducts(keyword) {
        // limit 은 안전하게 10 고정
        const uri =
            '/v2/providers/affiliate_open_api/apis/openapi/products/search' +
            `?keyword=${encodeURIComponent(keyword)}&limit=${SAFE_LIMIT}`;

        const authorization = generateHmac(
            'GET',
            uri,
            this.accessKey,
            this.secretKey
        );

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
