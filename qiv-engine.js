/* Qivbuild engine — har page par ek hi file. Data: /api/data (admin panel se). Design same rehta hai. */
(function(){
var W=window,D=document,_f=W.fetch.bind(W),RAW=/[?&]qivraw=1/.test(location.search);
var PK=(location.pathname.replace(/^\//,'').replace(/\.html$/,'')||'index'),SLUG=new URLSearchParams(location.search).get('slug')||'';
var q=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
var esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};
var P=_f('/api/data').then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(d){
 return d&&Object.keys(d).length?d:_f('/site-data.json').then(function(r){return r.json()}).catch(function(){return {}})});
W.QIV={ready:P,esc:esc};
W.fetch=function(u){if(/(^|\/)site-data\.json/.test(String(u)))return P.then(function(d){var c=JSON.parse(JSON.stringify(d||{}));c.customPages=[];return new Response(JSON.stringify(c),{headers:{'Content-Type':'application/json'}})});return _f.apply(null,arguments)};
function textNodes(){var o=[],w=D.createTreeWalker(D.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(n.parentNode.nodeName)?2:1}});while(w.nextNode())o.push(w.currentNode);return o}
function repl(a,b){if(!a||!b||a===b)return;textNodes().forEach(function(n){if(n.nodeValue.indexOf(a)>=0)n.nodeValue=n.nodeValue.split(a).join(b)})}
function settings(d){var s=d.settings||{};
 if(s.title){q('#top h1').forEach(function(h){if(h.textContent!==s.title)h.textContent=s.title})}
 if(s.phone){var dg=s.phone.replace(/\D/g,'');if(dg[0]==='0')dg='92'+dg.slice(1);q('a[href^="tel:"]').forEach(function(a){a.href='tel:+'+dg});repl('0343 0107773',s.phone)}
 if(s.whatsapp)q('a[href*="wa.me/"]').forEach(function(a){if(a.href.indexOf('wa.me/?text')<0&&a.href!==s.whatsapp)a.href=s.whatsapp});
 if(s.email){q('a[href^="mailto:"]').forEach(function(a){a.href='mailto:'+s.email;if(a.textContent!==s.email&&a.textContent.indexOf('@')>0)a.textContent=s.email});if(!/qivbuild\.site/.test(s.email))repl('info@qivbuild.site',s.email)}
 if(s.address)repl('DHA Phase 8 Lahore 54000 Pakistan',s.address);
 if(s.hero)repl('From idea to iron built body',s.hero);
 if(s.meta)q('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach(function(m){m.content=s.meta});
 if(s.keywords){var k=q('meta[name="keywords"]')[0];if(!k){k=D.createElement('meta');k.name='keywords';D.head.appendChild(k)}k.content=s.keywords}
 [['facebook-domain-verification',s.fbVerify],['google-site-verification',s.gVerify]].forEach(function(x){if(x[1]&&!q('meta[name="'+x[0]+'"]').length){var m=D.createElement('meta');m.name=x[0];m.content=String(x[1]).replace(/^.*?=/,'').replace(/^["']|["']$/g,'');D.head.appendChild(m)}})}
var EX='.sd,#grid,[id^="sl-"],#blogList,#rvList,#openNow,#openRow,#contactOpenRow,.hr,#qbVideoWrap,#faqAboveFooter,#partnersTrack,#footerCatsList,.rv,.rv-card,[data-custom],[data-qd],.qiv-p,#lb,#tabs,#chips,#projectchips,#subchips,#blogCatsBig,#blogCatsSmall';
function pbtns(){var r=D.getElementById('p-'+PK);return r?q('a.pill,button.pill',r).filter(function(e){return !e.closest(EX)}):[]}
W.QIV.EX=EX;
function ov(d){var L=(d.overrides||[]).filter(function(o){return o.s==='all'||o.s===PK});if(!L.length)return;var nodes=textNodes();
 L.forEach(function(o){if(o.k==='t'){nodes.forEach(function(n){if(n.nodeValue.trim()===o.f&&o.v!==o.f)n.nodeValue=n.nodeValue.replace(o.f,o.v)})}
 else if(o.k==='b'){var bs=pbtns(),b=bs[o.n];if(!b)return;var cur=b.textContent.trim();if(o.v&&o.v!==cur&&(cur===o.f||cur===o.v))b.textContent=o.v;
   if(o.l){if(b.tagName==='A'){if(b.getAttribute('href')!==o.l)b.setAttribute('href',o.l)}else b.setAttribute('data-qlink',o.l)}}
  else if(o.k==='h'){q('a[href]').forEach(function(a){if(a.getAttribute('href')===o.f)a.setAttribute('href',o.v)})}
 else if(o.k==='i'){q('img').forEach(function(i){if(i.getAttribute('src')===o.f)i.setAttribute('src',o.v)});q('[style*="background-image"]').forEach(function(e){if((e.style.backgroundImage||'').indexOf(o.f)>=0)e.style.backgroundImage="url('"+o.v+"')"})}})}
var CP=function(d){return (d.customPages||[]).filter(function(p){return !p.deleted})};
var pageUrl=function(p){return '/page?slug='+encodeURIComponent(p.slug)};
function menu(d){var tabs=D.getElementById('tabs');if(!tabs)return;var pend=CP(d).filter(function(p){return !p.parent&&p.showInMenu!==false}),g=0;
 var mk=function(p){var a=D.createElement('a');a.setAttribute('data-custom',p.slug);a.href=pageUrl(p);a.textContent=p.name;if(PK==='page'&&SLUG===p.slug)a.className='on';return a};
 while(pend.length&&g++<20){pend=pend.filter(function(p){if(tabs.querySelector('[data-custom="'+p.slug+'"]'))return false;var pos=p.position||'end';
  if(pos.indexOf('after:')===0){var k=pos.slice(6),ref=tabs.querySelector('[data-p="'+(k==='home'?'index':k)+'"]')||tabs.querySelector('[data-custom="'+k+'"]');if(!ref)return true;ref.parentNode.insertBefore(mk(p),ref.nextSibling);return false}
  tabs.appendChild(mk(p));return false})}
 pend.forEach(function(p){tabs.appendChild(mk(p))})}
function accordion(title,inner,first){var h='<div class="rw qiv-t" style="'+(first?'border:0;':'')+'cursor:pointer"><span class="ic"><svg class="i"><use href="#i-job"/></svg></span><span class="t">'+esc(title)+'</span><svg class="i" style="transition:transform .2s"><use href="#i-ex"/></svg></div><div class="qiv-p" style="display:none;padding:.25rem 1rem 1rem">'+inner+'</div>';return h}
D.addEventListener('click',function(e){var ql=e.target.closest&&e.target.closest('[data-qlink]');if(ql){e.preventDefault();e.stopImmediatePropagation();location.href=ql.getAttribute('data-qlink');return}},true);
D.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('.qiv-t');if(!t)return;var p=t.nextElementSibling,o=p.style.display==='none';p.style.display=o?'block':'none';var s=t.querySelector('svg:last-child');if(s)s.style.transform=o?'rotate(180deg)':''});
function dropdowns(d){var all=CP(d);all.filter(function(p){return p.parent}).forEach(function(p){
 var host=D.getElementById('p-'+(p.parent==='home'?'index':p.parent));if(!host&&PK==='page'&&SLUG===p.parent)host=D.getElementById('p-page');if(!host||host.querySelector('[data-qd="'+p.slug+'"]'))return;
 var subs=(p.subLinks||[]).filter(function(s){return !s.deleted}).map(function(s){return '<a class="pill" style="margin:.2rem .3rem .2rem 0" href="'+pageUrl(p)+'#'+esc(s.id)+'">'+esc(s.name)+'</a>'}).join('');
 var w=D.createElement('div');w.setAttribute('data-qd',p.slug);w.innerHTML=accordion(p.name,'<a class="pill f" style="margin:.2rem .3rem .2rem 0" href="'+pageUrl(p)+'">'+esc(p.title||p.name)+'</a>'+subs);host.appendChild(w)});
 /* custom page ke andar bhi (parent = custom slug) */ }
function custom(d){if(PK!=='page')return;var host=D.getElementById('p-page');if(!host||host.getAttribute('data-done'))return;host.setAttribute('data-done','1');var p=CP(d).filter(function(x){return x.slug===SLUG})[0];
 if(!p){host.innerHTML='<div class="sec" style="border:0"><h2>Page nahi mila</h2><p>Ye page delete ho gaya hai ya link galat hai.</p><a class="pill f" href="/">Home</a></div>';return}
 D.title=(p.title||p.name)+' | Qivbuild';var cn=q('link[rel="canonical"]')[0];if(cn)cn.href=location.origin+pageUrl(p);
 var btns=[];if(p.btnText)btns.push({t:p.btnText,l:p.btnLink});(p.buttons||[]).forEach(function(b){if(b&&b.t)btns.push(b)});
 var bh=btns.slice(0,10).map(function(b,i){return '<a class="pill'+(i?'':' f')+'" href="'+esc(b.l||'#')+'">'+esc(b.t)+'</a>'}).join('');
 var h='<div class="sec" style="border:0;padding-bottom:.5rem"><h2>'+esc(p.title||p.name)+'</h2></div>';
 if(p.img)h+='<div style="height:13.75rem;margin:0 1rem;border-radius:1rem;background:url(\''+esc(p.img)+'\') center/cover"></div>';
 h+='<div class="sec" style="border:0"><p style="white-space:pre-line;line-height:1.7">'+esc(p.content||'')+'</p>'+(bh?'<div class="row" style="flex-wrap:wrap">'+bh+'</div>':'')+'</div>';
 (p.subLinks||[]).filter(function(s){return !s.deleted}).forEach(function(s,i){var inner=(s.img?'<div style="height:11rem;border-radius:1rem;background:url(\''+esc(s.img)+'\') center/cover;margin-bottom:.6rem"></div>':'')+'<p style="white-space:pre-line;line-height:1.7">'+esc(s.content||'')+'</p>'+(s.btnText?'<a class="pill f" href="'+esc(s.btnLink||'#')+'">'+esc(s.btnText)+'</a>':'');h+='<div id="'+esc(s.id)+'">'+accordion(s.name,inner,i===0)+'</div>'});
 host.innerHTML=h;var hs=location.hash.slice(1),t=hs&&D.getElementById(hs);if(t){var tt=t.querySelector('.qiv-t');if(tt)tt.click();t.scrollIntoView()}}
var key=function(l){return String(l||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()};
var KNOWN=['plan','drawing plan','blueprint physique','gray','gray structure','iron frame','interior','interior design','core sculpting','exterior','exterior design','skin sculpting','renovation','body rebirth'],PRJ=['resident','commercial','industrial','town','banquet','market'];
var extraDone=0;
function extra(d){if(extraDone||!W.items||!W.items.length||!D.getElementById('cats')||typeof W.strip!=='function')return;extraDone=1;
 (d.picCats||[]).filter(function(l){var n=key(l);return n&&KNOWN.indexOf(n)<0&&!PRJ.some(function(p){return n.indexOf(p)===0})}).forEach(function(l,i){var k=key(l).replace(/ /g,'-');
  var c=D.getElementById('chips');if(c)c.insertAdjacentHTML('beforeend','<span class="pill" data-f="'+esc(k)+'">'+esc(l)+'</span>');
  D.getElementById('cats').insertAdjacentHTML('beforeend','<div class="sec"><div style="color:var(--bl);font-size:0.8125rem;font-weight:500">STEP '+(6+i)+'</div><h2>'+esc(l)+'</h2></div><div class="ph" id="sl-'+esc(k)+'"></div><div class="sec" style="border:0;padding-top:0.25rem"><div class="row" style="margin:0"><a class="pill f" href="/" data-s="top">Find out more</a><a class="pill" href="/gallery?cat='+esc(k)+'">See '+esc(l)+'</a></div></div>');
  W.strip(D.getElementById('sl-'+k),W.items.filter(function(x){return x.cat===k}))})}
function run(d){try{if(!RAW)settings(d);menu(d);custom(d);dropdowns(d);if(!RAW)ov(d)}catch(e){console.warn('qiv',e)}}
P.then(function(d){var go=function(){run(d);var t,mo=new MutationObserver(function(){clearTimeout(t);t=setTimeout(function(){run(d);try{extra(d)}catch(e){}},120)});mo.observe(D.body,{childList:true,subtree:true,characterData:true});var n=0,iv=setInterval(function(){try{extra(d)}catch(e){}if(extraDone||++n>30)clearInterval(iv)},500)};D.readyState==='loading'?D.addEventListener('DOMContentLoaded',go):go()});
})();
