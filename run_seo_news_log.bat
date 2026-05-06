@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [seo_news_bulk_log] 프로젝트 루트에서 실행합니다.
echo 동·읍·면까지 쓰려면 먼저: python build_korea_seo_topic_dongs.py 또는 prepare_seo_daily_logs.bat
echo korea-seo-topic-dongs.json 이 있으면 자동으로 불러옵니다. 전체 실행은 수십 분~수 시간 걸릴 수 있습니다.
echo 중단: Ctrl+C
python -u seo_news_bulk_log.py %*
echo.
pause
