import json, subprocess
from concurrent.futures import ThreadPoolExecutor
segs=json.load(open('segments.json')); t=0.0; FPS=30; jobs=[]
for i,s in enumerate(segs):
    a=round(t*FPS); t+=s['dur']; b=round(t*FPS); n=b-a
    z = "1+0.0007*on" if s['zoom'] else "if(lt(on\\,6)\\,1.06-0.008*on\\,1.012+0.0005*(on-6))"
    vf=f"scale=2160:3840,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1080x1920:fps={FPS},format=yuv420p"
    jobs.append(['ffmpeg','-v','error','-y','-i',s['f'],'-vf',vf,'-frames:v',str(n),'-c:v','libx264','-preset','veryfast','-crf','18',f'segs/s{i:03d}.mp4'])
def run(j):
    r=subprocess.run(j,capture_output=True,text=True)
    if r.returncode: print(j[-1], r.stderr[-300:])
with ThreadPoolExecutor(6) as ex: list(ex.map(run,jobs))
open('segs/list.txt','w').write(''.join(f"file 's{i:03d}.mp4'\n" for i in range(len(jobs))))
print(len(jobs), 'frames total', round(t*FPS))
