"""Edit the actual Tripo output; preserve it in a hidden source collection.
The body and cap hulls are reconstructed from generated vertices, not a new bottle primitive.
Remove reflection sheet / baked liquid relief, hollow glass, add the authorised pump and liquid.
"""
import bpy,bmesh,math,json,os
from mathutils import Vector,Matrix
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'art/tripo/noct-tripo-original.glb'))
raw=next(o for o in bpy.context.scene.objects if o.type=='MESH')
world=[raw.matrix_world@v.co for v in raw.data.vertices]
source=bpy.data.collections.new('TRIPO_SOURCE_UNTOUCHED');bpy.context.scene.collection.children.link(source)
for col in list(raw.users_collection):col.objects.unlink(raw)
source.objects.link(raw);source.hide_viewport=True;source.hide_render=True
raw.name='TRIPO_ORIGINAL_e34f26e7';raw['source_job']='e34f26e7-1efb-4c58-a8a8-ca22551ca709'
S=3.8/(.45577377+.3194);CZ=(.45577377-.3194)/2;CX=.0625
parts=[]
def active(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
def apply(o,mod):active(o);bpy.ops.object.modifier_apply(modifier=mod.name)
def smooth(o,amount=.5,iterations=3):
 m=o.modifiers.new('Surface cleanup','SMOOTH');m.factor=amount;m.iterations=iterations;apply(o,m)
def hull_from_points(name,pts,depth=.72,voxel=.045):
 bm=bmesh.new()
 # Symmetry restores the product axis from the generated perspective view.
 for v in pts:
  x=(v.y-CX)*S;y=-(v.x+.016)*S*depth;z=(v.z-CZ)*S
  for sx,sy in [(1,1),(-1,1),(1,-1),(-1,-1)]:bm.verts.new((abs(x)*sx,abs(y)*sy,z))
 bmesh.ops.convex_hull(bm,input=list(bm.verts),use_existing_faces=False)
 unused=[v for v in bm.verts if not v.link_faces]
 if unused:bmesh.ops.delete(bm,geom=unused,context='VERTS')
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
 o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o)
 m=o.modifiers.new('Uniform generated-surface remesh','REMESH');m.mode='VOXEL';m.voxel_size=voxel; m.use_smooth_shade=True;apply(o,m);smooth(o,.7,28)
 for p in o.data.polygons:p.use_smooth=True
 o['derived_from']='Tripo e34f26e7 vertex envelope';return o
def booldiff(o,cutter):
 m=o.modifiers.new('Physical internal volume','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter;apply(o,m);bpy.data.objects.remove(cutter,do_unlink=True)
def material(name,color,metal=0,rough=.15,trans=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Transmission Weight'].default_value=trans;p.inputs['IOR'].default_value=1.5
 return m
glass=material('NOCT_Smoked_Glass',(.87,.82,.75),0,.065,1)
amber=material('NOCT_Amber_Liquid',(.36,.095,.012),0,.08,.72);amber.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.36
copper=material('NOCT_Brushed_Copper',(.48,.23,.1),.85,.22)
headmat=material('NOCT_Atomizer_Satin',(.69,.52,.31),.9,.18)
black=material('NOCT_Nozzle',(.008,.006,.008),.25,.3)
stone=material('NOCT_Black_Stone',(.012,.009,.015),0,.30)
nodes=stone.node_tree.nodes;links=stone.node_tree.links;noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=5;noise.inputs['Detail'].default_value=4;ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.43;ramp.color_ramp.elements[0].color=(.004,.003,.006,1);ramp.color_ramp.elements[1].position=.75;ramp.color_ramp.elements[1].color=(.023,.018,.024,1);links.new(noise.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs[0],nodes.get('Principled BSDF').inputs['Base Color'])
def assign(o,m):o.data.materials.clear();o.data.materials.append(m);parts.append(o);return o
body=hull_from_points('Body_Glass',[v for v in world if -.306<=v.z<=.249 and -.372<v.y<.492 and -.190<v.x<.158],.72,.032)
# Inner void inherits the generated bottle's exact outer envelope and curvature.
inner=body.copy();inner.data=body.data.copy();bpy.context.scene.collection.objects.link(inner);inner.name='Inner_Void_Construction'
for v in inner.data.vertices:
 v.co.x*=.895;v.co.y*=.70;v.co.z=(v.co.z+1.90)*.83-1.65
liquid=inner.copy();liquid.data=inner.data.copy();bpy.context.scene.collection.objects.link(liquid);liquid.name='Amber_Liquid'
booldiff(body,inner)
# A real opening from shoulder into the internal glass cavity.
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.33,depth=1.0,location=(0,0,.90));hole=bpy.context.object;booldiff(body,hole)
body['wall_thickness_nominal']=.12;body['heavy_base']=.25;assign(body,glass)
# Flat liquid surface and a small bevel for its meniscus.
active(liquid);bm=bmesh.new();bm.from_mesh(liquid.data);res=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=(0,0,-.35),plane_no=(0,0,1),clear_outer=True,clear_inner=False,dist=.00001)
edges=[e for e in bm.edges if e.is_boundary];bmesh.ops.holes_fill(bm,edges=edges,sides=0);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(liquid.data);bm.free()
bev=liquid.modifiers.new('Liquid meniscus','BEVEL');bev.width=.012;bev.segments=2;bev.limit_method='ANGLE';apply(liquid,bev);assign(liquid,amber)
cap=hull_from_points('Stone_Cap',[v for v in world if v.z>=.293],.48,.032)
# Recess underneath the original stone cap, for the press head to fit inside.
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.40,depth=.70,location=(0,0,1.20));booldiff(cap,bpy.context.object);assign(cap,stone)
def cyl(name,r,depth,z,mat,vertices=64):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=(0,0,z));o=bpy.context.object;o.name=name;b=o.modifiers.new('Machined edge','BEVEL');b.width=.025;b.segments=3;apply(o,b)
 for p in o.data.polygons:p.use_smooth=True
 return assign(o,mat)
collar=cyl('Copper_Collar',.44,.20,1.005,copper)
# Ringed collar, atomizer stem, movable pressing head and a visible nozzle recess.
stem=cyl('Atomizer_Stem',.115,.24,1.18,headmat,48)
head=cyl('Atomizer_Head',.255,.24,1.35,headmat,64)
bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.048,depth=.022,location=(0,-.251,1.35),rotation=(math.pi/2,0,0));nozzle=bpy.context.object;nozzle.name='Nozzle_Hole';assign(nozzle,black)
tube=cyl('Dip_Tube',.025,2.6,-.35,glass,24)
# Engraved foil letters use the original brand word, not a photo pasted onto glass.
bpy.ops.object.text_add(location=(-.47,-.586,.05),rotation=(math.pi/2,0,0));label=bpy.context.object;label.name='NOCT_Engraving';label.data.body='N O C T';label.data.size=.18;label.data.resolution_u=4;label.data.bevel_resolution=1;label.data.extrude=.0015;label.data.bevel_depth=.0007
font='C:/Users/gokusen/Documents/Codex/2026-11-04/task/portfolio/public/fonts/CormorantGaramond.ttf'
if os.path.exists(font):label.data.font=bpy.data.fonts.load(font)
active(label);bpy.ops.object.convert(target='MESH');label.location.x=-label.dimensions.x/2;assign(label,headmat)
# Decimate only after hollowing; named parts remain separate in the runtime asset.
for o in parts:
 if len(o.data.polygons)>3500:
  d=o.modifiers.new('Web geometry budget','DECIMATE');d.ratio=min(1,5000/len(o.data.polygons));apply(o,d)
 for p in o.data.polygons:p.use_smooth=True
 active(o);bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY',center='BOUNDS')
 o['source_job']='e34f26e7-1efb-4c58-a8a8-ca22551ca709'
runtime_names=[o.name for o in parts]
stats={'source_job':'e34f26e7-1efb-4c58-a8a8-ca22551ca709','body_method':'convex envelope of generated vertices; voxel cleanup; actual interior subtraction and neck passage','cap_method':'generated cap vertex envelope; depth correction and underside recess','parts':[{'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'dimensions':list(o.dimensions)} for o in parts]}
open(os.path.join(ROOT,'docs/3d/edited-model.json'),'w').write(json.dumps(stats,indent=2))
active(body)
for o in parts:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/noct-bottle.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_materials='EXPORT',export_apply=True)
# Editable beauty scene. Ground and lights are not in the web GLB.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.09,.045,.07,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.91));floor=bpy.context.object;floor.name='Studio_Floor';floor.data.materials.append(material('Studio_Plum',(.018,.009,.018),.25,.26))
for name,loc,power,size,color in [('Amber_Key',(-4,-4,5),1300,4,(1,.63,.32)),('Ivory_Softbox',(4,-2,4),1700,3,(1,.91,.78)),('Copper_Rim',(1,4,2),1600,3,(1,.43,.13))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=size*2;o.data.color=color;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-10,2));cam=bpy.context.object;cam.name='NOCT_Camera';cam.data.type='ORTHO';cam.data.ortho_scale=5.8;scene.camera=cam
def render(name,loc):
 cam.location=loc;cam.rotation_euler=(Vector((0,0,-.05))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(ROOT,'evidence/3d/'+name+'.png');bpy.ops.render.render(write_still=True)
render('edited-front',(0,-10,1.6));render('edited-side',(10,0,1.6));render('edited-back',(0,10,1.6))
cap.location.z+=1.2;cap.location.x+=1.0;render('edited-uncapped',(2,-10,3));cap.location.z-=1.2;cap.location.x-=1.0
cam.location=(0,-10,1.6);cam.rotation_euler=(Vector((0,0,-.05))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art/blender/noct-bottle.blend'))
print('NOCT_EDITED_STATS',json.dumps(stats))
