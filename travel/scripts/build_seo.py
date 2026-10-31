"""Generate crawlable Korean, Japanese and English pages from the shared catalog and app shell."""
import json,re,html,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
from urllib.parse import quote
food=lambda q:'https://www.google.com/maps/search/?api=1&amp;query='+quote('restaurants near '+q)
ORIGIN='https://travel.play-labo.com'
data=json.loads((ROOT/'data.json').read_text());template=(ROOT/'scripts/page-template.html').read_text()
e=lambda s:html.escape(str(s),quote=True)
LANGS=['ko','ja','en'];LOCALES={'ko':'ko_KR','ja':'ja_JP','en':'en_US'}
def url(lang,path=''):return ORIGIN+('/' if lang=='ko' else '/'+lang+'/')+path
# Field names per language: Japanese is the source text, Korean and English sit beside it.
SPOT={'ko':('nameKo','descriptionKo','imageCaptionKo'),'ja':('nameJa','descriptionJa','imageCaption'),'en':('nameEn','descriptionEn','imageCaptionEn')}
AREA={'ko':('nameKo','countryKo'),'ja':('nameJa','countryJa'),'en':('nameEnglish','countryName')}
EAT={'ko':'nameKo','ja':'nameJa','en':'nameEn'}
entries=[]
def page(lang,path,title,description,body,extra=None,noindex=False,crumbs=()):
    canonical=url(lang,path);alternates={l:url(l,path) for l in LANGS};image=ORIGIN+f'/assets/og/japan-travel-{lang}.jpg'
    meta=f'''<base href="/"><meta name="robots" content="{'noindex,follow' if noindex else 'index,follow,max-image-preview:large'}"><link rel="canonical" href="{canonical}">{''.join(f'<link rel="alternate" hreflang="{l}" href="{h}">' for l,h in alternates.items())}<link rel="alternate" hreflang="x-default" href="{alternates['ko']}"><meta property="og:type" content="website"><meta property="og:site_name" content="World Travel TOP10"><meta property="og:locale" content="{LOCALES[lang]}">{''.join(f'<meta property="og:locale:alternate" content="{LOCALES[l]}">' for l in LANGS if l!=lang)}<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="World Travel TOP10"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(description)}"><meta name="twitter:image" content="{image}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">'''
    graph=[{'@type':'WebSite','@id':ORIGIN+'/#website','url':ORIGIN+'/','name':'World Travel TOP10','inLanguage':LANGS},{'@type':'WebPage','@id':canonical+'#page','url':canonical,'name':title,'description':description,'inLanguage':lang,'isPartOf':{'@id':ORIGIN+'/#website'}}]
    if path and not noindex:graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i,'name':name,'item':item} for i,(name,item) in enumerate([({'ko':'홈','ja':'ホーム','en':'Home'}[lang],url(lang)),*crumbs,(title,canonical)],1)]})
    if extra:graph.append(extra)
    schema=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('<','\\u003c')
    out=re.sub(r'<html lang="[^"]+">',f'<html lang="{lang}">',template)
    out=re.sub(r'<title>.*?</title>',f'<title>{e(title)}</title>',out)
    out=re.sub(r'<meta name="description" content="[^"]*">',f'<meta name="description" content="{e(description)}">',out)
    out=out.replace('</head>',meta+f'<script type="application/ld+json">{schema}</script></head>')
    out=out.replace('<main id="app"></main>',f'<main id="app">{body}</main>')
    for old,new in [('#home',url(lang)),('#regions',url(lang,'regions/')),('#favorites',url(lang,'favorites/'))]:out=out.replace('href="'+old+'"','href="'+new+'"')
    shell={'ko':[('世界旅行 <b>','세계 여행 <b>'),('>ホーム<','>홈<'),('>エリアを探す<','>지역 둘러보기<'),('♡ お気に入り','♡ 즐겨찾기'),('あなたの「行きたい」を、次の旅へ。','가고 싶은 곳을, 다음 여행으로.'),('掲載順位は編集上のおすすめ順です。営業時間・料金は公式情報をご確認ください。','순위는 편집상의 추천 순서입니다. 운영 시간과 요금은 공식 정보를 확인해 주세요.')],
           'en':[('世界旅行 <b>','World Travel <b>'),('>ホーム<','>Home<'),('>エリアを探す<','>Explore areas<'),('♡ お気に入り','♡ Favorites'),('あなたの「行きたい」を、次の旅へ。','Turn the places you want to go into your next trip.'),('掲載順位は編集上のおすすめ順です。営業時間・料金は公式情報をご確認ください。','Rankings are our editorial picks. Check official sources for opening hours and prices.')]}
    for old,new in shell.get(lang,[]):out=out.replace(old,new)
    out=re.sub(r'data-language="(\w+)" lang="\1" aria-pressed="\w+"',lambda m:f'data-language="{m[1]}" lang="{m[1]}" aria-pressed="{str(m[1]==lang).lower()}"',out)
    target=ROOT/('' if lang=='ko' else lang)/path/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(out)
    if not noindex:entries.append((canonical,alternates))
countries={}
for r in data:countries.setdefault(r['country'],[]).append(r)
def region_cards(lang,regions=data):
    return '<div class="regions">'+''.join(f'<a class="region-card" href="{url(lang,"regions/"+r["id"]+"/")}"><img src="/{r["spots"][0]["image"]}" alt="{e(r[AREA[lang][0]])}" loading="lazy"><div class="region-text"><h3>{e(r[AREA[lang][0]])}</h3><small>{r["nameEn"]} TOP10</small></div></a>' for r in regions)+'</div>'
def country_name(lang,regions):return regions[0][AREA[lang][1]]
def country_cards(lang):
    return '<div class="regions">'+''.join(f'<a class="region-card" href="{url(lang,"countries/"+cid+"/")}"><img src="/{rs[0]["spots"][0]["image"]}" alt="{e(country_name(lang,rs))}" loading="lazy"><div class="region-text"><h3>{e(country_name(lang,rs))}</h3><small>{rs[0]["countryEn"]}</small></div></a>' for cid,rs in countries.items())+'</div>'
for lang in LANGS:
    t=lambda ko,ja,en:{'ko':ko,'ja':ja,'en':en}[lang]
    namekey,desckey,capkey=SPOT[lang];areakey,countrykey=AREA[lang];eatkey=EAT[lang];brand=t('세계 여행 TOP10','世界旅行 TOP10','World Travel TOP10')
    spots=sum(len(r["spots"]) for r in data)
    title=brand+' | '+t(f'{len(countries)}개 나라·지역 {len(data)}개 여행지 추천 관광지',f'{len(countries)}の国・地域、{len(data)}エリアのおすすめ観光スポット',f'Top sights in {len(data)} destinations across {len(countries)} countries and regions')
    desc=t(f'일본·한국·아시아·유럽·미국·호주 {len(countries)}개 나라·지역의 추천 관광지 {spots}곳을 사진으로 둘러보세요. 여행지별 TOP10, 관광지 정보, 지도와 즐겨찾기를 한국어·일본어·영어로 제공합니다.',f'日本・韓国・アジア・ヨーロッパ・アメリカ・オーストラリアなど{len(countries)}の国・地域から、おすすめ観光スポット{spots}か所を写真で紹介。エリア別TOP10、観光地情報、地図、お気に入りを韓国語・日本語・英語で楽しめます。',f'Browse {spots} recommended sights in {len(countries)} countries and regions across Japan, Korea, Asia, Europe, the US and Australia, by photo. Top 10 lists by destination, sight details, maps and favorites in English, Korean and Japanese.')
    page(lang,'',title,desc,f'<section class="section"><h1>{brand}</h1><p>{desc}</p>{country_cards(lang)}</section>')
    explore=t('지역 둘러보기','エリアを探す','Explore areas')
    groups=''.join(f'<h2><a href="{url(lang,"countries/"+cid+"/")}">{e(country_name(lang,rs))}</a></h2>{region_cards(lang,rs)}' for cid,rs in countries.items())
    page(lang,'regions/',t('나라·지역별 추천 여행지','国・エリア別おすすめ旅行先','Destinations by country and region')+' | '+brand,desc,f'<section class="section"><h1>{explore}</h1>{groups}</section>')
    for cid,rs in countries.items():
        cn=country_name(lang,rs);names=t(', ','、',', ').join(r[areakey] for r in rs)
        ctitle=t(f'{cn} 여행 추천 여행지·관광지',f'{cn}旅行おすすめエリア・観光スポット',f'{cn} travel: top destinations and sights')+' | '+brand
        cdesc=t(f'{cn} 여행 추천 여행지 {names}. 여행지별 관광지 TOP10을 사진과 지도로 확인하세요.',f'{cn}旅行のおすすめエリア：{names}。エリア別の観光スポットTOP10を写真と地図でご紹介します。',f'Top destinations in {cn}: {names}. See the top 10 sights in each, with photos and maps.')
        clist={'@type':'ItemList','name':ctitle,'numberOfItems':len(rs),'itemListElement':[{'@type':'ListItem','position':i,'name':r[areakey],'url':url(lang,'regions/'+r['id']+'/')} for i,r in enumerate(rs,1)]}
        page(lang,'countries/'+cid+'/',ctitle,cdesc,f'<section class="section"><a href="{url(lang,"regions/")}">{explore}</a><h1>{e(ctitle.split(" | ")[0])}</h1><p>{e(cdesc)}</p>{region_cards(lang,rs)}</section>',clist)
    fav=t('즐겨찾기','お気に入り','Favorites')
    page(lang,'favorites/',fav+' | '+brand,desc,f'<section class="section"><h1>{fav}</h1></section>',noindex=True)
    for r in data:
        rn=r[areakey];cn=r[countrykey];country_crumb=(cn,url(lang,'countries/'+r['country']+'/'));title=t(f'{rn} 여행 추천 관광지 TOP10',f'{rn}旅行おすすめ観光スポットTOP10',f'Top 10 sights in {rn}')+' | '+brand
        top3=t(', ','、',', ').join(s[namekey] for s in r['spots'][:3])
        desc=t(f'{rn} 여행에서 가볼 만한 관광지 TOP10. {top3} 등 추천 명소의 사진과 지도 정보를 확인하세요.',f'{rn}旅行で訪れたい観光スポットTOP10。{top3}などの写真と地図をご紹介します。',f'The top 10 sights to visit in {rn}, including {top3}, with photos and maps.')
        items=''.join(f'<article class="rank-row"><span class="rank rank-{s["rank"]}">{s["rank"]}</span><a class="spot-open" href="{url(lang,"spots/"+s["slug"]+"/")}"><img src="/{s["image"]}" alt="{e(s[namekey])}" loading="lazy"><div><h2>{e(s[namekey])}</h2><p>{e(s[desckey])}</p></div></a></article>' for s in r['spots'])
        eat_map=lambda x:'https://www.google.com/maps/search/?api=1&amp;query='+quote(x['nameEn']+' '+x['address'] if x['address'] else f"{x['lat']},{x['lon']}")
        eats='' if not r.get('restaurants') else f'<h2>{e(t(f"{rn} 대표 맛집",f"{rn}の名物グルメ",f"{rn}: local eats"))}</h2><div class="spots eats">'+''.join(f'<article class="spot">'+(f'<img class="spot-img" src="/{x["image"]}" alt="{e(x[eatkey] or x["nameJa"])}" loading="lazy">' if x.get('image') else '<div class="eat-noimg" aria-hidden="true">🍴</div>')+f'<div class="spot-info"><h3>{e(x[eatkey] or x["nameJa"])}</h3>'+(f'<p class="eat-address" translate="no">📍 {e(x["address"])}</p>' if x['address'] else '')+f'<a class="small-link" href="{eat_map(x)}">{t("지도에서 보기","地図で見る","View map")} ↗</a><p class="photo-credit">'+(f'{e(x["imageArtist"])} · <a href="{e(x["imageLicenseUrl"])}">{e(x["imageLicense"])}</a> · <a href="{e(x["article"])}">Wikipedia</a>' if x.get('image') else '')+(f'{" · " if x.get("image") else ""}<a href="{e(x["addressSource"])}">{t("주소 출처","住所の出典","Address source")}</a>' if x.get('addressSource') else '')+'</p></div></article>' for x in r['restaurants'])+'</div>'
        listing={'@type':'ItemList','name':title,'itemListOrder':'https://schema.org/ItemListOrderAscending','numberOfItems':10,'itemListElement':[{'@type':'ListItem','position':s['rank'],'name':s[namekey],'url':url(lang,'spots/'+s['slug']+'/')} for s in r['spots']]}
        page(lang,'regions/'+r['id']+'/',title,desc,f'<section class="section"><a href="{country_crumb[1]}">{e(cn)}</a><h1>{e(title.split(" | ")[0])}</h1><p>{e(desc)}</p><p><a class="small-link" href="{food(r['nameJa'])}">{e(t(f"{rn} 맛집 찾기",f"{rn}のグルメを探す",f"Find restaurants in {rn}"))} ↗</a></p><div class="rank-list">{items}</div>{eats}</section>',listing,crumbs=[country_crumb])
        for s in r['spots']:
            title=s[namekey]+' | '+t(f'{rn} 여행 관광지 안내',f'{rn}旅行観光ガイド',f'{rn} travel guide');desc=s[desckey]+t(f'. 사진, 지도와 함께 다음 {rn} 여행을 계획해 보세요.',f'。写真と地図で次の{rn}旅行を計画しましょう。',f'. Plan your next trip to {rn} with photos and maps.')
            credit=f'<p class="photo-credit">{e(s["imageArtist"])} · <a href="{e(s["imageLicenseUrl"])}">{e(s["imageLicense"])}</a> · <a href="{e(s["imageFilePage"])}">Wikimedia Commons</a></p>'
            caption=e(s.get(capkey,''))
            body=f'<section class="section"><a href="{url(lang,"regions/"+r["id"]+"/")}">{rn} TOP10</a><h1>{e(s[namekey])}</h1><img class="seo-spot-image" src="/{s["image"]}" alt="{e(s[namekey])}"><p>{caption}</p><p>{e(desc)}</p>{credit}<a class="primary" href="https://www.google.com/maps/search/?api=1&amp;query={quote(s["nameJa"]+" "+r["nameJa"])}">Google Maps ↗</a> <a class="secondary" href="{food(s["nameJa"]+" "+r["nameJa"])}">{t("근처 맛집 찾기","近くのグルメを探す","Find restaurants nearby")} ↗</a></section>'
            spot={'@type':'TouristAttraction','@id':url(lang,'spots/'+s['slug']+'/')+'#attraction','name':s[namekey],'description':s[desckey],'image':ORIGIN+'/'+s['image'],'url':url(lang,'spots/'+s['slug']+'/'),'containedInPlace':{'@type':'Place','name':rn,'containedInPlace':{'@type':'Place','name':cn}}}
            page(lang,'spots/'+s['slug']+'/',title,desc,body,spot,crumbs=[country_crumb,(rn+' TOP10',url(lang,'regions/'+r['id']+'/'))])
ns='http://www.sitemaps.org/schemas/sitemap/0.9';xh='http://www.w3.org/1999/xhtml';ET.register_namespace('',ns);ET.register_namespace('xhtml',xh);tree=ET.Element('{'+ns+'}urlset')
for canonical,alternates in entries:
    entry=ET.SubElement(tree,'{'+ns+'}url');ET.SubElement(entry,'{'+ns+'}loc').text=canonical
    for language,href in [*alternates.items(),('x-default',alternates['ko'])]:ET.SubElement(entry,'{'+xh+'}link',{'rel':'alternate','hreflang':language,'href':href})
ET.ElementTree(tree).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+ORIGIN+'/sitemap.xml\n')
(ROOT/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#168ff0"/><text x="32" y="45" text-anchor="middle" font-family="sans-serif" font-size="40" fill="white">旅</text></svg>')
print('Generated',len(entries),'indexable pages in',len(LANGS),'languages and sitemap.')
