import {scents,type ScentId} from './catalog.ts';
export type Size=30|50|100;
export type CartItem={id:string;scent:ScentId|'discovery';size:Size|2;quantity:number;samples?:ScentId[]};
export const prices:Record<Size,number>={30:78,50:112,100:168};
export const unitPrice=(item:CartItem)=>item.scent==='discovery'?18:prices[item.size as Size];
export const subtotal=(items:CartItem[])=>items.reduce((sum,item)=>sum+unitPrice(item)*item.quantity,0);
export const validSet=(samples:unknown):samples is ScentId[]=>Array.isArray(samples)&&samples.length===3&&new Set(samples).size===3&&samples.every(x=>scents.includes(x));
export function normalizeCart(value:unknown):CartItem[]{
 if(!Array.isArray(value))return [];
 const safe:CartItem[]=[];
 for(const row of value){
  if(!row||typeof row!=='object')continue;
  const {scent,size,quantity,samples}=row;
  if(!Number.isInteger(quantity)||quantity<1||quantity>99)continue;
  if(scent==='discovery'&&size===2&&validSet(samples))safe.push({id:'discovery',scent,size,quantity,samples:[...scents]});
  else if(scents.includes(scent)&&[30,50,100].includes(size))safe.push({id:`${scent}-${size}`,scent,size,quantity});
 }
 return safe.reduce<CartItem[]>((all,item)=>{const old=all.find(x=>x.id===item.id);if(old)old.quantity=Math.min(99,old.quantity+item.quantity);else all.push(item);return all},[]);
}
export function addItem(items:CartItem[],scent:ScentId|'discovery',size:Size|2,samples?:ScentId[]):CartItem[]{
 if(scent==='discovery'&&!validSet(samples))return items;
 return normalizeCart([...items,{id:scent==='discovery'?'discovery':`${scent}-${size}`,scent,size,quantity:1,...(samples?{samples}: {})}]);
}
export const changeQuantity=(items:CartItem[],id:string,delta:number)=>items.flatMap(item=>item.id!==id?[item]:item.quantity+delta<=0?[]:[{...item,quantity:Math.min(99,item.quantity+delta)}]);
