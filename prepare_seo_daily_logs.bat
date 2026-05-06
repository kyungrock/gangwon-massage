@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [1/2] 동·읍·면 맵 생성  (korea-hot-subdistricts.json + shops.json)
python -u build_korea_seo_topic_dongs.py || exit /b 1
echo.
echo [2/2] 일자로그 생성 + districts/regions 페이지 + sitemap 반영 (시간이 매우 오래 걸릴 수 있음)
echo   - 동 맵 있으면 시/군/구+동 처리. 시·구 출장 페이지의 날짜 목록도 이 단계 후 맞춰집니다.
python -u seo_news_bulk_log.py %*
echo.
pause
