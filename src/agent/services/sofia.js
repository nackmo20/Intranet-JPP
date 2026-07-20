(function(A){
  function remaining(max,registered){const m=Number(max||0), r=Number(registered||0); return Math.max(0,m-r);}
  async function apply(op,simulation=false){const data=op.value||{}; const html=`<h2>Préinscriptions</h2><p>${data.link||data.preinscriptionUrl||''}</p><p>Places restantes : ${data.remainingPlaces??remaining(data.capacity,data.registered)}</p>`; if(simulation)return {simulated:true,html}; await A.ckeditor.write('callout',html,{simulation:false}); return {ok:true,html};}
  A.sofia={remaining,apply};
})(window.EAFCAgent=window.EAFCAgent||{});
