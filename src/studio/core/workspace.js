(function(EAFC){
  const KEY='eafc-studio-v2-workspace';
  function initial(){return {type:'studio_workspace_v2',version:'2.0',jobId:EAFC.model.uid('job'),workflow:'create',sources:[],pages:[],matches:[],manualRejections:{},selectedPageId:'',workbook:null,history:[],undo:[],redo:[],safeMode:true,confirmClicks:true,simulation:false,advanced:false,updatedAt:new Date().toISOString()};}
  let state=initial();
  function snapshot(){return JSON.stringify({...state,undo:[],redo:[]});}
  function push(action){state.undo.push(snapshot()); state.redo=[]; state.history.push({id:EAFC.model.uid('act'),at:new Date().toISOString(),action}); state.updatedAt=new Date().toISOString(); save();}
  function mutate(action,fn){push(action); fn(state); save(); EAFC.ui?.render();}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn('Autosave impossible',e);}}
  function load(){try{const raw=localStorage.getItem(KEY); if(raw) state=Object.assign(initial(),JSON.parse(raw));}catch(e){console.warn('Workspace illisible',e);} return state;}
  function set(next){state=Object.assign(initial(),next); save(); return state;}
  function get(){return state;}
  function undo(){if(!state.undo.length)return; state.redo.push(snapshot()); state=Object.assign(initial(),JSON.parse(state.undo.pop())); save(); EAFC.ui?.render();}
  function redo(){if(!state.redo.length)return; state.undo.push(snapshot()); state=Object.assign(initial(),JSON.parse(state.redo.pop())); save(); EAFC.ui?.render();}
  function exportWorkspace(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`studio-eafc-workspace-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);}
  EAFC.workspace={initial,get,set,load,save,mutate,undo,redo,exportWorkspace};
})(window.EAFC=window.EAFC||{});
