import bpy,json,os
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'art/tripo/noct-tripo-original.glb'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');coords=[o.matrix_world@v.co for v in o.data.vertices]
adj=[[] for _ in coords]
for edge in o.data.edges:a,b=edge.vertices;adj[a].append(b);adj[b].append(a)
seen=set();comps=[]
for i in range(len(coords)):
 if i in seen:continue
 stack=[i];seen.add(i);ids=[]
 while stack:
  v=stack.pop();ids.append(v)
  for n in adj[v]:
   if n not in seen:seen.add(n);stack.append(n)
 p=[coords[k] for k in ids];comps.append({'count':len(ids),'bounds':[[min(v[j] for v in p) for j in range(3)],[max(v[j] for v in p) for j in range(3)]]})
sections=[]
for k in range(24):
 z=-.46+k*.04;p=[v for v in coords if z<=v.z<z+.04]
 if p:sections.append({'z':round(z,3),'n':len(p),'x':[round(min(v.x for v in p),4),round(max(v.x for v in p),4)],'y':[round(min(v.y for v in p),4),round(max(v.y for v in p),4)]})
result={'components':sorted(comps,key=lambda c:-c['count'])[:15],'sections':sections}
open(os.path.join(ROOT,'docs/3d/raw-sections.json'),'w').write(json.dumps(result,indent=2));print('NOCT_SECTIONS',json.dumps(result))
