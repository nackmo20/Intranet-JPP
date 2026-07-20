(function(A){
  async function goToCreate(){if(isFormationForm())return; const direct='/node/add/formation'; A.state.save(); location.href=direct; await A.click.sleep(1000);}
  function isFormationForm(){return /\/node\/add\/formation/.test(location.pathname)||!!document.querySelector(A.SELECTORS.title);}
  async function goToTarget(target){if(target.url){A.state.save(); if(location.href!==target.url) location.href=target.url; return;} if(target.nodeId){A.state.save(); location.href=`/node/${target.nodeId}/edit`; return;} throw new Error('Cible sans URL ni Node ID.');}
  async function openEdit(target){if(/\/edit$/.test(location.pathname)||/\/edit\?/.test(location.href))return; const link=document.querySelector(A.SELECTORS.editLink); if(link) return A.click.robustClick(link,{label:'Modifier',confirm:A.state.get().job?.safety?.confirmClicks}); if(target.nodeId){location.href=`/node/${target.nodeId}/edit`; return;} throw new Error('Lien Modifier introuvable.');}
  async function goAdminContentAndFilter(nodeId){location.href='/admin/content'; await A.click.sleep(1000); const input=document.querySelector(A.SELECTORS.nodeIdField); if(input){input.value=nodeId; input.dispatchEvent(new Event('input',{bubbles:true}));} const first=[...document.querySelectorAll('a')].find(a=>a.href.includes(`/node/${nodeId}`)); if(first) await A.click.robustClick(first,{label:`résultat Node ${nodeId}`}); else throw new Error('Résultat admin/content introuvable.');}
  A.navigation={goToCreate,isFormationForm,goToTarget,openEdit,goAdminContentAndFilter};
})(window.EAFCAgent=window.EAFCAgent||{});
