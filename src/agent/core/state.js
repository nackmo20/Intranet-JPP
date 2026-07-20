(function(A){
  const KEY='eafc-agent-v2-state';
  let state={job:null,index:0,phase:'idle',running:false,paused:false,stopped:false,report:null,log:[],currentError:'',advanced:false};
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function load(){try{state=Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){} return state;}
  function get(){return state;}
  function set(p){Object.assign(state,p); save(); A.ui&&A.ui.render(); return state;}
  function log(level,msg,data){state.log.push({at:A.core.now(),level,msg,data}); if(state.log.length>1000)state.log.shift(); save(); A.ui&&A.ui.render();}
  function reset(){state={job:null,index:0,phase:'idle',running:false,paused:false,stopped:false,report:null,log:[],currentError:'',advanced:false}; save(); A.ui&&A.ui.render();}
  A.state={load,get,set,save,log,reset};
})(window.EAFCAgent=window.EAFCAgent||{});
