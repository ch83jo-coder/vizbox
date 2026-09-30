"""
japan-density 데이터 생성 스크립트

출처
- 인구: 2015년 国勢調査 市区町村別人口 (code4fukui/population_jp)
- 시구정촌 좌표: 役所 위치 (code4fukui/localgovjp)
- 경계: 都道府県 GeoJSON (dataofjapan/land)

사용법
  pip install shapely numpy
  python scripts/build_data.py      # -> ../data.json
"""
import os, urllib.request
HERE=os.path.dirname(os.path.abspath(__file__))
CACHE=os.path.join(HERE,'.cache'); os.makedirs(CACHE,exist_ok=True)
SRC={
 'det.csv':'https://raw.githubusercontent.com/code4fukui/population_jp/main/population_jp_2015_detail.csv',
 'lg.csv':'https://raw.githubusercontent.com/code4fukui/localgovjp/master/localgovjp-utf8.csv',
 'jp.geojson':'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson',
}
for n,u in SRC.items():
    p=os.path.join(CACHE,n)
    if not os.path.exists(p): print('download',n); urllib.request.urlretrieve(u,p)
C=lambda n: os.path.join(CACHE,n)
import csv, json, math
import numpy as np
from shapely.geometry import shape, Point, MultiPolygon, Polygon
from shapely.ops import unary_union
from shapely import prepared

lg={r['cid']:r for r in csv.DictReader(open(C('lg.csv'),encoding='utf-8-sig'))}
rows=[r for r in csv.reader(open(C('det.csv'),encoding='utf-8-sig'))][1:]
use=[r for r in rows if r[1] in('0','2','3')]
fix={'富谷町':'4216','那珂川町':'40231'}
munis=[]
for r in use:
    c=r[0] if r[0] in lg else fix.get(r[4])
    if not c: print('miss',r[4]); continue
    L=lg[c]; munis.append((float(L['lat']),float(L['lng']),int(r[5]),float(r[9]) if r[9] else 10.0))

def okishift(lat,lng):
    # Okinawa inset: move up into Sea of Japan area
    if lng<131.5 and lat<28.5: return lat+7.0, lng+19.0
    return lat,lng
def keep(lat,lng):
    if lat<30 and lng>135: return False  # Ogasawara etc
    if lat<24.0: return False
    return True

gj=json.load(open(C('jp.geojson')))
polys=[]
for f in gj['features']:
    g=shape(f['geometry'])
    parts=g.geoms if isinstance(g,MultiPolygon) else [g]
    for p in parts:
        c=p.representative_point()
        if not keep(c.y,c.x): continue
        if p.area<0.0008: continue
        polys.append((f['properties']['id'],p))
land=unary_union([p for _,p in polys]).buffer(0)
landp=prepared.prep(land)

# grid
DLAT=0.045; DLNG=0.055
KMLAT=111.0; 
def cellarea(lat): return (DLAT*KMLAT)*(DLNG*111.32*math.cos(math.radians(lat)))
from collections import defaultdict
grid=defaultdict(float)
landcache={}
def island(i,j):
    k=(i,j)
    if k not in landcache:
        landcache[k]=landp.contains(Point((j+0.5)*DLNG,(i+0.5)*DLAT))
    return landcache[k]
for lat,lng,pop,area in munis:
    if not keep(lat,lng): continue
    r=math.sqrt(area/math.pi)
    sig=max(r*0.85,2.4)  # km
    R=sig*2.6
    ci=int(lat/DLAT); cj=int(lng/DLNG)
    ni=int(R/(DLAT*KMLAT))+1; nj=int(R/(DLNG*111.32*math.cos(math.radians(lat))))+1
    ws={}
    for i in range(ci-ni,ci+ni+1):
        for j in range(cj-nj,cj+nj+1):
            dy=((i+0.5)*DLAT-lat)*KMLAT; dx=((j+0.5)*DLNG-lng)*111.32*math.cos(math.radians(lat))
            d2=dx*dx+dy*dy
            if d2>R*R: continue
            if not island(i,j): continue
            ws[(i,j)]=math.exp(-d2/(2*sig*sig))
    if not ws: ws[(ci,cj)]=1
    s=sum(ws.values())
    for k,w in ws.items(): grid[k]+=pop*w/s

cells=[]
for (i,j),p in grid.items():
    lat=(i+0.5)*DLAT; lng=(j+0.5)*DLNG
    d=p/cellarea(lat)
    if d<400: continue
    la,ln=okishift(lat,lng)
    cells.append((round(ln,3),round(la,3),int(d)))
cells.sort(key=lambda c:c[2])
print(len(cells), max(c[2] for c in cells))
# outlines
lines=[]
for pid,p in polys:
    ps=p.simplify(0.012,preserve_topology=True)
    if ps.is_empty: continue
    geoms=ps.geoms if hasattr(ps,'geoms') else [ps]
    for g in geoms:
        if g.geom_type!='Polygon': continue
        pts=[]
        rp=g.representative_point(); sh=(okishift(rp.y,rp.x)!=(rp.y,rp.x))
        for x,y in g.exterior.coords:
            la,ln=(y+7.0,x+19.0) if sh else (y,x); pts.extend([round(ln,3),round(la,3)])
        if len(pts)>=8: lines.append(pts)
print(len(lines), sum(len(l) for l in lines))
json.dump({'cells':[x for c in cells for x in c],'lines':lines},open(os.path.join(HERE,'..','data.json'),'w'),separators=(',',':'))
print(os.path.getsize(os.path.join(HERE,'..','data.json')))
