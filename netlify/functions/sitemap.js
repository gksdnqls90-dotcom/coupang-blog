// netlify/functions/sitemap.js
const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
    try {
        // Netlify Blobs 초기화 (Lambda 모드)
        connectLambda(event);

        // Netlify에서 자동으로 주는 사이트 URL이 있으면 그걸 쓰고,
        // 없으면 icbhplus 도메인을 기본값으로 사용
        const baseUrl = process.env.URL || 'https://icbhplus.com';

        const store = getStore('keywords-store');
        const list = (await store.get('list', { type: 'json' })) || [];

        // 항상 포함하고 싶은 기본 페이지들
        const urls = [
            {
                loc: `${baseUrl}/`,
                changefreq: 'daily',
                priority: '1.0',
            },
        ];

        // 키워드별 live 페이지 추가
        list.forEach((item) => {
            if (!item || !item.slug) return;
            const slug = item.slug;
            urls.push({
                loc: `${baseUrl}/live/${encodeURIComponent(slug)}`,
                changefreq: 'weekly',
                priority: '0.8',
            });
        });

        // XML 문자열 구성
        const lines = [];
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

        urls.forEach((u) => {
            lines.push('  <url>');
            lines.push(`    <loc>${u.loc}</loc>`);
            lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
            lines.push(`    <priority>${u.priority}</priority>`);
            lines.push('  </url>');
        });

        lines.push('</urlset>');

        const xml = lines.join('\n');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
            },
            body: xml,
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: `ERROR generating sitemap:\n${e && e.stack ? e.stack : e}`,
        };
    }
};
