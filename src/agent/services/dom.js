(function(A){
  function valueOf(sel){const el=document.querySelector(sel); if(!el)return undefined; return 'value' in el?el.value:el.textContent;}
  function setValue(sel,value,{simulation=false}={}){const el=document.querySelector(sel); if(!el)throw new Error(`Champ introuvable: ${sel}`); A.click.highlight(el); if(simulation)return {simulated:true}; if('value' in el)el.value=value??''; else el.textContent=value??''; ['input','change','blur'].forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true}))); return {ok:true};}
  function nodeIdFromPage(){const m=location.pathname.match(/\/node\/(\d+)/)||document.body.textContent.match(/Node ID\s*:?\s*(\d+)/i); return m?m[1]:'';}
  function assertNode(target){if(!target.nodeId)return true; const got=nodeIdFromPage(); if(got&&String(got)!==String(target.nodeId))throw new Error(`Node ID différent: attendu ${target.nodeId}, page ${got}`); return true;}
  function readKnown(){return {title:valueOf(A.SELECTORS.title)||document.title,body:valueOf(A.SELECTORS.bodyEditor)||'',url:location.href,nodeId:nodeIdFromPage()};}
  A.dom={valueOf,setValue,nodeIdFromPage,assertNode,readKnown};
})(window.EAFCAgent=window.EAFCAgent||{});
