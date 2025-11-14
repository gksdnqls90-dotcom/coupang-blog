const { execSync } = require('child_process');

const keywords = [
    '과자 추천',
    '쿠팡 인기 제품 추천',
    '벽걸이 시계 추천',
    '전자제품 엑세서리 추천',
    // 필요한 만큼 추가
];

(async () => {
    for (const keyword of keywords) {
        console.log(`\n▶ "${keyword}" 생성 중...`);
        try {
            execSync(`node generatePost.js "${keyword}"`, { stdio: 'inherit' });
        } catch (e) {
            console.error(`❌ 실패: ${keyword}`, e.message);
        }
    }

    try {
        execSync('git add public', { stdio: 'inherit' });
        execSync('git commit -m "auto: bulk generate posts"', { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });
        console.log('\n🚀 GitHub 푸시 완료 → Netlify 자동 배포');
    } catch (e) {
        console.log('\n⚠️ 커밋할 변경 없거나 git 에러:', e.message);
    }
})();
