"""Retopology of the single generated crown bottle. Preserve untouched source.
Body profiles are sampled from its vertices. Defective crown details are rebuilt
as manufactured metal parts, as explicitly authorised in the revised brief.
"""
import bpy,bmesh,os,math,json,statistics
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'art/crown/tripo-original.glb'))
raw=next(o for o in bpy.context.scene.objects if o.type=='MESH')
world=[raw.matrix_world@v.co for v in raw.data.vertices]
source=bpy.data.collections.new('TRIPO_50803787_UNTOUCHED');bpy.context.scene.collection.children.link(source)
for c in list(raw.users_collection):c.objects.unlink(raw)
source.objects.link(raw);source.hide_viewport=True;source.hide_render=True;raw.name='TRIPO_ORIGINAL_50803787';raw['source_job']='50803787-b7cd-423e-b96b-d4604011f754'
lo=min(v.z for v in world);hi=max(v.z for v in world);S=4.6/(hi-lo);CZ=(hi+lo)/2
def q(a,p):return sorted(a)[int((len(a)-1)*p)]
bodypts=[v for v in world if v.z<.12]
CX=(min(v.y for v in bodypts)+max(v.y for v in bodypts))/2
CY=(min(v.x for v in bodypts)+max(v.x for v in bodypts))/2
parts=[]
def active(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
def apply(o,m):active(o);bpy.ops.object.modifier_apply(modifier=m.name)
def material(name,color,metal,rough):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if metal==0:p.inputs['Coat Weight'].default_value=1;p.inputs['Coat Roughness'].default_value=.075
 return m
lacquer=material('Black_Lacquer',(.0025,.003,.004),0,.16);gold=material('Warm_Manufactured_Gold',(.64,.44,.15),1,.22);satin=material('Satin_Atomizer',(.52,.37,.13),1,.3);black=material('Nozzle_Recess',(.003,.003,.003),.1,.3)
def assign(o,m):o.data.materials.clear();o.data.materials.append(m);parts.append(o);return o
def finish(o,bevel=.012,segments=3):
 if bevel:
  m=o.modifiers.new('Manufactured edge radii','BEVEL');m.width=bevel;m.segments=segments;m.limit_method='ANGLE';m.angle_limit=.18;apply(o,m)
 for p in o.data.polygons:p.use_smooth=True
 m=o.modifiers.new('Planar reflection normals','WEIGHTED_NORMAL');m.keep_sharp=True;m.weight=50;apply(o,m)
 return o
def mesh(name,verts,faces,mat,bevel=0):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);assign(o,mat);finish(o,bevel);return o
def cylinder(name,r,depth,z,mat,vertices=96):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=(0,0,z));o=bpy.context.object;o.name=name;assign(o,mat);finish(o,.008,3);return o
def torus(name,major,minor,z):
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=96,minor_segments=10,location=(0,0,z));o=bpy.context.object;o.name=name;assign(o,gold)
 for p in o.data.polygons:p.use_smooth=True
 return o
def parent_keep(o,p):
 bpy.context.view_layer.update();w=o.matrix_world.copy();o.parent=p;o.matrix_world=w

# Sample the generated silhouette rather than inventing a replacement bottle.
levels=[lo+.003,-.475,-.455,-.42,-.34,-.20,-.06,.025,.065,.09,.11]
profiles=[]
for z in levels:
 vs=[v for v in bodypts if abs(v.z-z)<.012]
 if not vs:vs=sorted(bodypts,key=lambda v:abs(v.z-z))[:180]
 width=q([abs(v.y-CX) for v in vs],.975)*S
 depth=q([abs(v.x-CY) for v in vs],.975)*S*.55
 profiles.append(((z-CZ)*S,width,depth))
verts=[];faces=[]
for z,w,d in profiles:
 c=min(.13,d*.29);verts.extend([(w-c,-d,z),(w,-d+c,z),(w,d-c,z),(w-c,d,z),(-w+c,d,z),(-w,d-c,z),(-w,-d+c,z),(-w+c,-d,z)])
for j in range(len(profiles)-1):
 for k in range(8):faces.append((j*8+k,j*8+(k+1)%8,(j+1)*8+(k+1)%8,(j+1)*8+k))
faces.extend([tuple(reversed(range(8))),tuple((len(profiles)-1)*8+k for k in range(8))])
body=mesh('Body_Lacquer',verts,faces,lacquer,.045);body['derived_from']='Sampled cross sections of Tripo 50803787; depth corrected to reference; clean planar retopology'

# Separate real neck, moving head, opening and spray origin.
collar=cylinder('Collar_Gold',.415,.14,.78,gold)
stem=cylinder('Atomizer_Stem',.105,.22,.94,satin,48)
head=cylinder('Atomizer_Head',.215,.22,1.10,satin,80)
bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.034,depth=.012,location=(.185,-.109,1.115));nozzle=bpy.context.object;nozzle.name='Nozzle_Hole';nozzle.rotation_euler=Vector((.86,-.51,0)).to_track_quat('Z','Y').to_euler();assign(nozzle,black);finish(nozzle,.002,2);parent_keep(nozzle,head)
origin=bpy.data.objects.new('Spray_Origin',None);bpy.context.scene.collection.objects.link(origin);origin.location=(.194,-.114,1.115);origin.rotation_euler=Vector((.86,-.51,0)).to_track_quat('Z','Y').to_euler();parent_keep(origin,head)

# Crown dimensions are based on the generated crown envelope. Replace its
# softened, irregular details with thick openwork metal and precise lathe work.
crown=bpy.data.objects.new('Crown_Cap',None);bpy.context.scene.collection.objects.link(crown);crown.location=(0,0,1.03)
crownparts=[]
for name,r,d,z in [('Crown_LowerBand',.61,.075,.92),('Crown_KnurlBand',.62,.19,1.055),('Crown_UpperBand',.645,.065,1.18)]:crownparts.append(cylinder(name,r,d,z,gold))
for z,r in [(.875,.59),(.965,.625),(1.15,.635),(1.22,.625)]:crownparts.append(torus('Crown_Turned_Bead',r,.017,z))
knurls=[]
for i in range(96):
 a=i*2*math.pi/96;bpy.ops.mesh.primitive_cube_add(size=1,location=(.619*math.cos(a),.619*math.sin(a),1.055));o=bpy.context.object;o.name='Crown_Knurl';o.dimensions=(.018,.022,.145);o.rotation_euler.z=a;active(o);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);assign(o,gold);finish(o,.004,2);knurls.append(o)
active(knurls[0])
for o in knurls:o.select_set(True)
bpy.ops.object.join();knurl=bpy.context.object;knurl.name='Crown_Knurl_Detail';crownparts.append(knurl)
# Each ribbon is a closed curved rectangular section; gaps remain real geometry.
for i in range(6):
 angle=-math.pi/2+i*math.pi/3;radial=Vector((math.cos(angle),math.sin(angle),0));tangent=Vector((-math.sin(angle),math.cos(angle),0));vs=[];fs=[]
 for j in range(17):
  u=j/16;v=1-u;r=v*v*v*.60+3*v*v*u*.65+3*v*u*u*1.02+u*u*u*.86;z=v*v*v*1.185+3*v*v*u*1.58+3*v*u*u*1.8+u*u*u*2.14
  width=.29*(1-u)+.095*u;thick=.052;center=radial*r+Vector((0,0,z))
  for side,depth in [(-1,-1),(1,-1),(1,1),(-1,1)]:vs.append(tuple(center+tangent*side*width/2+radial*depth*thick/2))
 for j in range(16):
  for k in range(4):fs.append((j*4+k,j*4+(k+1)%4,(j+1)*4+(k+1)%4,(j+1)*4+k))
 fs.extend([(3,2,1,0),(64,65,66,67)])
 rib=mesh('Crown_Upright_%02d'%i,vs,fs,gold,.009);crownparts.append(rib)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=tuple(radial*.86+Vector((0,0,2.22))));tip=bpy.context.object;tip.name='Crown_Finial_%02d'%i;tip.scale=(.059,.059,.106);active(tip);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);assign(tip,gold)
 for p in tip.data.polygons:p.use_smooth=True
 crownparts.append(tip)
# Original crescent identity, absent from the generated mesh, rebuilt as metal.
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.215,depth=.055,location=(0,-.86,2.48),rotation=(math.pi/2,0,0));moon=bpy.context.object;moon.name='Crown_Crescent'
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.198,depth=.2,location=(.095,-.86,2.54),rotation=(math.pi/2,0,0));cut=bpy.context.object
m=moon.modifiers.new('Open crescent','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut;apply(moon,m);bpy.data.objects.remove(cut,do_unlink=True);assign(moon,gold);finish(moon,.008,3);crownparts.append(moon)
# Opaque internal sleeve with genuine underside recess conceals the pump.
inner=cylinder('Crown_Inner_Sleeve',.30,.45,1.08,black,64)
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.246,depth=.48,location=(0,0,.98));cut=bpy.context.object;m=inner.modifiers.new('Pump clearance','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut;apply(inner,m);bpy.data.objects.remove(cut,do_unlink=True);crownparts.append(inner)
for o in crownparts:
 if o.name in bpy.data.objects:parent_keep(o,crown)

# Thin foil marking with readable original typography, no source lettering.
front_depth=max(p[2] for p in profiles)
def lettering(name,text,size,z):
 bpy.ops.object.text_add(location=(0,-front_depth-.004,z),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=name;o.data.body=text;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.0007;o.data.bevel_depth=.0003;o.data.resolution_u=5
 font='C:/Windows/Fonts/times.ttf'
 if os.path.exists(font):o.data.font=bpy.data.fonts.load(font)
 active(o);bpy.ops.object.convert(target='MESH');assign(o,gold);return o
lettering('NOCT_Engraving','N O C T',.19,-.36);lettering('Edition_Engraving','0 1',.073,-.73)
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-front_depth-.005,-.59));rule=bpy.context.object;rule.name='NOCT_Foil_Rule';rule.dimensions=(.25,.003,.004);active(rule);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);assign(rule,gold)

# Export named parts; keep untouched Tripo and a complete studio in the .blend.
names=[o.name for o in bpy.context.scene.objects if o.type=='MESH' and o!=raw]
stats={'source_job':'50803787-b7cd-423e-b96b-d4604011f754','body_profiles':profiles,'scale':S,'parts':[]}
for name in names:
 o=bpy.data.objects[name];o.data.calc_loop_triangles();stats['parts'].append({'name':name,'triangles':len(o.data.loop_triangles)})
active(body)
for o in bpy.context.scene.objects:
 if o!=raw and (o.type=='MESH' or o in [crown,origin]):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/noct-crown.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_apply=True)
stats['glb_bytes']=os.path.getsize(os.path.join(ROOT,'public/models/noct-crown.glb'));stats['triangles']=sum(x['triangles'] for x in stats['parts']);open(os.path.join(ROOT,'docs/crown/model-edit.json'),'w').write(json.dumps(stats,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.color=(.3,.3,.3)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-2.31));floor=bpy.context.object;floor.name='Studio_Floor';floor.data.materials.append(material('Studio_SmokeGrey',(.55,.57,.56),0,1))
for name,loc,power,sx,sy in [('Left_Strip',(-4,-4,4),1300,1.5,7),('Right_Strip',(4,-2,3),1600,1,6),('Top_Softbox',(0,2,7),1800,5,5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=sx;o.data.size_y=sy;o.rotation_euler=(Vector((0,0,.3))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-11,1));cam=bpy.context.object;cam.name='Studio_Camera';cam.rotation_euler=(Vector((0,0,.1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=6.2;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art/crown/noct-crown.blend'))
print('CROWN_EDIT_COMPLETE',json.dumps(stats))
