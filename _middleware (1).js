// Har HTML page ke <head> me verification meta tags (admin se) khud lagata hai; admin/api ko noindex karta hai
let VC={t:0,v:null},HC={t:0,v:''};
// Home ki pehli (hero) tasveer ko HTML ke saath hi preload karta hai taake LCP jaldi aaye
async function heroLink(env){
  if(HC.t&&Date.now()-HC.t<60000)return HC.v;
  let u='';
  try{const p=await env.DB.prepare("SELECT images FROM posts WHERE status='live' ORDER BY created DESC LIMIT 1").first();u=(JSON.parse(p?.images||'[]')[0])||'';
    if(!u){const c=await env.DB.prepare("SELECT img FROM categories WHERE img IS NOT NULL AND img!='' ORDER BY id LIMIT 1").first();u=c?.img||''}}catch(e){}
  let h='';
  if(typeof u==='string'&&/^(\/media\/img\/[\w.-]+|https:\/\/[^\s"'<>]+)$/.test(u)){
    const m=/^(\/media\/img\/m-[a-z0-9]+)\.webp$/.exec(u);
    h=m?`<link rel="preload" as="image" href="${u}" imagesrcset="${m[1]}-480.webp 480w,${m[1]}-800.webp 800w,${u} 1280w,${m[1]}-2000.webp 2000w" imagesizes="(min-width:900px) 60vw,100vw" fetchpriority="high">`:`<link rel="preload" as="image" href="${u}" fetchpriority="high">`}
  HC={t:Date.now(),v:h};return h}
export async function onRequest({request,env,next}){
  const u=new URL(request.url),res=await next();
  const r=new Response(res.body,res);
  if(u.pathname.startsWith('/admin')||u.pathname.startsWith('/api')){r.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');return r}
  if(!(r.headers.get('content-type')||'').includes('text/html'))return r;
  let v={};if(VC.v&&Date.now()-VC.t<60000)v=VC.v;else{try{const x=await env.DB.prepare("SELECT v FROM settings WHERE k='verify'").first();v=JSON.parse(x?.v||'{}')}catch(e){}VC={t:Date.now(),v}}
  const M={google:'google-site-verification',bing:'msvalidate.01',facebook:'facebook-domain-verification',pinterest:'p:domain_verify',linkedin:'linkedin-verification',instagram:'instagram-verification'};
  const tags=Object.keys(M).filter(k=>v[k]).map(k=>`<meta name="${M[k]}" content="${String(v[k]).replace(/"/g,'')}">`).join('');
  const home=u.pathname==='/'||u.pathname==='/index'||u.pathname==='/index.html',add=tags+(home?await heroLink(env):'');
  return add?new HTMLRewriter().on('head',{element(e){e.append(add,{html:true})}}).transform(r):r;
}
