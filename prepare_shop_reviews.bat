@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [1/3] shops.json 이용후기 자동 보강
python -u build_shop_reviews.py %* || exit /b 1
echo.
echo [2/3] 상세 페이지 재생성 (이용후기 반영)
node build-detail-pages.js || exit /b 1
echo.
echo [3/3] sitemap 갱신
node generate-sitemap.js || exit /b 1
echo.
echo 완료: 이용후기 + 상세페이지 + sitemap 반영
pause

