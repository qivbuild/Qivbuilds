// functions/sitemap.xml.js  ->  https://qivbuild.site/sitemap.xml
// Mukhya pages + admin ki live posts (jin par "index" on ho) khud list hoti hain.
export async function onRequest({env}){
  const O='https://qivbuild.site';
  const pages=['/','/about','/services','/byowner','/gallery','/blog','/reviews','/contact','/hours'];
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const day=ms=>{const t=+ms;return new Date(t>0?t:Date.now()).toISOString().slice(0,10)};
  let posts=[];
  try{posts=(await env.DB.prepare("SELECT slug,created FROM posts WHERE status='live' AND indexed ORDER BY created DESC").all()).results||[]}catch(e){}
  const today=day(Date.now());
  const urls=pages.map(p=>`<url><loc>${O}${p==='/'?'/':p}</loc><lastmod>${today}</lastmod></url>`)
    .concat(posts.filter(p=>p.slug).map(p=>`<url><loc>${esc(O+'/p/'+encodeURIComponent(p.slug))}</loc><lastmod>${day(p.created)}</lastmod></url>`));
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'public, max-age=3600'}});
}
