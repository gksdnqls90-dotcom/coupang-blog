// netlify/functions/keywords.js

// ⚠️ 현재는 메모리에만 저장되는 예시입니다.
// Netlify가 함수를 재시작하면 아래 초기값으로 리셋될 수 있습니다.
// 구조 잡는 용도로 쓰고, 나중에 DB/Blobs로 빼면 완벽해짐.

let keywords = [
    { title: "게이밍 마우스 추천", slug: "게이밍-마우스-추천" },
    { title: "게이밍 키보드 추천", slug: "게이밍-키보드-추천" },
    { title: "과일 추천", slug: "과일-추천" },
    { title: "과자 추천", slug: "과자-추천" },
    { title: "냉동식품 추천", slug: "냉동식품-추천" },
    { title: "덴탈 마스크 추천", slug: "덴탈-마스크-추천" },
    { title: "무선 이어폰 추천", slug: "무선-이어폰-추천" },
    { title: "버터 추천", slug: "버터-추천" },
    { title: "벽걸이 시계 추천", slug: "벽걸이-시계-추천" },
    { title: "아이폰 추천", slug: "아이폰-추천" },
    { title: "우유 추천", slug: "우유-추천" },
    { title: "전자제품 엑세서리 추천", slug: "전자제품-엑세서리-추천" },
    { title: "주방용 칼 추천", slug: "주방용-칼-추천" },
    { title: "쿠팡 인기 제품 추천", slug: "쿠팡-인기-제품-추천" },
];

exports.handler = async (event) => {
    const method = event.httpMethod;

    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    if (method === "GET") {
        // 키워드 목록 조회
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(keywords),
        };
    }

    if (method === "POST") {
        // 키워드 추가
        try {
            const body = JSON.parse(event.body || "{}");
            const title = (body.title || "").trim();
            if (!title) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: "title is required" }),
                };
            }

            const slug = encodeURIComponent(title.replace(/\s+/g, "-"));
            if (keywords.some((k) => k.slug === slug)) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: "already exists", slug }),
                };
            }

            const item = { title, slug };
            keywords.push(item);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(item),
            };
        } catch (e) {
            console.error(e);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Internal Server Error" }),
            };
        }
    }

    if (method === "DELETE") {
        // 키워드 삭제
        try {
            const body = JSON.parse(event.body || "{}");
            const slug = body.slug;
            if (!slug) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: "slug is required" }),
                };
            }

            const before = keywords.length;
            keywords = keywords.filter((k) => k.slug !== slug);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ deleted: before !== keywords.length }),
            };
        } catch (e) {
            console.error(e);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Internal Server Error" }),
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" }),
    };
};
