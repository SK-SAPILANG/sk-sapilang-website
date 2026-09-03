(function(){
  "use strict";
  const ENDPOINT=window.SK_CMS_ENDPOINT||localStorage.getItem("skCmsEndpoint")||"";
  const page=(location.pathname.split("/").pop()||"home.html").toLowerCase();
  if(!ENDPOINT||page==="content-admin.html")return;
  const escapeSelector=value=>{try{return CSS.escape(value)}catch(e){return value.replace(/[^a-zA-Z0-9_-]/g,"\\$&")}};
  function apply(change){
    let el;try{el=document.querySelector(change.selector)}catch(e){return}
    if(!el)return;
    switch(change.property){
      case"text":el.textContent=change.value;break;
      case"html":el.innerHTML=change.value;break;
      case"src":if(el.tagName==="IMG")el.src=change.value;break;
      case"href":if(el.tagName==="A")el.href=change.value;break;
      case"hidden":el.hidden=change.value==="true";break;
    }
  }
  function renderItems(items){
    if(!items||!items.length)return;
    const main=document.querySelector("main")||document.body;
    let section=document.getElementById("cmsManagedContent");
    if(!section){
      section=document.createElement("section");section.id="cmsManagedContent";section.className="cms-managed-section";
      section.innerHTML='<div class="cms-managed-inner"><div class="cms-managed-heading"><span>Website Updates</span><h2>Additional Content</h2></div><div class="cms-managed-grid"></div></div>';
      main.appendChild(section);
      const style=document.createElement("style");style.textContent='.cms-managed-section{padding:56px 18px;background:#f4f7fa}.cms-managed-inner{width:min(1180px,100%);margin:auto}.cms-managed-heading span{color:#b76800;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.cms-managed-heading h2{color:#0b2545!important;margin:6px 0 22px}.cms-managed-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.cms-managed-card{overflow:hidden;border:1px solid #cad8e2;border-radius:14px;background:#fff;box-shadow:0 10px 25px #0b254512}.cms-managed-card img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}.cms-managed-copy{padding:20px}.cms-managed-meta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:9px}.cms-managed-meta span{padding:5px 9px;border-radius:999px;background:#fff1d2;color:#713d00;font-size:12px;font-weight:800}.cms-managed-card h3{margin:0 0 8px;color:#0b2545!important}.cms-managed-card p{color:#405e70!important}.cms-managed-card a{display:inline-flex;margin-top:10px;padding:10px 14px;border-radius:8px;background:#f59e0b;color:#0b2545!important;text-decoration:none;font-weight:800}@media(max-width:850px){.cms-managed-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.cms-managed-grid{grid-template-columns:1fr}}';document.head.appendChild(style);
    }
    const grid=section.querySelector('.cms-managed-grid');
    items.forEach(item=>{
      const card=document.createElement('article');card.className='cms-managed-card';
      if(item.mediaUrl&&/\.(png|jpe?g|gif|webp)(\?|$)/i.test(item.mediaUrl)||item.mediaUrl&&item.mediaUrl.includes('uc?export=view')){const img=document.createElement('img');img.src=item.mediaUrl;img.alt=item.title||'Website image';img.loading='lazy';card.appendChild(img)}
      const copy=document.createElement('div');copy.className='cms-managed-copy';
      const meta=document.createElement('div');meta.className='cms-managed-meta';[item.type,item.status,item.date].filter(Boolean).forEach(value=>{const tag=document.createElement('span');tag.textContent=value;meta.appendChild(tag)});copy.appendChild(meta);
      const title=document.createElement('h3');title.textContent=item.title;copy.appendChild(title);
      if(item.description){const p=document.createElement('p');p.textContent=item.description;copy.appendChild(p)}
      const url=item.linkUrl||item.mediaUrl;if(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.type&&item.type.toLowerCase().includes('publication')?'Open PDF / Document':'View Details';copy.appendChild(a)}
      card.appendChild(copy);grid.appendChild(card);
    });
  }
  const callback="skCmsPublic"+Date.now()+Math.floor(Math.random()*1000);
  window[callback]=data=>{try{(data.changes||[]).forEach(apply);renderItems(data.items||[])}finally{delete window[callback];script.remove()}};
  const script=document.createElement("script");
  script.src=ENDPOINT+"?action=public&page="+encodeURIComponent(page)+"&callback="+callback+"&_="+Date.now();
  script.onerror=()=>{delete window[callback];script.remove()};
  document.head.appendChild(script);
})();
