(function(A){
  function editors(){return [...document.querySelectorAll('.ck-editor__editable, [contenteditable="true"], textarea')];}
  function pick(role='body'){const all=editors(); if(!all.length)throw new Error(`CKEditor introuvable: ${role}`); if(role==='footer')return all[all.length-1]; if(role==='callout')return all[1]||all[0]; return all[0];}
  function read(role){const el=pick(role); return 'value' in el?el.value:el.innerHTML;}
  async function write(role,html,{simulation=false}={}){const el=pick(role); A.click.highlight(el); if(simulation)return {simulated:true,before:read(role),after:html}; if('value' in el)el.value=html; else el.innerHTML=html; ['input','change','blur'].forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true}))); return {before:'',after:read(role)};}
  function verify(role,expected){return String(read(role)||'').includes(String(expected||'').slice(0,40));}
  async function ensureReturnLink(simulation=false){const html='<p><a href="https://intranet.ac-poitiers.fr/mini-home/ma-formation-0">Retour à la page Ma formation</a></p>'; const cur=read('footer'); if(cur.includes('Retour à la page Ma formation'))return {ok:true}; return write('footer',cur+html,{simulation});}
  A.ckeditor={editors,pick,read,write,verify,ensureReturnLink};
})(window.EAFCAgent=window.EAFCAgent||{});
