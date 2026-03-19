/**
 * 공개 사이트 URL (HTTPS, 끝 슬래시 없음)
 * 도메인 변경 시 이 파일만 수정한 뒤
 *   node generate-sitemap.js
 *   node build-district-pages.js
 *   (필요 시) node build-detail-pages.js
 */
const SITE_ORIGIN = 'https://outcallmassage.co.kr';

module.exports = { SITE_ORIGIN };
