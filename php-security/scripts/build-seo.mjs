import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://php-security.play-labo.com';
const copy=vm.runInNewContext(fs.readFileSync(path.join(root,'i18n.js'),'utf8')+';copy');
const data=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));
const template=fs.readFileSync(path.join(root,'scripts/template.html'),'utf8');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const urls={ko:'/',ja:'/ja/',en:'/en/'};
const titles={
 ko:'PHP2Shell 취약점 정리·주요 서비스 50개 대응 현황 | PHP 보안 브리핑',
 ja:'PHP2Shell脆弱性まとめ・主要50サービスの対応状況 | PHP Security Brief',
 en:'PHP2Shell Vulnerabilities: 50 Services and Response Evidence | PHP Security Brief'
};
const descriptions={
 ko:'2026년 10월 21일 PHP2Shell(CVE-2026-109618·CVE-2026-109619) 요약과 PHP 수정 버전. 주요 서비스 50개의 공식 대응·보도·영향 미확인을 구분한 조사 스냅샷입니다. 피해 확인 목록이 아닙니다.',
 ja:'2026年10月21日のPHP2Shell（CVE-2026-109618・CVE-2026-109619）とPHP修正版を整理。主要50サービスの公式対応・報道・影響未確認を区別した調査時点の情報です。被害確認リストではありません。',
 en:'A 21 October 2026 PHP2Shell snapshot covering CVE-2026-109618, CVE-2026-109619, fixed PHP versions and responses across 50 services. Official notices, reporting and unverified impact are distinguished; this is not a confirmed-victim list.'
};
const noscript={ko:'검색 필터는 JavaScript가 필요합니다. 아래 요약과 50개 목록은 그대로 읽을 수 있습니다.',ja:'検索フィルターにはJavaScriptが必要です。概要と50件の一覧はそのまま読めます。',en:'Search filters require JavaScript. The briefing and all 50 entries remain readable.'};
const unverified={ko:'미확인',ja:'未確認',en:'Unverified'};
const navLabel={ko:'언어',ja:'言語',en:'Language'};
const rank={official:0,reported:1,unknown:2};
const sorted=[...data.entries].sort((a,b)=>rank[a.status]-rank[b.status]||a.id-b.id);
function fill(html,id,value){const re=new RegExp(`(<([a-z0-9]+)[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(</\\2>)`);if(!re.test(html))throw Error(`Missing ${id}`);return html.replace(re,(_,open,tag,close)=>open+value+close);}
for(const lang of Object.keys(urls)){
 const t=copy[lang];const prefix=lang==='ko'?'./':'../';const canonical=origin+urls[lang];
 let html=template.replace('<html lang="ko">',`<html lang="${lang}">`);
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(titles[lang])}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(descriptions[lang])}">`);
 const schema={'@context':'https://schema.org','@type':'CollectionPage',name:titles[lang],description:descriptions[lang],url:canonical,inLanguage:lang,dateModified:data.checkedAt,about:[{'@type':'Thing',name:'CVE-2026-109618'},{'@type':'Thing',name:'CVE-2026-109619'}],mainEntity:{'@type':'ItemList',name:t.directoryTitle,numberOfItems:50,itemListElement:sorted.map((e,i)=>({'@type':'ListItem',position:i+1,name:e.names?.[lang]||e.name,description:t.statuses[e.status]+': '+e.summary[lang]}))}};
 const meta=`\n<link rel="canonical" href="${canonical}">\n`+Object.entries(urls).map(([l,u])=>`<link rel="alternate" hreflang="${l}" href="${origin+u}">`).join('\n')+`\n<link rel="alternate" hreflang="x-default" href="${origin}/">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="PHP Security Brief">\n<meta property="og:locale" content="${{ko:'ko_KR',ja:'ja_JP',en:'en_US'}[lang]}">\n<meta property="og:title" content="${escape(titles[lang])}">\n<meta property="og:description" content="${escape(descriptions[lang])}">\n<meta property="og:url" content="${canonical}">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="${escape(titles[lang])}">\n<meta name="twitter:description" content="${escape(descriptions[lang])}">\n<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>\n`;
 html=html.replace('</head>',meta+'</head>').replace(/(href|src)="(style.css|i18n.js|app.js)"/g,`$1="${prefix}$2"`);
 html=html.replace(/<nav[\s\S]*?<\/nav>/,`<nav aria-label="${navLabel[lang]}">`+Object.entries({ko:'한국어',ja:'日本語',en:'English'}).map(([l,label])=>`<a data-lang="${l}" lang="${l}" hreflang="${l}" href="${l==='ko'?prefix:prefix+l+'/'}"${l===lang?' aria-current="page"':''}>${label}</a>`).join('')+'</nav>');
 const mapping={eyebrow:'eyebrow',headline:'title',intro:'intro',date:'date','what-title':'whatTitle',what:'what','patch-title':'patchTitle',patch:'patch','meaning-title':'meaningTitle',meaning:'meaning','directory-title':'directoryTitle',edition:'edition',scope:'scope',reset:'reset','link-policy':'policy',empty:'empty',failure:'failed','method-title':'methodTitle',method:'method','source-title':'sourceTitle',sources:'sources',freshness:'freshness',footer:'footer','region-label':null,'category-label':null};
 for(const [id,key] of Object.entries(mapping))html=fill(html,id,escape(key?t[key]:id==='region-label'?t.regions.all:t.categories.all));
 html=fill(html,'stats',Object.entries(t.statuses).map(([key,label])=>`<div class="stat"><strong>${data.entries.filter(e=>key==='all'||e.status===key).length}</strong><span>${escape(label)}</span></div>`).join(''));
 html=fill(html,'result-count',t.result(data.entries.length));
 html=fill(html,'entries',sorted.map(e=>`<details id="service-${e.id}"><summary><span class="num">${String(e.id).padStart(2,'0')}</span><span class="service"><strong>${escape(e.names?.[lang]||e.name)}</strong><small>${escape(t.regions[e.region])} / ${escape(t.categories[e.category])}</small></span><span class="badge ${e.status}">${escape(t.statuses[e.status])}</span><span class="row-note">${escape(t.more)}</span><span class="chevron" aria-hidden="true">+</span></summary><div class="detail-body"><p>${escape(e.summary[lang])}</p><p class="source">${escape(t.source)}: ${escape(e.source)}</p><p class="source">${escape(t.published)}: ${escape(e.published||unverified[lang])} · ${escape(t.checked)}: 2026-10-21 23:26 JST / KST · ${escape(t.evidence)}</p></div></details>`).join('\n'));
 html=html.replace(/<noscript>[\s\S]*?<\/noscript>/,`<noscript>${escape(noscript[lang])}</noscript>`).replace('</body>',`<script id="brief-data" type="application/json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script></body>`);
 const dest=path.join(root,lang==='ko'?'':lang);fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'index.html'),html);
}
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.values(urls).map(u=>`  <url><loc>${origin+u}</loc><lastmod>${data.checkedAt}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /scripts/\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log('Generated 3 fully rendered pages, canonical/hreflang metadata, structured data, robots.txt and sitemap.xml.');
