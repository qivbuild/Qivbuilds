/* Qivbuild engine: admin panel ka data har page par automatic lagata hai (footer categories, social links, service content) */
(function(){
var S={d:'border:1px solid #333;border-radius:10px;margin:.5rem 0;overflow:hidden;background:#000',s:'list-style:none;cursor:pointer;padding:.8rem 1rem;font-weight:700;display:flex;justify-content:space-between;align-items:center',b:'padding:0 1rem 1rem;display:flex;flex-direction:column;gap:.35rem',
d2:'border:1px solid #222;border-radius:8px;margin:.2rem 0 0 .8rem;background:#0a0a0a',s2:'list-style:none;cursor:pointer;padding:.5rem .8rem;font-size:.9rem;color:#ccc;display:flex;justify-content:space-between',b2:'padding:0 .8rem .8rem;display:flex;flex-direction:column;gap:.3rem'};
function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function url(c){if(c.link)return c.link;var a=c.path.split('/');return 'https://qivbuild.site/gallery?cat='+a[0]+(a[1]?'&sub='+a[1]:'')+(a[2]?'&sub2='+a[2]:'')}
function A(c){var a=c.path.split('/');return '<a class="qiv-foot-link" data-cat="'+a[0]+'" data-sub="'+(a[1]||'')+'" data-sub2="'+(a[2]||'')+'" href="'+esc(url(c))+'">'+esc(c.name)+'</a>'}
function footer(cats){
  var el=document.getElementById('qivFooterCats');if(!el||!cats||!cats.length)return;
  var kids=function(id){return cats.filter(function(c){return c.parent_id==id})};
  function node(c,lvl){var k=kids(c.id);if(!k.length)return A(c);
    var st=lvl>1?[S.d2,S.s2,S.b2]:[S.d,S.s,S.b];
    return A(c)+'<details style="'+st[0]+'"><summary style="'+st[1]+'">'+esc(c.name)+' ('+k.length+')<span style="color:#888">▼</span></summary><div style="'+st[2]+'">'+k.map(function(x){return node(x,lvl+1)}).join('')+'</div></details>'}
  function top(name,items,body){return '<details style="'+S.d+'"><summary style="'+S.s+'">'+esc(name)+' ('+items+')<span style="color:#888">▼</span></summary><div style="'+S.b+'">'+body+'</div></details>'}
  var roots=kids(null),h='<div style="font-size:1.1rem;font-weight:800;margin-bottom:.3rem">Our Categories</div>';
  var sv=roots.filter(function(c){return c.grp!=='project'}),pj=roots.filter(function(c){return c.grp==='project'});
  sv.forEach(function(c){var k=kids(c.id);h+=top(c.name,k.length,k.map(function(x){return node(x,2)}).join(''))});
  if(pj.length)h+=top('Project Categories',pj.length,pj.map(A).join(''));
  pj.forEach(function(c){var k=kids(c.id);if(k.length)h+=top(c.name,k.length,k.map(function(x){return node(x,2)}).join(''))});
  el.innerHTML=h;
}
function social(s){if(!s)return;var M={fb:['facebook','https://facebook.com/'],ig:['instagram','https://instagram.com/'],th:['threads','https://threads.net/@'],li:['linkedin','https://linkedin.com/company/'],x:['x','https://twitter.com/'],pin:['pinterest','https://pinterest.com/']};
  Object.keys(M).forEach(function(k){var u=s[M[k][0]];document.querySelectorAll('a.soc-'+k).forEach(function(a){if(u)a.href=/^https?:/.test(u)?u:M[k][1]+u})})}
function svc(o){if(!o)return;var map={plan:'drawing'};Object.keys(o).forEach(function(k){if(!o[k]||!o[k].html)return;var p=document.querySelector('#'+(map[k]||k)+'Panel .drawing-body');if(p)p.innerHTML=o[k].html})}
function credit(){document.querySelectorAll('footer div').forEach(function(d){if(d.children.length===0&&/©\s*2026\s*Qivbuild/.test(d.textContent)&&d.textContent.indexOf('Mudassar')<0){d.innerHTML='© 2026 Qivbuild · qivbuild.site · Designed by <a href="https://www.facebook.com/mudssarali.tk" rel="noopener" style="color:inherit;text-decoration:underline">Mudassar Ali</a>'}})}

/* ---- Category sync: page ke andar likhe CATS/PROJECTS/SUBCATS/PROJECT_STYLES/TOWN_* ko admin ke data se badalta hai ---- */
function cache(){try{return JSON.parse(localStorage.getItem('qivcats')||'null')}catch(e){return null}}
function sub(cats,id){return cats.filter(function(c){return c.parent_id==id}).map(function(c){return[c.slug,c.name]})}
function applyData(cats){if(!cats||!cats.length)return;
 function fill(a,l){a.length=0;l.forEach(function(x){a.push(x)})}
 function clr(o){Object.keys(o).forEach(function(k){delete o[k]})}
 var roots=cats.filter(function(c){return c.parent_id===null});
 try{
  if(typeof CATS!=='undefined')fill(CATS,roots.filter(function(c){return c.grp!=='project'}).map(function(c){return[c.slug,c.name]}));
  if(typeof PROJECTS!=='undefined')fill(PROJECTS,roots.filter(function(c){return c.grp==='project'}).map(function(c){return[c.slug,c.name]}));
  if(typeof SUBCATS!=='undefined'){clr(SUBCATS);roots.filter(function(c){return c.grp!=='project'}).forEach(function(c){SUBCATS[c.slug]=sub(cats,c.id)})}
  if(typeof PROJECT_STYLES!=='undefined'){clr(PROJECT_STYLES);roots.filter(function(c){return c.grp==='project'}).forEach(function(c){PROJECT_STYLES[c.slug]=sub(cats,c.id)})}
  if(typeof TOWN_SUBSUB!=='undefined'){var t=roots.filter(function(c){return c.slug==='town'})[0];
   if(t){var old={drawings:TOWN_DRAWINGS,ourdesign:TOWN_DESIGN,ourstyle:TOWN_STYLE,ourcreations:TOWN_CREATIONS};clr(TOWN_SUBSUB);
    cats.filter(function(c){return c.parent_id==t.id}).forEach(function(c){var a=old[c.slug]||[];fill(a,sub(cats,c.id));TOWN_SUBSUB[c.slug]=a})}}
 }catch(e){}}
window.QIV_APPLY=function(){applyData(cache())};
function sync(cats){if(!cats)return;var n=JSON.stringify(cats),o=localStorage.getItem('qivcats');
 if(n!==o){try{localStorage.setItem('qivcats',n)}catch(e){return}
  var g=+sessionStorage.getItem('qivr')||0;if(Date.now()-g>8000){sessionStorage.setItem('qivr',Date.now());location.reload()}}}
function openHash(){var h=(location.hash||'').slice(1),m={plan:'drawing'},b=h&&document.getElementById((m[h]||h)+'Toggle');if(b&&!document.getElementById((m[h]||h)+'Panel').offsetHeight)b.click()}
function get(u){return fetch(u,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
function run(){Promise.all([get('/api/categories'),get('/api/settings')]).then(function(r){sync(r[0]);footer(r[0]);openHash();social(r[1]&&r[1].social);var n=0,t=setInterval(function(){svc(r[1]&&r[1].svc);if(++n>8)clearInterval(t)},700);credit()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
window.addEventListener('load',function(){setTimeout(run,1200)});
})();
