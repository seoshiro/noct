import bpy,bmesh,json,os
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'art/blender/noct-bottle.blend'))
cap=bpy.data.objects['Stone_Cap']
bpy.ops.object.select_all(action='DESELECT');cap.select_set(True);bpy.context.view_layer.objects.active=cap
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.40,depth=.70,location=(0,0,1.20));c=bpy.context.object
bpy.context.view_layer.objects.active=cap;m=cap.modifiers.new('Atomizer clearance','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=c;bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(c,do_unlink=True)
names=['Body_Glass','Amber_Liquid','Stone_Cap','Copper_Collar','Atomizer_Stem','Atomizer_Head','Nozzle_Hole','Dip_Tube','NOCT_Engraving']
result={'source_job':'e34f26e7-1efb-4c58-a8a8-ca22551ca709','parts':[],'cap_cavity_roof_z':1.55,'atomizer_head_top_z':1.47,'head_clearance':.08}
bpy.ops.object.select_all(action='DESELECT')
for name in names:
 o=bpy.data.objects[name];bm=bmesh.new();bm.from_mesh(o.data);o.data.calc_loop_triangles();pts=[o.matrix_world@v.co for v in o.data.vertices]
 result['parts'].append({'name':name,'vertices':len(o.data.vertices),'triangles':len(o.data.loop_triangles),'boundary_edges':sum(e.is_boundary for e in bm.edges),'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'signed_volume':bm.calc_volume(signed=True),'bounds':[[min(v[j] for v in pts) for j in range(3)],[max(v[j] for v in pts) for j in range(3)]]});bm.free();o.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Body_Glass']
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/noct-bottle.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art/blender/noct-bottle.blend'))
result['glb_bytes']=os.path.getsize(os.path.join(ROOT,'public/models/noct-bottle.glb'));result['total_triangles']=sum(p['triangles'] for p in result['parts'])
open(os.path.join(ROOT,'docs/3d/asset-audit.json'),'w').write(json.dumps(result,indent=2));print('NOCT_ASSET_AUDIT',json.dumps(result))
