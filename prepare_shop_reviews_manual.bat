@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [1/4] 수동 작성 템플릿 생성
python -u manual_shop_reviews.py init --all --per-shop 3 --seed-drafts --overwrite || exit /b 1
echo.
echo [안내] 이제 manual-shop-reviews.json 을 열어서 comment를 업체별로 직접 다듬어 주세요.
echo [안내] 작성이 끝나면 아무 키나 누르면 반영을 계속합니다.
pause
echo.
echo [2/4] 수동 후기 반영
python -u manual_shop_reviews.py apply --strict-unique || exit /b 1
echo.
echo [3/4] 상세 페이지 재생성
node build-detail-pages.js || exit /b 1
echo.
echo [4/4] sitemap 갱신
node generate-sitemap.js || exit /b 1
echo.
echo 완료: 수동 후기 + 상세 페이지 + sitemap 반영
pause

