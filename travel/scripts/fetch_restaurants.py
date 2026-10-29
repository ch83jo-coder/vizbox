"""Collect each area's local eats from scripts/restaurants.json into data.json.

A candidate is published only when its English Wikipedia article resolves,
Wikidata gives coordinates, and the article's lead photo is a Commons jpg.
Names come from Wikidata labels (ja/ko, English fallback); the address is the
Wikidata street address (P6375) when one exists. A candidate written as
{"title": ..., "nameKo": ..., "address": ...} overrides wrong or missing Wikidata values. Photos are saved to
assets/restaurants/<slug>.jpg with artist and license, like the spot photos.
Progress is saved after every photo, so a rerun resumes where it stopped.
"""
import json,re,sys,time,unicodedata,urllib.parse
from pathlib import Path
from fetch_spot_images import ROOT,request,clean
def slugify(title):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',urllib.parse.unquote(title).lower()).encode('ascii','ignore').decode()).strip('-')
def wiki(titles):
    params={'action':'query','format':'json','prop':'pageimages|pageprops','piprop':'name|original','ppprop':'wikibase_item','titles':'|'.join(titles),'redirects':1}
    raw,_=request('https://en.wikipedia.org/w/api.php?'+urllib.parse.urlencode(params));query=json.loads(raw)['query']
    aliases={a['from']:a['to'] for key in ('normalized','redirects') for a in query.get(key,[])};pages={p['title']:p for p in query['pages'].values()};found={}
    for title in titles:
        final=title
        while final in aliases:final=aliases[final]
        page=pages.get(final,{})
        if 'missing' not in page and page.get('pageprops',{}).get('wikibase_item'):found[title]=dict(page,title=final)
    return found
def wikidata(ids):
    params={'action':'wbgetentities','format':'json','ids':'|'.join(ids),'props':'labels|claims','languages':'ja|ko|en'}
    raw,_=request('https://www.wikidata.org/w/api.php?'+urllib.parse.urlencode(params));return json.loads(raw)['entities']
def claim(entity,prop):
    for c in entity.get('claims',{}).get(prop,[]):
        value=c.get('mainsnak',{}).get('datavalue',{}).get('value')
        if value:return value
def label(entity,lang):return entity.get('labels',{}).get(lang,entity.get('labels',{}).get('en',{})).get('value','')
def main():
    regions=json.loads((ROOT/'data.json').read_text());picks=json.loads((ROOT/'scripts/restaurants.json').read_text());skipped=[]
    spot_articles={urllib.parse.unquote(s.get('imageArticle','')).split('/wiki/')[-1].replace('_',' ') for r in regions for s in r['spots']}
    previous={x['slug']:x for r in regions for x in r.get('restaurants',[])}
    for region in regions:
        fixes={c['title']:{k:v for k,v in c.items() if k!='title'} for c in picks.get(region['id'],[]) if isinstance(c,dict)}
        titles=[c['title'] if isinstance(c,dict) else c for c in picks.get(region['id'],[])];titles=[t for t in titles if t not in spot_articles]
        if not titles:region.pop('restaurants',None);continue
        pages=wiki(titles);entities=wikidata(sorted({p['pageprops']['wikibase_item'] for p in pages.values()})) if pages else {};items=[]
        for title in titles:
            page=pages.get(title)
            if not page:skipped.append(f'{region["id"]}: {title} (記事なし)');continue
            entity=entities.get(page['pageprops']['wikibase_item'],{});point=claim(entity,'P625');photo=page.get('pageimage','')
            if not point:skipped.append(f'{region["id"]}: {title} (座標なし)');continue
            if '/wikipedia/commons/' not in page.get('original',{}).get('source','') or not photo.lower().endswith(('.jpg','.jpeg')):skipped.append(f'{region["id"]}: {title} (Commons写真なし)');continue
            slug=slugify(page['title']);address=claim(entity,'P6375')
            items.append({**{'slug':slug,'nameJa':label(entity,'ja'),'nameKo':label(entity,'ko'),'nameEn':label(entity,'en') or page['title'],'article':'https://en.wikipedia.org/wiki/'+urllib.parse.quote(page['title'].replace(' ','_')),'address':address['text'] if address else '','lat':round(point['latitude'],6),'lon':round(point['longitude'],6),'image':f'assets/restaurants/{slug}.jpg','imageFilePage':'https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(photo)},**fixes.get(title,{})})
        if items:region['restaurants']=items
        else:region.pop('restaurants',None)
        time.sleep(.2)
    eats=[x for r in regions for x in r.get('restaurants',[])];failed=[];credits=('imageArtist','imageLicense','imageLicenseUrl')
    def save():
        out=[dict(r,restaurants=[x for x in r['restaurants'] if x.get('imageLicense')]) if r.get('restaurants') else r for r in regions]
        for r in out:
            if 'restaurants' in r and not r['restaurants']:del r['restaurants']
        target=ROOT/'data.json';temporary=target.with_suffix('.json.tmp');temporary.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');temporary.replace(target)
    for x in eats:
        old=previous.get(x['slug'],{})
        if (ROOT/x['image']).exists() and old.get('imageFilePage')==x['imageFilePage'] and old.get('imageLicense'):x.update({k:old[k] for k in credits})
    todo=[x for x in eats if not x.get('imageLicense')]
    for offset in range(0,len(todo),25):
        group=todo[offset:offset+25];titles=['File:'+urllib.parse.unquote(x['imageFilePage'].split('File:')[-1]) for x in group]
        params={'action':'query','format':'json','prop':'imageinfo','titles':'|'.join(titles),'iiprop':'url|extmetadata','iiurlwidth':500}
        raw,_=request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params));query=json.loads(raw)['query']
        aliases={a['from']:a['to'] for a in query.get('normalized',[])};infos={p['title']:p.get('imageinfo',[{}])[0] for p in query['pages'].values()}
        for x,title in zip(group,titles):
            try:
                info=infos[aliases.get(title,title)];content,kind=request(info.get('thumburl',info['url']).replace('//thumb.wikimedia.org/','//upload.wikimedia.org/'))
                if not kind.startswith('image/'):raise ValueError('Response is not an image')
                target=ROOT/x['image'];temporary=target.with_suffix('.jpg.tmp');temporary.write_bytes(content);temporary.replace(target)
                meta=info.get('extmetadata',{})
                x.update(imageArtist=clean(meta.get('Artist',{}).get('value','Wikimedia Commons')),imageLicense=clean(meta.get('LicenseShortName',{}).get('value','出典を参照')),imageLicenseUrl=meta.get('LicenseUrl',{}).get('value',x['imageFilePage']))
                print('Updated',x['slug'],flush=True);save()
            except Exception as error:failed.append(x['slug']);print('Failed',x['slug'],str(error),flush=True)
            time.sleep(1)
    save()
    for r in regions:
        if 'restaurants' in r:
            r['restaurants']=[x for x in r['restaurants'] if x.get('imageLicense')]
            if not r['restaurants']:del r['restaurants']
    print('Published',sum(len(r.get('restaurants',[])) for r in regions),'places in',sum(1 for r in regions if r.get('restaurants')),'areas')
    if skipped:print('Skipped:\n  '+'\n  '.join(skipped))
    if failed:raise SystemExit('Photo download failed for: '+', '.join(failed))
if __name__=='__main__':main()
