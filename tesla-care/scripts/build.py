"""Generate the Korean, Japanese and English pages from data.json.

Run from any directory: python3 tesla-care/scripts/build.py
Korean lives at /, Japanese at /ja/, English at /en/. Under each language:
  /                     pick your car
  /<model>/             everything to buy for that car, and its guides
  /<model>/<guide>/     the guide, with the picks for that car
Amazon links go to Amazon Japan for every language. A product's "link"
(a SiteStripe/amzn.to link) is used as is for every car and language. When a product has a
verified ASIN for a model and store, the link goes straight to it. Put your
Associates tags in TAGS; every link picks them up on the next build.
"""
import html,json
from pathlib import Path
from urllib.parse import quote_plus
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://tesla-care.play-labo.com'
LANGS=['ko','ja','en']
STORE={'ko':'jp','ja':'jp','en':'jp'}
STORES={'jp':'https://www.amazon.co.jp','us':'https://www.amazon.com'}
TAGS={'jp':'','us':''}
data=json.loads((ROOT/'data.json').read_text())
MODELS=data['models'];GUIDES=data['guides'];PHOTOS=data['photos']
e=lambda s:html.escape(str(s),quote=True)
T={
 'brand':{'ko':'테슬라 셀프 정비','ja':'テスラ セルフ整備','en':'Tesla DIY Care'},
 'tagline':{'ko':'테슬라 입문자를 위한 쉬운 정비 가이드','ja':'テスラ初心者のためのやさしい整備ガイド','en':'Easy maintenance guides for new Tesla owners'},
 'hero':{'ko':'내 차를 고르면<br>필요한 것만 알려 드려요','ja':'車を選ぶだけで<br>必要なものがわかる','en':'Pick your car.<br>We\'ll show you exactly what it needs.'},
 'heroLead':{'ko':'워셔액·와이퍼·타이어 공기압. 공구 없이 집에서 할 수 있는 기본 정비를 사진과 그림으로 안내하고, 내 차에 맞는 용품을 바로 고를 수 있게 정리했습니다.','ja':'ウォッシャー液・ワイパー・タイヤ空気圧。工具なしで自宅でできる基本の整備を写真とイラストで案内し、自分の車に合う用品をすぐ選べるようにまとめました。','en':'Washer fluid, wipers and tire pressure: basic upkeep you can do at home without tools, shown with photos and diagrams, plus the right supplies for your car, ready to buy.'},
 'pick':{'ko':'내 차는?','ja':'あなたの車は？','en':'Which one is yours?'},
 'pickLead':{'ko':'앞모습으로 구분할 수 있어요.','ja':'フロントの見た目で見分けられます。','en':'You can tell them apart from the front.'},
 'choose':{'ko':'이 차예요 →','ja':'この車です →','en':'This is my car →'},
 'remember':{'ko':'지난번에 고른 차','ja':'前回選んだ車','en':'Your car'},
 'guides':{'ko':'정비 가이드','ja':'整備ガイド','en':'Guides'},
 'min':{'ko':'약 {}분','ja':'約{}分','en':'About {} min'},
 'read':{'ko':'가이드 보기 →','ja':'ガイドを見る →','en':'Read the guide →'},
 'kit':{'ko':'이것만 사면 됩니다','ja':'これだけ買えばOK','en':'Everything you need'},
 'kitLead':{'ko':'{}에 맞춰 가이드마다 하나씩 골랐습니다. 고민하지 말고 이대로 준비하세요.','ja':'{}に合わせて、ガイドごとに1つずつ選びました。迷わずこのまま準備できます。','en':'One pick per guide, chosen for the {}. Get these and you\'re set.'},
 'extras':{'ko':'있으면 편한 것','ja':'あると便利なもの','en':'Nice to have'},
 'forGuide':{'ko':'{} 가이드용','ja':'「{}」用','en':'For: {}'},
 'steps':{'ko':'따라 하기','ja':'手順','en':'Steps'},
 'careful':{'ko':'주의하세요','ja':'注意','en':'Be careful'},
 'myCar':{'ko':'내 차({})에서는','ja':'あなたの車（{}）では','en':'On your {}'},
 'products':{'ko':'내 차에 맞는 용품','ja':'あなたの車に合う用品','en':'Supplies for your car'},
 'best':{'ko':'추천','ja':'おすすめ','en':'Our pick'},
 'alts':{'ko':'다른 선택지','ja':'ほかの選択肢','en':'Alternatives'},
 'productsLead':{'ko':'아마존에서 조건에 맞는 상품으로 연결합니다. 구매 전 상품 설명에서 적합 차종을 꼭 확인하세요. 그림은 예시입니다.','ja':'Amazonで条件に合う商品にリンクしています。購入前に商品説明で適合車種を必ず確認してください。イラストはイメージです。','en':'Links go to matching products on Amazon. Check the listing\'s fitment before you buy. Illustrations are examples.'},
 'buy':{'ko':'아마존 재팬에서 보기 ↗','ja':'Amazonで見る ↗','en':'View on Amazon Japan ↗'},
 'liquid':{'ko':'액체류는 해외 배송이 제한될 수 있어, 일본 밖에서는 가까운 쇼핑몰이나 마트에서 사는 편이 쉽습니다.','ja':'','en':'Liquids may not ship internationally; outside Japan, a local store is usually easier.'},
 'koStore':{'ko':'모든 링크는 아마존 재팬(amazon.co.jp)으로 연결됩니다. 해외 배송 가능 여부는 상품마다 다릅니다.','ja':'','en':'All links go to Amazon Japan (amazon.co.jp). International shipping varies by product.'},
 'sources':{'ko':'참고 자료','ja':'参考資料','en':'Sources'},
 'credits':{'ko':'사진','ja':'写真','en':'Photos'},
 'home':{'ko':'홈','ja':'ホーム','en':'Home'},
 'change':{'ko':'차 바꾸기','ja':'車を変更','en':'Change car'},
 'next':{'ko':'다음 가이드','ja':'次のガイド','en':'Next guide'},
 'disclaimer':{'ko':'이 사이트는 Tesla와 관계없는 개인 사이트입니다. 내용은 Model 3·Model Y 오너스 매뉴얼을 바탕으로 정리했지만, 차량과 소프트웨어 버전에 따라 다를 수 있으니 차량의 매뉴얼과 표시를 우선하세요.','ja':'このサイトはTesla社とは関係のない個人サイトです。内容はモデル3・モデルYのオーナーズマニュアルをもとにまとめていますが、車両やソフトウェアのバージョンによって異なる場合があるため、お使いの車両のマニュアルと表示を優先してください。','en':'This is an independent site, not affiliated with Tesla. Guides are based on the Model 3 and Model Y Owner\'s Manuals, but details can differ by vehicle and software version, so your car\'s manual and screens come first.'},
 'affiliate':{'ko':'Amazonのアソシエイトとして、当メンバーは適格販売により収入を得ています。 (아마존 어소시에이트로서 사이트 운영자는 적격 판매로 수익을 얻습니다.)','ja':'Amazonのアソシエイトとして、当メンバーは適格販売により収入を得ています。','en':'Amazonのアソシエイトとして、当メンバーは適格販売により収入を得ています。 (As an Amazon Associate, this site earns from qualifying purchases.)'},
 'conv':{'ko':'공기압 단위 변환','ja':'空気圧の単位換算','en':'Pressure unit converter'},
 'convLead':{'ko':'라벨과 게이지의 단위가 다를 때 쓰세요.','ja':'ラベルとゲージの単位が違うときに使ってください。','en':'Use it when the label and your gauge use different units.'},
 'value':{'ko':'값','ja':'数値','en':'Value'},
 'unit':{'ko':'단위','ja':'単位','en':'Unit'},
 'langName':{'ko':'한국어','ja':'日本語','en':'English'},
 'title':{'ko':'테슬라 셀프 정비 | Model 3·Model Y 입문자 가이드','ja':'テスラ セルフ整備 | モデル3・モデルY 初心者ガイド','en':'Tesla DIY Care | Model 3 and Model Y guides for new owners'},
 'hubTitle':{'ko':'{} 정비 가이드와 추천 용품','ja':'{}の整備ガイドとおすすめ用品','en':'{}: maintenance guides and supplies'},
}
t=lambda key,lang:T[key][lang]
def url(lang,path=''):return ('/' if lang=='ko' else f'/{lang}/')+path
def amazon(lang,product,model):
    if product.get('link'):return product['link']  # a ready-made Associates link (e.g. amzn.to) already carries the tag
    store=STORE[lang];tag=TAGS[store]
    asin=product.get('asin',{}).get(model['id'],{}).get(store)
    if asin:link=f'{STORES[store]}/dp/{asin}'
    else:link=f'{STORES[store]}/s?k={quote_plus(product.get("queryByModel",{}).get(model["id"],product["query"])[store])}'
    return link+(('&' if '?' in link else '?')+'tag='+quote_plus(tag) if tag else '')
ICONS={
 'washer':'<path d="M12 3c3 4 6 7.3 6 10.5A6 6 0 0 1 6 13.5C6 10.3 9 7 12 3z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
 'wiper':'<path d="M3 19a13 13 0 0 1 18 0"/><path d="M12 19 7 8"/><path d="M5.6 9.2 8.4 6.8"/>',
 'tire':'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5"/>',
 'warn':'<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.3"/>',
 'car':'<path d="M3 15v-3l2.5-5h13L21 12v3"/><path d="M3 15h18v3H3z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
}
icon=lambda name,cls='icon':f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'
# Diagrams are drawn here so their labels follow the page language.
L={
 'cap':{'ko':'워셔액 보충구','ja':'ウォッシャー液の注入口','en':'Washer fluid filler'},
 'panel':{'ko':'정비 패널 (열지 않기)','ja':'メンテナンスパネル（開けない）','en':'Maintenance panel (leave closed)'},
 'windshield':{'ko':'앞 유리 쪽','ja':'フロントガラス側','en':'Windshield side'},
 'frunk':{'ko':'앞 트렁크','ja':'フロントトランク','en':'Front trunk'},
 'front':{'ko':'차 앞쪽','ja':'車の前側','en':'Front of car'},
 'press':{'ko':'① 탭 누르기','ja':'① タブを押す','en':'① Press the tab'},
 'slide':{'ko':'② 블레이드 빼기','ja':'② ブレードを抜く','en':'② Slide the blade off'},
 'towel':{'ko':'수건','ja':'タオル','en':'Towel'},
 'lift':{'ko':'살짝만 들기','ja':'少しだけ持ち上げる','en':'Lift only a little'},
 'label':{'ko':'타이어 정보 라벨','ja':'タイヤ情報ラベル','en':'Tire information label'},
 'pillar':{'ko':'운전석 도어 기둥','ja':'運転席ドアの柱','en':'Driver\'s door pillar'},
 'valve':{'ko':'밸브 캡을 빼고 게이지를 끼우기','ja':'キャップを外してゲージを当てる','en':'Remove the cap, press the gauge on'},
}
lb=lambda k,lang:e(L[k][lang])
def diagram(slug,lang):
    txt='font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="#0f172a"'
    if slug=='washer-fluid':
        body=f'''<rect x="150" y="20" width="300" height="34" rx="6" fill="#bfdbfe"/><text x="300" y="42" text-anchor="middle" {txt}>{lb('windshield',lang)}</text>
<path d="M130 60h340q30 0 30 30v150q0 40-60 40H160q-60 0-60-40V90q0-30 30-30z" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
<rect x="175" y="110" width="250" height="130" rx="14" fill="#fff" stroke="#94a3b8" stroke-width="3"/><text x="300" y="215" text-anchor="middle" {txt} fill="#64748b">{lb('frunk',lang)}</text>
<rect x="150" y="68" width="300" height="34" rx="6" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="6 5" stroke-width="2"/><text x="300" y="90" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#64748b">{lb('panel',lang)}</text>
<circle cx="390" cy="132" r="15" fill="#0ea5e9" stroke="#0369a1" stroke-width="3"/><circle cx="390" cy="132" r="26" fill="none" stroke="#f97316" stroke-width="3" stroke-dasharray="5 4"/>
<path d="M418 128h70" stroke="#f97316" stroke-width="3"/><text x="494" y="133" {txt} fill="#c2410c">{lb('cap',lang)}</text>
<text x="300" y="300" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#64748b">▼ {lb('front',lang)}</text>'''
        return 'washer',f'0 0 700 310',body
    if slug=='wipers':
        body=f'''<path d="M20 230 620 170" stroke="#93c5fd" stroke-width="16" stroke-linecap="round"/><rect x="170" y="196" width="150" height="16" rx="4" fill="#c4b5fd" transform="rotate(-5.7 245 204)"/><text x="245" y="244" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#6d28d9">{lb('towel',lang)}</text>
<circle cx="70" cy="222" r="10" fill="#334155"/><path d="M70 222 410 120" stroke="#334155" stroke-width="9" stroke-linecap="round"/><path d="M110 196 120 150" stroke="#f97316" stroke-width="3" marker-end="url(#ar)"/><text x="126" y="148" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#c2410c">{lb('lift',lang)}</text>
<path d="M290 168 560 86" stroke="#1e293b" stroke-width="11" stroke-linecap="round"/><path d="M292 176 560 94" stroke="#64748b" stroke-width="3"/>
<rect x="392" y="108" width="34" height="22" rx="4" fill="#0ea5e9" stroke="#0369a1" stroke-width="2" transform="rotate(-17 409 119)"/>
<path d="M409 70v32" stroke="#ef4444" stroke-width="4" marker-end="url(#ar2)"/><text x="409" y="60" text-anchor="middle" {txt} fill="#b91c1c">{lb('press',lang)}</text>
<path d="M470 128 540 108" stroke="#16a34a" stroke-width="4" marker-end="url(#ar3)"/><text x="508" y="150" text-anchor="middle" {txt} fill="#15803d">{lb('slide',lang)}</text>
<defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" fill="#f97316"/></marker><marker id="ar2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" fill="#ef4444"/></marker><marker id="ar3" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" fill="#16a34a"/></marker></defs>'''
        return 'wiper',f'0 0 640 260',body
    body=f'''<rect x="30" y="40" width="220" height="200" rx="12" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/><rect x="120" y="40" width="30" height="200" fill="#cbd5e1"/><path d="M150 50 240 70v150l-90 15z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
<rect x="124" y="120" width="22" height="34" rx="3" fill="#fde047" stroke="#ca8a04" stroke-width="2"/><circle cx="135" cy="137" r="24" fill="none" stroke="#f97316" stroke-width="3" stroke-dasharray="5 4"/>
<text x="140" y="272" text-anchor="middle" {txt}>{lb('pillar',lang)}</text><path d="M110 137H50" stroke="#f97316" stroke-width="3"/><text x="44" y="112" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#c2410c">{lb('label',lang)}</text>
<circle cx="460" cy="150" r="100" fill="#1e293b"/><circle cx="460" cy="150" r="62" fill="#cbd5e1"/><circle cx="460" cy="150" r="14" fill="#64748b"/>
<rect x="502" y="186" width="10" height="20" rx="3" fill="#334155" transform="rotate(-40 507 196)"/><rect x="520" y="196" width="70" height="26" rx="8" fill="#0ea5e9" transform="rotate(-40 555 209)"/>
<text x="460" y="285" text-anchor="middle" {txt}>{lb('valve',lang)}</text>'''
    return 'tire',f'0 0 640 300',body
def diagram_html(slug,lang,title):
    _,box,body=diagram(slug,lang)
    return f'<figure class="diagram"><svg viewBox="{box}" role="img" aria-label="{e(title)}">{body}</svg></figure>'
def photo(key,lang,cls='photo',loading='lazy'):
    p=PHOTOS[key]
    return f'<img class="{cls}" src="/assets/photos/{key}.jpg" alt="{e(p["alt"][lang])}" loading="{loading}" width="960" height="640">'
def credit(key):
    p=PHOTOS[key]
    return f'<li>{e(p.get("artist","Wikimedia Commons"))} · <a href="{e(p.get("licenseUrl") or p.get("page",""))}" target="_blank" rel="noopener">{e(p.get("license",""))}</a> · <a href="{e(p.get("page",""))}" target="_blank" rel="noopener">Wikimedia Commons</a></li>'
def shell(lang,path,title,description,body,photos=(),image=None):
    canonical=ORIGIN+url(lang,path)
    alternates=''.join(f'<link rel="alternate" hreflang="{l}" href="{ORIGIN+url(l,path)}">' for l in LANGS)+f'<link rel="alternate" hreflang="x-default" href="{ORIGIN+url("ko",path)}">'
    switch=''.join(f'<a href="{url(l,path)}" lang="{l}" hreflang="{l}"'+(' aria-current="true"' if l==lang else '')+f'>{t("langName",l)}</a>' for l in LANGS)
    credits=f'<p>{t("credits",lang)}:</p><ul class="credits">{"".join(credit(k) for k in dict.fromkeys(photos))}</ul>' if photos else ''
    og=f'<meta property="og:image" content="{ORIGIN}/assets/photos/{image}.jpg"><meta name="twitter:card" content="summary_large_image">' if image else '<meta name="twitter:card" content="summary">'
    return f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0f172a"><title>{e(title)}</title><meta name="description" content="{e(description)}"><link rel="canonical" href="{canonical}">{alternates}<meta property="og:type" content="website"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{canonical}">{og}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"></head><body>
<header class="top"><a class="brand" href="{url(lang)}"><span class="logo" aria-hidden="true">{icon("tire","logo-icon")}</span><span>{e(t("brand",lang))}<small>{e(t("tagline",lang))}</small></span></a><nav class="langs" aria-label="Language">{switch}</nav></header>
<main>{body}</main><footer>{credits}<p>{e(t("disclaimer",lang))}</p><p>{e(t("affiliate",lang))}</p><p>© Tesla DIY Care</p></footer></body></html>'''
REMEMBER='<script>try{localStorage.setItem("tc-model","%s")}catch{}</script>'
def model_card(lang,m):
    return f'<a class="model-card" href="{url(lang,m["id"]+"/")}" data-model="{m["id"]}">{photo(m["photo"],lang,"model-photo","eager")}<span class="model-text"><strong>{e(m["name"][lang])}</strong><span>{e(m["years"][lang])}</span><small>{e(m["hint"][lang])}</small><span class="choose">{t("choose",lang)}</span></span></a>'
def home(lang):
    names={m['id']:m['name'][lang] for m in MODELS}
    guide_list=''.join(f'<li><span class="card-icon">{icon(g["icon"])}</span><span><strong>{e(g["title"][lang])}</strong><small>{e(g["summary"][lang])}</small></span></li>' for g in GUIDES)
    body=f'''<section class="hero"><p class="eyebrow">TESLA MODEL 3 · MODEL Y</p><h1>{t("hero",lang)}</h1><p class="lead">{e(t("heroLead",lang))}</p></section>
<p class="remembered" id="remembered" hidden>{e(t("remember",lang))}: <a href="#"></a></p>
<section aria-labelledby="pick"><h2 id="pick">{e(t("pick",lang))}</h2><p class="muted">{e(t("pickLead",lang))}</p>{"".join(f'<h3 class="family">{e(name[lang])}</h3><div class="models">'+"".join(model_card(lang,m) for m in MODELS if m["family"]==fam)+'</div>' for fam,name in data["families"].items())}</section>
<section><h2>{e(t("guides",lang))}</h2><ul class="guide-list">{guide_list}</ul></section>
<script>(()=>{{let id;try{{id=localStorage.getItem("tc-model")}}catch{{}}const names={json.dumps(names,ensure_ascii=False)};if(!names[id])return;const p=document.getElementById("remembered"),a=p.querySelector("a");a.href="{url(lang)}"+id+"/";a.textContent=names[id]+" →";p.hidden=false;document.querySelector('[data-model="'+id+'"]').classList.add("is-mine")}})()</script>'''
    return shell(lang,'',t('title',lang),t('heroLead',lang),body,[m['photo'] for m in MODELS],'model3-highland')
def buttons(lang,p,m):
    # Separately sold items for one car (e.g. driver and passenger blades) get a button each.
    links=p.get('linksByModel',{}).get(m['id'])
    if links:return '<span class="buys">'+''.join(f'<a class="buy" href="{e(l["url"])}" target="_blank" rel="sponsored nofollow noopener">{e(l["label"][lang])}</a>' for l in links)+'</span>'
    return f'<a class="buy" href="{e(amazon(lang,p,m))}" target="_blank" rel="sponsored nofollow noopener">{t("buy",lang)}</a>'
def product_card(lang,p,m,big=False):
    note=t('liquid',lang) if p.get('liquid') else ''
    return f'<li class="product{" best" if big else ""}"><img class="product-img" src="/assets/illustrations/{p["image"]}.svg" alt="" loading="lazy" width="160" height="120"><div>'+(f'<span class="badge">{t("best",lang)}</span>' if big else '')+f'<h3>{e(p.get("nameByModel",{}).get(m["id"],p["name"])[lang])}</h3><p>{e(p.get("whyByModel",{}).get(m["id"],p["why"])[lang])}</p>'+(f'<p class="note">{e(note)}</p>' if note else '')+buttons(lang,p,m)+'</div></li>'
def hub(lang,m):
    mains=[(g,p) for g in GUIDES for p in g['products'] if p['role']=='main'];extras=[(g,p) for g in GUIDES for p in g['products'] if p['role']=='extra']
    item=lambda g,p:product_card(lang,p,m).replace('<h3>',f'<small class="for">{e(t("forGuide",lang).format(g["title"][lang]))}</small><h3>',1)
    cards=''.join(f'<a class="card" href="{url(lang,m["id"]+"/"+g["slug"]+"/")}">{photo(g["photo"],lang,"card-photo")}<span class="card-body"><h3>{e(g["title"][lang])}</h3><p>{e(g["summary"][lang])}</p><span class="meta">{t("min",lang).format(g["minutes"])} · {t("read",lang)}</span></span></a>' for g in GUIDES)
    store_note=f'<p class="note">{e(t("koStore",lang))}</p>' if t('koStore',lang) else ''
    body=f'''<nav class="crumbs" aria-label="breadcrumb"><a href="{url(lang)}">{e(t("home",lang))}</a> › <span>{e(m["name"][lang])}</span></nav>
<section class="hub-head">{photo(m["photo"],lang,"hub-photo","eager")}<div><p class="eyebrow">{e(m["years"][lang])}</p><h1>{e(m["name"][lang])}</h1><a class="change" href="{url(lang)}#pick">{icon("car")}{e(t("change",lang))}</a></div></section>
<section class="kit"><h2>{e(t("kit",lang))}</h2><p class="muted">{e(t("kitLead",lang).format(m["name"][lang]))}</p>{store_note}<ul class="products">{"".join(item(g,p) for g,p in mains)}</ul><h3 class="sub">{e(t("extras",lang))}</h3><ul class="products compact">{"".join(item(g,p) for g,p in extras)}</ul></section>
<section><h2>{e(t("guides",lang))}</h2><div class="cards">{cards}</div></section>{REMEMBER%m["id"]}'''
    return shell(lang,m['id']+'/',t('hubTitle',lang).format(m['name'][lang]),t('kitLead',lang).format(m['name'][lang]),body,[m['photo']]+[g['photo'] for g in GUIDES],m['photo'])
def converter(lang):
    return f'''<section class="box converter" aria-labelledby="conv-title"><h2 id="conv-title">{e(t("conv",lang))}</h2><p>{e(t("convLead",lang))}</p><div class="conv-row"><label>{e(t("value",lang))}<input id="conv-value" type="number" inputmode="decimal" value="42" min="0" step="0.1"></label><label>{e(t("unit",lang))}<select id="conv-unit"><option value="psi">psi</option><option value="kpa">kPa</option><option value="bar">bar</option></select></label></div><output id="conv-out" for="conv-value conv-unit" aria-live="polite"></output></section>
<script>(()=>{{const v=document.getElementById('conv-value'),u=document.getElementById('conv-unit'),o=document.getElementById('conv-out'),k={{psi:6.894757,kpa:1,bar:100}};function r(){{const n=parseFloat(v.value);if(!isFinite(n)){{o.textContent='';return}}const p=n*k[u.value];o.textContent=`${{(p/k.psi).toFixed(1)}} psi = ${{Math.round(p)}} kPa = ${{(p/100).toFixed(2)}} bar`}}v.addEventListener('input',r);u.addEventListener('change',r);r()}})()</script>'''
def guide_page(lang,g,m,nxt):
    facts=''.join(f'<div><dt>{e(f["label"][lang])}</dt><dd>{e(f.get("valueByModel",{}).get(m["id"],f["value"])[lang])}</dd></div>' for f in g['facts'])
    steps=''.join(f'<li>{e(s[lang])}</li>' for s in g['steps'])
    warns=''.join(f'<li>{e(w[lang])}</li>' for w in g['warnings'])
    note=g.get('modelNotes',{}).get(m['id'])
    note=f'<section class="box mine"><h2>{icon("car")}{e(t("myCar",lang).format(m["name"][lang]))}</h2><p>{e(note[lang])}</p></section>' if note else ''
    store_note=f'<p class="note">{e(t("koStore",lang))}</p>' if t('koStore',lang) else ''
    main=[p for p in g['products'] if p['role']=='main'];rest=[p for p in g['products'] if p['role']!='main']
    sources=''.join(f'<li><a href="{e(s["url"])}" target="_blank" rel="noopener">{e(s["label"])}</a></li>' for s in data['sources'] if s['family']==m['family'])
    other=[x for x in MODELS if x['id']!=m['id']]
    body=f'''<article class="guide"><nav class="crumbs" aria-label="breadcrumb"><a href="{url(lang)}">{e(t("home",lang))}</a> › <a href="{url(lang,m["id"]+"/")}">{e(m["name"][lang])}</a> › <span>{e(g["title"][lang])}</span></nav>
<header class="guide-head"><div><p class="eyebrow">{e(m["name"][lang])} · {t("min",lang).format(g["minutes"])}</p><h1>{e(g["title"][lang])}</h1><p class="lead">{e(g["summary"][lang])}</p></div>{photo(g["photo"],lang,"guide-photo","eager")}</header>
<dl class="facts">{facts}</dl>{note}
<section><h2>{e(t("steps",lang))}</h2>{diagram_html(g["slug"],lang,g["title"][lang])}<ol class="steps">{steps}</ol></section>
<section class="box warn"><h2>{icon("warn")}{e(t("careful",lang))}</h2><ul>{warns}</ul></section>
{converter(lang) if g.get("converter") else ""}
<section id="products"><h2>{e(t("products",lang))}</h2><p class="muted">{e(t("productsLead",lang))}</p>{store_note}<ul class="products">{"".join(product_card(lang,p,m,True) for p in main)}</ul><h3 class="sub">{e(t("alts",lang))}</h3><ul class="products compact">{"".join(product_card(lang,p,m) for p in rest)}</ul></section>
<section class="sources"><h2>{e(t("sources",lang))}</h2><ul>{sources}</ul></section>
<p class="switch-model">{"".join(f'<a href="{url(lang,o["id"]+"/"+g["slug"]+"/")}">{icon("car")}{e(o["name"][lang])} →</a>' for o in other)}</p>
<a class="next" href="{url(lang,m["id"]+"/"+nxt["slug"]+"/")}"><small>{e(t("next",lang))}</small>{e(nxt["title"][lang])} →</a></article>{REMEMBER%m["id"]}'''
    return shell(lang,f'{m["id"]}/{g["slug"]}/',f'{g["title"][lang]} ({m["name"][lang]}) | {t("brand",lang)}',g['summary'][lang],body,[g['photo']],g['photo'])
def write(lang,path,content):
    target=ROOT/('' if lang=='ko' else lang)/path/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
paths=['']
for lang in LANGS:
    write(lang,'',home(lang))
    for m in MODELS:
        write(lang,m['id']+'/',hub(lang,m))
        for i,g in enumerate(GUIDES):write(lang,f'{m["id"]}/{g["slug"]}/',guide_page(lang,g,m,GUIDES[(i+1)%len(GUIDES)]))
for m in MODELS:paths+=[m['id']+'/']+[f'{m["id"]}/{g["slug"]}/' for g in GUIDES]
sitemap=''.join(f'<url><loc>{ORIGIN+url(lang,p)}</loc>'+''.join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{ORIGIN+url(l,p)}"/>' for l in LANGS)+'</url>' for p in paths for lang in LANGS)
(ROOT/'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">{sitemap}</urlset>\n')
(ROOT/'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {ORIGIN}/sitemap.xml\n')
(ROOT/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0f172a"/><g fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/></g></svg>')
print('Generated',len(paths)*len(LANGS),'pages in',len(LANGS),'languages.')
