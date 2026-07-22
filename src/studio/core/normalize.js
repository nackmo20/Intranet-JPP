(function(EAFC){
  const DEPT_PREFIX=/^\s*(?:0?(16|17|79|86)|(?:0?(16|17)\s*[\/\\-]\s*0?(16|17))|(?:0?(79)\s*[\/\\-]\s*0?(86)))\s*[-–—:._ ]+\s*/i;
  function removeAccents(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function stripDepartmentPrefix(title){return String(title||'').replace(DEPT_PREFIX,'').trim();}
  function normalizeTitle(title){return removeAccents(stripDepartmentPrefix(title)).toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();}
  function departmentsFromText(text){const out=new Set(); String(text||'').replace(/(^|\D)(16|17|79|86)(\D|$)/g,(_,a,d)=>{out.add(d); return _;}); return [...out];}
  function canonicalHeader(s){return removeAccents(String(s||'')).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function splitList(v){return Array.isArray(v)?v:String(v||'').split(/[|;,\n]/).map(x=>x.trim()).filter(Boolean);}
  function parseNumber(v){const m=String(v??'').replace(',','.').match(/-?\d+(?:\.\d+)?/); return m?Number(m[0]):null;}
  function isDeleteMarker(v){return /^\s*(?:__DELETE__|\[DELETE\]|SUPPRIMER|DELETE|<delete>)\s*$/i.test(String(v||''));}
  function isEmpty(v){return v==null || String(v).trim()==='';}
  EAFC.normalize={removeAccents,stripDepartmentPrefix,normalizeTitle,departmentsFromText,canonicalHeader,splitList,parseNumber,isDeleteMarker,isEmpty};
})(window.EAFC=window.EAFC||{});
