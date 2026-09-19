// Website ID is a public installation identifier, never an API key.
export const websiteId='71b879cc-c552-4083-becb-44ef2b1b65f6';
export function cloudEventName(event, validation) {
 return validation ? `validation_${event}` : event;
}
let ready=false, queue=[];
export function cloudEnabled() {return location.hostname==='alofpaca.github.io';}
export function cloudTrack(event,data) {
 if(!cloudEnabled() || navigator.doNotTrack==='1') return;
 if(!ready) {if(queue.length<20)queue.push([event,data]);return;}
 Promise.resolve(window.umami?.track(event,data)).catch(()=>{});
}
export function installCloudTracker(pageId) {
 if(location.hostname!=='alofpaca.github.io') return;
 const validation=new URL(location.href).searchParams.get('validation')==='1'||document.querySelector('meta[name="analytics-validation"]')?.content==='true';
 const product=document.querySelector('meta[name="analytics-product"]')?.content||'server-cost-01';
 window.serverCostBeforeSend=(type,payload)=>{
  if(localStorage.getItem('umami.disabled')==='1') return false;
  return {...payload,url:location.pathname,referrer:payload.referrer?new URL(payload.referrer,location.href).origin:'',tag:validation?'validation':product};
 };
 const script=document.createElement('script');
 script.src='https://cloud.umami.is/script.js';
 script.dataset.websiteId=websiteId;
 script.dataset.autoTrack='false';
 script.dataset.beforeSend='serverCostBeforeSend';
 script.dataset.doNotTrack='true';
 script.onload=()=>{ready=true;cloudTrack(cloudEventName('page_view',validation),{page_id:pageId});for(const [event,data] of queue)cloudTrack(event,data);queue=[];};
 document.head.append(script);
}
