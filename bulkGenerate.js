const { execSync } = require('child_process');

const keywords = [
    '주방용 칼 추천',
    '우유 추천',
    '버터 추천',
    '냉동식품 추천',
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
