import {installCloudTracker,cloudEventName,cloudTrack} from './umami-config.mjs';
// No input values or persistent visitor ID; Cloud adapter remains private.
const pageId=crypto.randomUUID(), trafficKind=new URL(location.href).searchParams.get('validation')==='1'||document.querySelector('meta[name="analytics-validation"]')?.content==='true'?'test':'real';
installCloudTracker(pageId);
export function measure(event,linkId='',linkKind='') {
 if(location.hostname==='alofpaca.github.io') {
  if(event!=='page_view') cloudTrack(cloudEventName(event,trafficKind==='test'),{link_id:linkId,link_kind:linkKind,page_id:pageId});
  return;
 }
 fetch('/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event_id:crypto.randomUUID(),page_id:pageId,event,link_id:linkId,link_kind:linkKind,traffic_kind:trafficKind}),keepalive:true}).catch(()=>{});
}
measure('page_view');
const providers={'support.conoha.jp':'conoha-support','game.conoha.jp':'conoha-price','vps.xserver.ne.jp':'xserver-vps','games.xserver.ne.jp':'xserver-games'};
for(const a of document.querySelectorAll('a[href]')) {
 const affiliate=a.getAttribute('href')==='https://px.a8.net/svt/ejp?a8mat=4BCAZD+3B2PRM+CO4+2N9KIA';
 const id=affiliate?'xserver-vps-affiliate':a.dataset.measure||providers[new URL(a.href).hostname];
 if(id) a.addEventListener('click',()=>measure('outbound_click',id,affiliate?'affiliate':a.dataset.linkKind||'official'));
}
