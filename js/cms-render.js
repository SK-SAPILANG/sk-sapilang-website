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
  fetch(ENDPOINT+"?action=public&page="+encodeURIComponent(page),{cache:"no-store"})
    .then(r=>r.json()).then(data=>(data.changes||[]).forEach(apply)).catch(()=>{});
})();
