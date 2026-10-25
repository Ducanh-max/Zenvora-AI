self.addEventListener('push',event=>{
 let data;try{data=event.data?.json();}catch{return;}
 if(!data||typeof data.title!=='string')return;
 const path=['/courses','/learn','/learn/library'].includes(data.path)?data.path:'/courses';
 event.waitUntil(self.registration.showNotification(data.title.slice(0,120),{body:String(data.body||'').slice(0,500),tag:String(data.id||'aunora-course'),icon:'/brand/aunora-logo.webp.png',data:{path}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const path=event.notification.data?.path;
 const target=new URL(['/courses','/learn','/learn/library'].includes(path)?path:'/courses',self.location.origin).href;
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(target);return client.focus();}}return clients.openWindow(target);}));
});
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(clients.claim()));
