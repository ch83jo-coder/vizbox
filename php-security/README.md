# PHP Security Brief

2026-10-21 PHP 보안 이슈와 관련된 글로벌 서비스 50개를 한국어·일본어·영어로 정리한 독립 정적 페이지입니다.

- 목록 속 외부 사이트 주소·링크와 외부 폰트를 포함하지 않습니다. Vercel Web Analytics 스크립트는 페이지 방문 통계용으로 포함됩니다.
- `data.json`: 50개 항목과 3개 언어 요약, 출처 원제, 조사 시각.
- 공식 대응 / 보도 및 관련성 추가 확인 / 영향 미확인을 구분합니다. 50개 피해 사이트 목록이 아닙니다.
- 수동 조사 스냅샷이며 실시간 상태·침해·패치 완료를 자동 검사하지 않습니다.
- Wikimedia 등의 하위 서비스를 별도 항목으로 세므로 50개 독립 기업이나 트래픽 상위 50위 목록은 아닙니다.

## 로컬 실행

이 폴더에서 `python3 -m http.server 8080`을 실행하고 로컬 브라우저로 확인합니다. 초기 HTML에 모든 목록이 들어 있으며, 로컬 HTTP 서버로 언어별 경로와 탐색을 확인할 수 있습니다.

## 배포

기존 저장소 규칙대로 이 폴더를 Root Directory로 지정하는 독립 정적 프로젝트입니다. Framework: Other, Build Command: `node scripts/build-seo.mjs`, Output Directory: 현재 폴더. `vercel.json`에 같은 빌드 설정을 포함했습니다.

## 갱신 원칙

운영사 공식 공지를 우선하고, 문서의 계획을 완료 상태로 해석하지 않습니다. 원문에 PHP가 없으면 연관성을 단정하지 않습니다. 원문 날짜와 조사 시각을 분리하고, 두 값을 업데이트할 때 요약·출처도 함께 검토합니다. 주소는 데이터에도 넣지 않습니다.

## Google 검색 SEO

운영 도메인: `php-security.play-labo.com`

- 한국어 `/`, 일본어 `/ja/`, 영어 `/en/`를 독립 HTML로 제공합니다. 자동 언어 리다이렉트 없이 URL의 언어를 유지합니다.
- 요약·50개 서비스·출처가 최초 HTML에 포함됩니다. JavaScript는 검색·필터만 보강합니다.
- 언어별 title/description, canonical, 상호 hreflang, Open Graph, Twitter 메타데이터와 CollectionPage/ItemList JSON-LD를 제공합니다.
- 사이트맵은 이 브리핑의 3개 언어 페이지만 포함하며 목록 속 외부 서비스 주소는 포함하지 않습니다.
- 원본은 `data.json`, `i18n.js`, `scripts/template.html`입니다. 수정 후 `node scripts/build-seo.mjs`로 3개 HTML·robots.txt·sitemap.xml을 재생성합니다. Vercel 빌드에도 같은 명령을 설정했습니다.
- 검색 순위·색인은 보장할 수 없습니다. 배포 후 Google Search Console에서 도메인 소유권을 인증하고 `sitemap.xml` 제출 및 언어별 URL 검사를 진행해야 합니다. 검증 토큰은 발급된 실제 값만 추가합니다.
- 새 SEO 빌드가 과거 조사 내용의 확인 시각을 자동으로 갱신하지 않습니다.

## Web Analytics

Vercel Analytics 스크립트는 `scripts/template.html`에서 관리하며 재생성되는 세 언어 페이지에 각각 한 번 포함됩니다. 통계 수집 상태는 Vercel 프로젝트의 Web Analytics 설정에서 확인합니다.
