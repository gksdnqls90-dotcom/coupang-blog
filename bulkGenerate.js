const { execSync } = require('child_process');

// 여기만 수정해서 원하는 키워드 리스트 관리
const keywords = [
    '아이폰 추천',
    '게이밍 마우스 추천',
    '게이밍 키보드 추천',
    '덴탈 마스크 추천',
    '무선 이어폰 추천'
];

for (const keyword of keywords) {
    console.log(`\n▶ [${keyword}] 포스트 생성 중...`);
    try {
        execSync(`node generatePost.js "${keyword}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`❌ [${keyword}] 생성 실패:`, e.message || e);
    }
}

console.log('\n✅ 모든 키워드 처리 완료');
