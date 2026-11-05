import bpy, json, math, os
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'art/tripo/noct-tripo-original.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
stats={'bounds':[list(lo),list(hi)],'dimensions':list(hi-lo),'meshes':[{'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons)} for o in meshes]}
open(os.path.join(ROOT,'docs/3d/raw-inspection.json'),'w').write(json.dumps(stats,indent=2))
print('NOCT_RAW_STATS',json.dumps(stats))
center=(lo+hi)*.5;scale=3.8/(hi.z-lo.z)
for o in meshes:
 bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.select_set(False)
 for v in o.data.vertices:v.co=(o.matrix_world@v.co-center)*scale
 o.matrix_world.identity()
 mat=bpy.data.materials.new('Raw clay');mat.diffuse_color=(.27,.23,.22,1);o.data.materials.clear();o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.render.resolution_x=650;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.world.color=(.14,.14,.14)
for name,loc,power,size in [('Key',(4,-5,6),800,5),('Rim',(-4,2,4),1100,3),('Fill',(1,5,3),500,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.name=name;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=4.7
for name,loc in [('front',(0,-8,1)),('side',(8,0,1)),('back',(0,8,1)),('top',(0,-1,8))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(ROOT,'evidence/3d/raw-'+name+'.png');bpy.ops.render.render(write_still=True)
