// netlify/functions/keywords.js

// ✅ Netlify Blobs 사용해서 키워드 리스트를 영구 저장
//    npm install @netlify/blobs 한 뒤에 사용 가능
const { getStore } = require("@netlify/blobs");

// Blobs에서 사용할 스토어 이름 / 키 이름
const STORE_NAME = "keywords-store";
const KEY_NAME = "keywords-list";

// 초기 기본 키워드 (Blobs에 아무것도 없을 때 1회용으로만 사용)
const DEFAULT_KEYWORDS = [
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

// ---------- Blobs 래퍼 함수들 ----------

// Blobs에서 키워드 리스트 읽기
async function loadKeywords() {
    const store = getStore(STORE_NAME);

    // type: "json" 으로 저장된 JSON을 바로 객체로 받기 
    const data = await store.get(KEY_NAME, { type: "json" });

    // 아직 아무것도 저장 안 된 경우 → 기본 키워드 리턴
    if (!data) {
        return DEFAULT_KEYWORDS;
    }

    if (Array.isArray(data)) {
        return data;
    }

    // 혹시라도 이상한 데이터가 들어있으면 비워버리고 시작
    return [];
}

// Blobs에 키워드 리스트 저장
async function saveKeywords(list) {
    const store = getStore(STORE_NAME);
    // JSON 통째로 저장 (setJSON) 
    await store.setJSON(KEY_NAME, list);
}

// ---------- HTTP 핸들러 ----------

exports.handler = async (event) => {
    const method = event.httpMethod;

    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // CORS preflight
    if (method === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    // GET / .netlify/functions/keywords  → 전체 키워드 목록 조회
    if (method === "GET") {
        try {
            const keywords = await loadKeywords();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(keywords),
            };
        } catch (e) {
            console.error("GET /keywords error", e);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Internal Server Error" }),
            };
        }
    }

    // POST / .netlify/functions/keywords  → 키워드 추가
    // body: { "title": "게이밍 마우스 추천" }
    if (method === "POST") {
        try {
            const body = JSON.parse(event.body || "{}");
            const rawTitle = body.title || "";
            const title = rawTitle.trim();

            if (!title) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: "title is required" }),
                };
            }

            // slug: 공백 → - , URL 인코딩
            const slug = encodeURIComponent(title.replace(/\s+/g, "-"));

            let keywords = await loadKeywords();

            // 중복 체크
            if (keywords.some((k) => k.slug === slug)) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: "already exists", slug }),
                };
            }

            const item = { title, slug };
            keywords.push(item);

            await saveKeywords(keywords);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(item),
            };
        } catch (e) {
            console.error("POST /keywords error", e);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Internal Server Error" }),
            };
        }
    }

    // DELETE / .netlify/functions/keywords  → 키워드 삭제
    // body: { "slug": "게이밍-마우스-추천" }
    if (method === "DELETE") {
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

            let keywords = await loadKeywords();
            const before = keywords.length;

            keywords = keywords.filter((k) => k.slug !== slug);

            await saveKeywords(keywords);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    deleted: before !== keywords.length,
                }),
            };
        } catch (e) {
            console.error("DELETE /keywords error", e);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Internal Server Error" }),
            };
        }
    }

    // 그 외 메서드
    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" }),
    };
};
