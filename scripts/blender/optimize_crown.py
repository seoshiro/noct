import bpy,os,json
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'art/crown/noct-crown.blend'))
cap=bpy.data.objects['Crown_Cap'];goldparts=[o for o in cap.children if o.type=='MESH' and any(m and m.name=='Warm_Manufactured_Gold' for m in o.data.materials)]
bpy.ops.object.select_all(action='DESELECT')
for o in goldparts:o.select_set(True)
bpy.context.view_layer.objects.active=goldparts[0];bpy.ops.object.join();bpy.context.object.name='Crown_Gold'
bpy.ops.object.select_all(action='DESELECT')
selected=[]
for o in bpy.context.scene.objects:
 if o.name.startswith('Studio') or o.name.startswith('TRIPO_ORIGINAL') or o.type in ['CAMERA','LIGHT']:continue
 if o.type=='MESH' or o.name in ['Crown_Cap','Spray_Origin']:o.select_set(True);selected.append(o.name)
bpy.context.view_layer.objects.active=bpy.data.objects['Body_Lacquer']
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/noct-crown.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_apply=True)
report={'gold_parts_merged':len(goldparts),'exported_nodes':selected,'glb_bytes':os.path.getsize(os.path.join(ROOT,'public/models/noct-crown.glb')),'source_blend_preserved':True}
open(os.path.join(ROOT,'docs/crown/optimized-model.json'),'w').write(json.dumps(report,indent=2));print('CROWN_OPTIMIZED',json.dumps(report))
