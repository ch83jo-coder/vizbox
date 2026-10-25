"""Refresh the selected Commons photographs without changing image selection.

Run from any directory. Existing local images survive failed downloads.
Credits and licenses are stored alongside the landmark in data.json.
A spot without imageFilePage gets the lead photo of its imageArticle (English Wikipedia).
--missing downloads only spots whose local image does not exist yet.
"""
import html,json,re,sys,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def request(url):
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'JapanTravelCatalog/1.0'})
            with urllib.request.urlopen(req,timeout=40) as response:
                return response.read(),response.headers.get('Content-Type','')
        except Exception:
            if attempt==2:raise
            time.sleep(2*(attempt+1))
def clean(value):return html.unescape(re.sub('<[^>]+>','',value)).strip()
def pick_lead_photos(spots):
    for offset in range(0,len(spots),50):
        group=spots[offset:offset+50]
        titles=[urllib.parse.unquote(s['imageArticle'].split('/wiki/')[-1]).replace('_',' ') for s in group]
        params={'action':'query','format':'json','prop':'pageimages','piprop':'name|original','titles':'|'.join(titles),'redirects':1}
        raw,_=request('https://en.wikipedia.org/w/api.php?'+urllib.parse.urlencode(params));query=json.loads(raw)['query']
        aliases={a['from']:a['to'] for key in ('normalized','redirects') for a in query.get(key,[])};pages={p['title']:p for p in query['pages'].values()}
        for spot,title in zip(group,titles):
            while title in aliases:title=aliases[title]
            page=pages.get(title,{});name=page.get('pageimage','')
            if '/wikipedia/commons/' in page.get('original',{}).get('source','') and name.lower().endswith(('.jpg','.jpeg')):spot['imageFilePage']='https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(name)
def main():
    regions=json.loads((ROOT/'data.json').read_text());spots=[s for r in regions for s in r['spots']];failed=[]
    if '--missing' in sys.argv:spots=[s for s in spots if not (ROOT/s['image']).exists()]
    pick_lead_photos([s for s in spots if not s.get('imageFilePage')])
    failed+=[s['slug'] for s in spots if not s.get('imageFilePage')];spots=[s for s in spots if s.get('imageFilePage')]
    if failed:print('No Commons lead photo:',', '.join(failed),flush=True)
    for offset in range(0,len(spots),25):
        group=spots[offset:offset+25]
        titles=[urllib.parse.unquote(s['imageFilePage'].split('/wiki/')[-1]) for s in group]
        params={'action':'query','format':'json','prop':'imageinfo','titles':'|'.join(titles),'iiprop':'url|extmetadata','iiurlwidth':960}
        raw,_=request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params))
        pages=json.loads(raw)['query']['pages'];infos={p['title'].replace('_',' '):p.get('imageinfo',[{}])[0] for p in pages.values()}
        for spot,title in zip(group,titles):
            try:
                info=infos[title.replace('_',' ')];content,kind=request(info.get('thumburl',info['url']))
                if not kind.startswith('image/'):raise ValueError('Response is not an image')
                target=ROOT/spot['image'];temporary=target.with_suffix(target.suffix+'.tmp');temporary.write_bytes(content);temporary.replace(target)
                meta=info.get('extmetadata',{})
                spot.update(imageArtist=clean(meta.get('Artist',{}).get('value','Wikimedia Commons')),imageLicense=clean(meta.get('LicenseShortName',{}).get('value','出典を参照')),imageLicenseUrl=meta.get('LicenseUrl',{}).get('value',spot['imageFilePage']),imageOriginal=info['url'])
                print('Updated',spot['slug'],flush=True)
            except Exception as error:
                failed.append(spot['slug']);print('Failed',spot['slug'],str(error),flush=True)
            time.sleep(.2)
    target=ROOT/'data.json';temporary=target.with_suffix('.json.tmp');temporary.write_text(json.dumps(regions,ensure_ascii=False,indent=2)+'\n');temporary.replace(target)
    if failed:raise SystemExit('Retained previous images for: '+', '.join(failed))
if __name__=='__main__':main()
