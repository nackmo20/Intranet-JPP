(function(A){
  function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
  function visible(el){if(!el)return false; const r=el.getBoundingClientRect(); const st=getComputedStyle(el); return r.width>=0&&r.height>=0&&st.visibility!=='hidden'&&st.display!=='none';}
  async function waitFor(selector,{timeout=12000,root=document}={}){const start=Date.now(); while(Date.now()-start<timeout){const el=typeof selector==='string'?root.querySelector(selector):selector; if(visible(el))return el; await sleep(120);} throw new Error(`Élément introuvable ou invisible: ${selector}`);}
  function highlight(el){const old=el.style.outline; el.style.outline='3px solid #ffb000'; setTimeout(()=>{el.style.outline=old},1200);}
  function dispatch(el,type){el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true}));}
  async function robustClick(selector,{label='',confirm=false,beforeClick=null,delay=650}={}){const el=await waitFor(selector); el.scrollIntoView({block:'center',inline:'center'}); highlight(el); if(confirm&&!window.confirm(`Cliquer: ${label||selector} ?`)){const err=new Error('clic annulé par utilisateur'); err.cancelled=true; throw err;} if(beforeClick) await beforeClick(el); ['pointerover','pointerdown','mousedown','pointerup','mouseup','click'].forEach(t=>{try{el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window}));}catch(e){dispatch(el,t);}}); el.click(); A.state.log('info',`clic ${label||selector}`); await sleep(delay); return el;}
  A.click={sleep,waitFor,robustClick,highlight,visible};
})(window.EAFCAgent=window.EAFCAgent||{});
