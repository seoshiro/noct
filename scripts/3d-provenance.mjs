import fs from 'node:fs';
import crypto from 'node:crypto';
const files=['art/tripo/noct-tripo-original.glb','art/blender/noct-bottle.blend','public/models/noct-bottle.glb'];
const record={model:'tripo_h3_1_image_to_3d',job_id:'e34f26e7-1efb-4c58-a8a8-ca22551ca709',status:'completed',imported_reference_id:'107a9cbf-9cab-47a6-b35a-4f186015626b',result_url:'https://d8j0ntlcm91z4.cloudfront.net/user_3E5G2A3SehelVArAZlo5WHsGiG5/hf_20261105_131437_e34f26e7-1efb-4c58-a8a8-ca22551ca709.glb',cost:{quoted:12,actual:12,balance_before:584.5,balance_after:572.5,prior_total:25.5,cumulative_total:37.5,authorized_total:120,authorized_remaining:82.5},files:files.map(path=>{const b=fs.readFileSync(path);return{path,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}})};
fs.writeFileSync('docs/3d/generation-result.json',JSON.stringify(record,null,2));console.log(JSON.stringify(record));
