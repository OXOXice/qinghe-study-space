'use client';
import { useEffect, useRef, useState } from 'react';
import type { ZodType } from 'zod';
export function useLocalState<T>(namespace:string,schema:ZodType<T>,initial:()=>T){
 const storageKey=`qinghe:${import.meta.env.BASE_URL}:${namespace}:v1`;
 const [data,setData]=useState<T|null>(null),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[message,setMessage]=useState('');
 const revision=useRef(0),lock=useRef(false);
 function decode(raw:string){
  const record:unknown=JSON.parse(raw);
  if(!record||typeof record!=='object')throw Error('本地记录格式异常，请在设置中导入备份以恢复。原记录尚未覆盖。');
  const value=record as Record<string,unknown>;
  if(value.version!==1||typeof value.revision!=='number'||!Number.isSafeInteger(value.revision)||value.revision<1)throw Error('本地记录版本异常，请在设置中导入备份以恢复。');
  const checked=schema.safeParse(value.data);
  if(!checked.success)throw Error('本地记录内容不完整，请在设置中导入有效备份以恢复。原记录尚未覆盖。');
  return {revision:value.revision,data:checked.data};
 }
 useEffect(()=>{
  try{const raw=localStorage.getItem(storageKey);if(raw){const record=decode(raw);revision.current=record.revision;setData(record.data);}else{revision.current=0;setData(initial());}}
  catch(e){setData(initial());setMessage(e instanceof Error?e.message:'本地记录读取失败，请检查浏览器存储权限。');}
  setReady(true);
 },[storageKey]);
 async function save(next:T,replace=false){
  if(lock.current||!ready)return false;lock.current=true;setBusy(true);
  try{
   const checked=schema.parse(next);
   const write=()=>{
    const raw=localStorage.getItem(storageKey);let currentRevision=0;
    if(raw){try{currentRevision=decode(raw).revision;}catch(error){if(!replace)throw error;localStorage.setItem(storageKey+':recovery',raw);}}
    if(!replace&&currentRevision!==revision.current)throw Error('另一个标签页已更新记录。请先刷新页面，再重新操作，避免覆盖其他修改。');
    const nextRevision=currentRevision+1;
    localStorage.setItem(storageKey,JSON.stringify({version:1,revision:nextRevision,data:checked}));revision.current=nextRevision;
   };
   if(navigator.locks?.request)await navigator.locks.request(storageKey,write);else write();
   setData(checked);setMessage('已保存在本浏览器');return true;
  }catch(e){setMessage(e instanceof DOMException&&['QuotaExceededError','SecurityError'].includes(e.name)?'本地保存失败：浏览器存储空间不足或未授权。请先导出备份，再检查存储设置。':e instanceof Error?e.message:'本地保存失败，请检查浏览器存储权限或导出备份。');return false;}
  finally{lock.current=false;setBusy(false);}
 }
 return {data,save,busy,ready,message,setMessage};
}
