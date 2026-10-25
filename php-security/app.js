'use strict';
const lang=document.documentElement.lang;
const entries=JSON.parse(document.getElementById('brief-data').textContent).entries;
let status='all';
const $=id=>document.getElementById(id);
const text=(id,value)=>{$(id).textContent=value;};
function options(id,values){const previous=$(id).value;$(id).replaceChildren(...Object.entries(values).map(([key,value])=>{const el=document.createElement('option');el.value=key;el.textContent=value;return el;}));if(values[previous])$(id).value=previous;}
function render(){
 const t=copy[lang];document.documentElement.lang=lang;
 const mapping={eyebrow:'eyebrow',headline:'title',intro:'intro',date:'date','what-title':'whatTitle',what:'what','patch-title':'patchTitle',patch:'patch','meaning-title':'meaningTitle',meaning:'meaning','directory-title':'directoryTitle',edition:'edition',scope:'scope',reset:'reset','link-policy':'policy',empty:'empty',failure:'failed','method-title':'methodTitle',method:'method','source-title':'sourceTitle',sources:'sources',freshness:'freshness',footer:'footer'};
 Object.entries(mapping).forEach(([id,key])=>text(id,t[key]));$('headline').style.whiteSpace='pre-line';$('search').placeholder=t.search;$('search').setAttribute('aria-label',t.search);text('region-label',t.regions.all);text('category-label',t.categories.all);document.querySelector('nav').setAttribute('aria-label',lang==='ko'?'언어':lang==='ja'?'言語':'Language');
 document.querySelectorAll('[data-lang]').forEach(el=>{if(el.dataset.lang===lang)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 options('region',t.regions);options('category',t.categories);
 $('stats').replaceChildren(...Object.keys(t.statuses).map(key=>{const b=document.createElement('button');b.type='button';b.className='stat';b.setAttribute('aria-pressed',String(status===key));const n=document.createElement('strong');n.textContent=entries.filter(e=>key==='all'||e.status===key).length;const label=document.createElement('span');label.textContent=t.statuses[key];b.append(n,label);b.onclick=()=>{status=key;render();};return b;}));
 renderRows();
}
const aliases={ 'Uma Musume Pretty Derby':'ウマ娘 우마무스메','Granblue Fantasy':'グランブルーファンタジー グラブル 그랑블루','CoDMON':'コドモン 코도몬','XServer':'エックスサーバー 엑스서버','Sakura':'さくら 사쿠라','Heaven Burns Red (JP)':'ヘブンバーンズレッド 헤븐번즈레드','Princess Connect! Re:Dive':'プリンセスコネクト プリコネ 프린세스 커넥트','niconico':'ニコニコ 니코니코','Lolipop':'ロリポップ 로리팝','Bushiroad website':'ブシロード 부시로드','Fourth Boundary':'第四境界 제4경계','Bandai Channel':'バンダイチャンネル 반다이','Wikipedia / Wikimedia wikis':'위키백과 ウィキペディア'};
function renderRows(){const t=copy[lang],query=$('search').value.toLocaleLowerCase().trim(),region=$('region').value,category=$('category').value;
 const rank={official:0,reported:1,unknown:2};const filtered=[...entries].sort((a,b)=>rank[a.status]-rank[b.status]||a.id-b.id).filter(e=>(status==='all'||e.status===status)&&(region==='all'||e.region===region)&&(category==='all'||e.category===category)&&[e.name,...Object.values(e.names||{}),e.source,...Object.values(e.summary),aliases[e.name]||'',e.name.startsWith('Sakura')?aliases.Sakura:''].join(' ').toLocaleLowerCase().includes(query));
 $('entries').replaceChildren(...filtered.map(e=>{const detail=document.createElement('details'),summary=document.createElement('summary');
 const num=document.createElement('span');num.className='num';num.textContent=String(e.id).padStart(2,'0');const service=document.createElement('span');service.className='service';const name=document.createElement('strong');name.textContent=e.names?.[lang] || e.name;const meta=document.createElement('small');meta.textContent=`${t.regions[e.region]} / ${t.categories[e.category]}`;service.append(name,meta);
 const badge=document.createElement('span');badge.className=`badge ${e.status}`;badge.textContent=t.statuses[e.status];const note=document.createElement('span');note.className='row-note';note.textContent=t.more;const arrow=document.createElement('span');arrow.className='chevron';arrow.textContent='+';arrow.setAttribute('aria-hidden','true');summary.append(num,service,badge,note,arrow);
 const body=document.createElement('div');body.className='detail-body';const description=document.createElement('p');description.textContent=e.summary[lang];const source=document.createElement('p');source.className='source';source.textContent=`${t.source}: ${e.source}`;const checked=document.createElement('p');checked.className='source';checked.textContent=`${t.published}: ${e.published || (lang==='ko'?'미확인':lang==='ja'?'未確認':'Unverified')} · ${t.checked}: 2026-10-21 23:26 JST / KST · ${t.evidence}`;body.append(description,source,checked);detail.append(summary,body);return detail;}));
 text('result-count',t.result(filtered.length));$('empty').hidden=filtered.length!==0;
}
['search','region','category'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderRows));
$('reset').onclick=()=>{status='all';$('search').value='';$('region').value='all';$('category').value='all';render();};
document.querySelector('.filters').hidden=false;
render();
