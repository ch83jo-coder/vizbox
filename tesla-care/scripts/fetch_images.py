"""Download the Wikimedia Commons photos listed under "photos" in data.json.

Saves a 960px version to assets/photos/<key>.jpg and records the artist and
license next to each photo. Existing photos are kept unless --all is given.
Run from any directory: python3 tesla-care/scripts/fetch_images.py
"""
import html,json,re,sys,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def request(url):
    for attempt in range(6):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Model3DIYCare/1.0 (https://tesla-care.play-labo.com/)'})
            with urllib.request.urlopen(req,timeout=40) as response:return response.read(),response.headers.get('Content-Type','')
        except Exception as error:
            if attempt==5:raise
            wait=getattr(error,'headers',None) and error.headers.get('Retry-After')
            time.sleep(min(int(wait),90) if wait and wait.isdigit() else 5*(attempt+1))
def clean(value):return html.unescape(re.sub('<[^>]+>','',value)).strip()
def main():
    data=json.loads((ROOT/'data.json').read_text());failed=[]
    (ROOT/'assets/photos').mkdir(parents=True,exist_ok=True)
    for key,photo in data['photos'].items():
        target=ROOT/f'assets/photos/{key}.jpg'
        if target.exists() and photo.get('license') and '--all' not in sys.argv:continue
        try:
            params={'action':'query','format':'json','prop':'imageinfo','titles':'File:'+photo['file'],'iiprop':'url|extmetadata','iiurlwidth':960}
            raw,_=request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params))
            info=next(iter(json.loads(raw)['query']['pages'].values()))['imageinfo'][0];meta=info.get('extmetadata',{})
            time.sleep(2)
            content,kind=request(info['thumburl'].replace('//thumb.wikimedia.org/','//upload.wikimedia.org/'))
            if not kind.startswith('image/'):raise ValueError('not an image')
            temporary=target.with_suffix('.jpg.tmp');temporary.write_bytes(content);temporary.replace(target)
            photo.update(artist=clean(meta.get('Artist',{}).get('value','Wikimedia Commons')),license=clean(meta.get('LicenseShortName',{}).get('value','')),licenseUrl=meta.get('LicenseUrl',{}).get('value',''),page='https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(photo['file'].replace(' ','_')))
            # Re-read before saving so edits made to data.json while this runs are kept.
            current=json.loads((ROOT/'data.json').read_text());current['photos'][key]=photo
            (ROOT/'data.json').write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
            print('Saved',key,photo['license'],flush=True)
        except Exception as error:failed.append(key);print('Failed',key,error,flush=True)
        time.sleep(3)
    if failed:raise SystemExit('Failed: '+', '.join(failed))
if __name__=='__main__':main()
