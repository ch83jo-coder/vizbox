"""Generate the Korean, Japanese and English pages from data.json.

Run from any directory: python3 tesla-care/scripts/build.py
Korean lives at /, Japanese at /ja/, English at /en/.
Amazon links are search links on the store for each language. Put your
Associates tags in TAGS; every link picks them up on the next build.
"""
import html,json
from pathlib import Path
from urllib.parse import quote_plus
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://tesla.play-labo.com'
LANGS=['ko','ja','en']
STORE={'ko':'us','ja':'jp','en':'us'}
STORES={'jp':'https://www.amazon.co.jp','us':'https://www.amazon.com'}
TAGS={'jp':'','us':''}
data=json.loads((ROOT/'data.json').read_text())
e=lambda s:html.escape(str(s),quote=True)
T={
 'brand':{'ko':'모델3 셀프 정비','ja':'モデル3 セルフ整備','en':'Model 3 DIY Care'},
 'tagline':{'ko':'테슬라 입문자를 위한 쉬운 정비 가이드','ja':'テスラ初心者のためのやさしい整備ガイド','en':'Easy maintenance guides for new Tesla owners'},
 'hero':{'ko':'처음이어도 괜찮아요.<br>직접 해 보는 Model 3 관리','ja':'はじめてでも大丈夫。<br>自分でできるモデル3のお手入れ','en':'New to it? No problem.<br>Model 3 care you can do yourself'},
 'heroLead':{'ko':'공구 없이 집에서 할 수 있는 기본 정비를 단계별로 안내하고, 필요한 용품을 함께 추천합니다.','ja':'工具なしで自宅でできる基本の整備を手順ごとに案内し、必要な用品もあわせて紹介します。','en':'Step-by-step guides to basic upkeep you can do at home without tools, with the supplies you need.'},
 'guides':{'ko':'정비 가이드','ja':'整備ガイド','en':'Guides'},
 'min':{'ko':'약 {}분','ja':'約{}分','en':'About {} min'},
 'read':{'ko':'가이드 보기 →','ja':'ガイドを見る →','en':'Read the guide →'},
 'steps':{'ko':'따라 하기','ja':'手順','en':'Steps'},
 'careful':{'ko':'주의하세요','ja':'注意','en':'Be careful'},
 'versions':{'ko':'연식별 차이','ja':'年式による違い','en':'By model year'},
 'products':{'ko':'추천 용품','ja':'おすすめ用品','en':'Recommended supplies'},
 'productsLead':{'ko':'고르는 기준과 함께 아마존 검색 결과로 연결합니다. 구매 전 상품 설명에서 규격을 꼭 확인하세요.','ja':'選び方とあわせてAmazonの検索結果にリンクしています。購入前に商品説明で規格を必ず確認してください。','en':'Each pick comes with what to look for and links to Amazon search results. Check the specs in the listing before you buy.'},
 'buy':{'ko':'Amazon.com에서 찾기 ↗','ja':'Amazonで探す ↗','en':'Find on Amazon ↗'},
 'liquid':{'ko':'액체류는 해외 배송이 제한될 수 있어 국내 쇼핑몰이나 마트에서 사는 편이 쉽습니다.','ja':'','en':''},
 'koStore':{'ko':'한국에서는 Amazon.com(해외 직구)으로 연결됩니다.','ja':'','en':''},
 'sources':{'ko':'참고 자료','ja':'参考資料','en':'Sources'},
 'home':{'ko':'홈','ja':'ホーム','en':'Home'},
 'next':{'ko':'다음 가이드','ja':'次のガイド','en':'Next guide'},
 'disclaimer':{'ko':'이 사이트는 Tesla와 관계없는 개인 사이트입니다. 내용은 Model 3 오너스 매뉴얼을 바탕으로 정리했지만, 차량과 소프트웨어 버전에 따라 다를 수 있으니 차량의 매뉴얼과 표시를 우선하세요.','ja':'このサイトはTesla社とは関係のない個人サイトです。内容はモデル3のオーナーズマニュアルをもとにまとめていますが、車両やソフトウェアのバージョンによって異なる場合があるため、お使いの車両のマニュアルと表示を優先してください。','en':'This is an independent site, not affiliated with Tesla. Guides are based on the Model 3 Owner\'s Manual, but details can differ by vehicle and software version, so your car\'s manual and screens come first.'},
 'affiliate':{'ko':'아마존 링크에는 제휴 링크가 포함될 수 있으며, 구매 시 사이트 운영자가 수수료를 받을 수 있습니다.','ja':'Amazonへのリンクにはアフィリエイトリンクが含まれる場合があり、購入時にサイト運営者が紹介料を受け取ることがあります。','en':'Amazon links may be affiliate links; the site may earn a commission on purchases.'},
 'conv':{'ko':'공기압 단위 변환','ja':'空気圧の単位換算','en':'Pressure unit converter'},
 'convLead':{'ko':'라벨과 게이지의 단위가 다를 때 쓰세요.','ja':'ラベルとゲージの単位が違うときに使ってください。','en':'Use it when the label and your gauge use different units.'},
 'value':{'ko':'값','ja':'数値','en':'Value'},
 'unit':{'ko':'단위','ja':'単位','en':'Unit'},
 'langName':{'ko':'한국어','ja':'日本語','en':'English'},
 'title':{'ko':'모델3 셀프 정비 | 테슬라 입문자 가이드','ja':'モデル3 セルフ整備 | テスラ初心者ガイド','en':'Model 3 DIY Care | Guides for new Tesla owners'},
}
t=lambda key,lang:T[key][lang]
def url(lang,path=''):return ('/' if lang=='ko' else f'/{lang}/')+path
def amazon(lang,query):
    store=STORE[lang];tag=TAGS[store]
    return f'{STORES[store]}/s?k={quote_plus(query[store])}'+(f'&tag={quote_plus(tag)}' if tag else '')
ICONS={
 'washer':'<path d="M12 3c3 4 6 7.3 6 10.5A6 6 0 0 1 6 13.5C6 10.3 9 7 12 3z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
 'wiper':'<path d="M3 19a13 13 0 0 1 18 0"/><path d="M12 19 7 8"/><path d="M5.6 9.2 8.4 6.8"/>',
 'tire':'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5"/>',
 'warn':'<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.3"/>',
 'cart':'<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M3 4h2.5l2.2 11h10.6l2-8H6.3"/>',
}
icon=lambda name,cls='icon':f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'
def shell(lang,path,title,description,body):
    canonical=ORIGIN+url(lang,path)
    alternates=''.join(f'<link rel="alternate" hreflang="{l}" href="{ORIGIN+url(l,path)}">' for l in LANGS)+f'<link rel="alternate" hreflang="x-default" href="{ORIGIN+url("ko",path)}">'
    switch=''.join(f'<a href="{url(l,path)}" lang="{l}" hreflang="{l}"'+(' aria-current="true"' if l==lang else '')+f'>{t("langName",l)}</a>' for l in LANGS)
    footer=f'<footer><p>{e(t("disclaimer",lang))}</p><p>{e(t("affiliate",lang))}</p><p>© Model 3 DIY Care</p></footer>'
    return f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0f172a"><title>{e(title)}</title><meta name="description" content="{e(description)}"><link rel="canonical" href="{canonical}">{alternates}<meta property="og:type" content="website"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{canonical}"><meta name="twitter:card" content="summary"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"></head><body>
<header class="top"><a class="brand" href="{url(lang)}"><span class="logo" aria-hidden="true">{icon("tire","logo-icon")}</span><span>{e(t("brand",lang))}<small>{e(t("tagline",lang))}</small></span></a><nav class="langs" aria-label="Language">{switch}</nav></header>
<main>{body}</main>{footer}</body></html>'''
def guide_card(lang,g):
    return f'<a class="card" href="{url(lang,"guides/"+g["slug"]+"/")}"><span class="card-icon">{icon(g["icon"])}</span><h3>{e(g["title"][lang])}</h3><p>{e(g["summary"][lang])}</p><span class="meta">{t("min",lang).format(g["minutes"])} · {t("read",lang)}</span></a>'
def product_card(lang,p):
    note=t('liquid',lang) if p.get('liquid') else ''
    return f'<li class="product"><span class="product-icon">{icon("cart")}</span><div><h3>{e(p["name"][lang])}</h3><p>{e(p["why"][lang])}</p>'+(f'<p class="note">{e(note)}</p>' if note else '')+f'<a class="buy" href="{e(amazon(lang,p["query"]))}" target="_blank" rel="sponsored nofollow noopener">{t("buy",lang)}</a></div></li>'
def converter(lang):
    return f'''<section class="box converter" aria-labelledby="conv-title"><h2 id="conv-title">{e(t("conv",lang))}</h2><p>{e(t("convLead",lang))}</p><div class="conv-row"><label>{e(t("value",lang))}<input id="conv-value" type="number" inputmode="decimal" value="42" min="0" step="0.1"></label><label>{e(t("unit",lang))}<select id="conv-unit"><option value="psi">psi</option><option value="kpa">kPa</option><option value="bar">bar</option></select></label></div><output id="conv-out" for="conv-value conv-unit" aria-live="polite"></output></section>
<script>(()=>{{const v=document.getElementById('conv-value'),u=document.getElementById('conv-unit'),o=document.getElementById('conv-out'),k={{psi:6.894757,kpa:1,bar:100}};function r(){{const n=parseFloat(v.value);if(!isFinite(n)){{o.textContent='';return}}const p=n*k[u.value];o.textContent=`${{(p/k.psi).toFixed(1)}} psi = ${{Math.round(p)}} kPa = ${{(p/100).toFixed(2)}} bar`}}v.addEventListener('input',r);u.addEventListener('change',r);r()}})()</script>'''
def guide_page(lang,g,nxt):
    facts=''.join(f'<div><dt>{e(f["label"][lang])}</dt><dd>{e(f["value"][lang])}</dd></div>' for f in g['facts'])
    steps=''.join(f'<li>{e(s[lang])}</li>' for s in g['steps'])
    warns=''.join(f'<li>{e(w[lang])}</li>' for w in g['warnings'])
    versions=f'<section class="box versions"><h2>{e(t("versions",lang))}</h2><p>{e(g["versions"][lang])}</p></section>' if g.get('versions') else ''
    store_note=f'<p class="note">{e(t("koStore",lang))}</p>' if t('koStore',lang) else ''
    sources=''.join(f'<li><a href="{e(s["url"])}" target="_blank" rel="noopener">{e(s["label"])}</a></li>' for s in data['sources'])
    body=f'''<article class="guide"><nav class="crumbs" aria-label="breadcrumb"><a href="{url(lang)}">{e(t("home",lang))}</a> › <span>{e(g["title"][lang])}</span></nav>
<header class="guide-head"><span class="card-icon big">{icon(g["icon"])}</span><div><p class="eyebrow">Model 3 · {t("min",lang).format(g["minutes"])}</p><h1>{e(g["title"][lang])}</h1><p class="lead">{e(g["summary"][lang])}</p></div></header>
<dl class="facts">{facts}</dl>{versions}
<section><h2>{e(t("steps",lang))}</h2><ol class="steps">{steps}</ol></section>
<section class="box warn"><h2>{icon("warn")}{e(t("careful",lang))}</h2><ul>{warns}</ul></section>
{converter(lang) if g.get("converter") else ""}
<section><h2>{e(t("products",lang))}</h2><p class="muted">{e(t("productsLead",lang))}</p>{store_note}<ul class="products">{''.join(product_card(lang,p) for p in g["products"])}</ul></section>
<section class="sources"><h2>{e(t("sources",lang))}</h2><ul>{sources}</ul></section>
<a class="next" href="{url(lang,"guides/"+nxt["slug"]+"/")}"><small>{e(t("next",lang))}</small>{e(nxt["title"][lang])} →</a></article>'''
    return shell(lang,f'guides/{g["slug"]}/',f'{g["title"][lang]} | {t("brand",lang)}',g['summary'][lang],body)
def home(lang):
    body=f'''<section class="hero"><p class="eyebrow">TESLA MODEL 3</p><h1>{t("hero",lang)}</h1><p class="lead">{e(t("heroLead",lang))}</p></section>
<section><h2>{e(t("guides",lang))}</h2><div class="cards">{''.join(guide_card(lang,g) for g in data["guides"])}</div></section>'''
    return shell(lang,'',t('title',lang),t('heroLead',lang),body)
def write(lang,path,content):
    target=ROOT/('' if lang=='ko' else lang)/path/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
pages=[]
for lang in LANGS:
    write(lang,'',home(lang));pages.append('')
    guides=data['guides']
    for i,g in enumerate(guides):
        write(lang,f'guides/{g["slug"]}/',guide_page(lang,g,guides[(i+1)%len(guides)]))
paths=['']+[f'guides/{g["slug"]}/' for g in data['guides']]
sitemap=''.join(f'<url><loc>{ORIGIN+url(lang,p)}</loc>'+''.join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{ORIGIN+url(l,p)}"/>' for l in LANGS)+'</url>' for p in paths for lang in LANGS)
(ROOT/'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">{sitemap}</urlset>\n')
(ROOT/'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {ORIGIN}/sitemap.xml\n')
(ROOT/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0f172a"/><g fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/></g></svg>')
print('Generated',len(paths)*len(LANGS),'pages in',len(LANGS),'languages.')
