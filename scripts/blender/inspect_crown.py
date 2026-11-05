import bpy,json,os,math,bmesh
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
os.makedirs(os.path.join(ROOT,'evidence/crown'),exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'art/crown/tripo-original.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
pts=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector([min(v[i] for v in pts) for i in range(3)]);hi=Vector([max(v[i] for v in pts) for i in range(3)])
stats={'job':'50803787-b7cd-423e-b96b-d4604011f754','bounds':[list(lo),list(hi)],'dimensions':list(hi-lo),'meshes':[{'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons)} for o in meshes],'slices':[]}
for i in range(20):
 z=lo.z+(hi.z-lo.z)*(i+.5)/20;vs=[v for v in pts if abs(v.z-z)<(hi.z-lo.z)/40]
 if vs:stats['slices'].append({'z':z,'n':len(vs),'x':[min(v.x for v in vs),max(v.x for v in vs)],'y':[min(v.y for v in vs),max(v.y for v in vs)]})
open(os.path.join(ROOT,'docs/crown/raw-inspection.json'),'w').write(json.dumps(stats,indent=2))
center=(lo+hi)/2;s=4.6/(hi.z-lo.z)
mat=bpy.data.materials.new('InspectionClay');mat.diffuse_color=(.32,.35,.37,1)
for o in meshes:
 world=[o.matrix_world@v.co for v in o.data.vertices]
 for v,p in zip(o.data.vertices,world):v.co=(p-center)*s
 o.matrix_world.identity();o.data.materials.clear();o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True;scene.render.resolution_x=650;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.color=(.4,.4,.4)
for loc,power,size in [((4,-5,6),1100,5),((-4,2,4),1300,4),((1,5,3),700,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.size=size;l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=5.6
for name,loc in [('minus-y',(0,-9,1)),('plus-x',(9,0,1)),('plus-y',(0,9,1)),('minus-x',(-9,0,1))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(ROOT,'evidence/crown/raw-'+name+'.png');bpy.ops.render.render(write_still=True)
print('CROWN_RAW',json.dumps(stats))
