(function(EAFC){
  function levenshtein(a,b){a=EAFC.normalize.normalizeTitle(a);b=EAFC.normalize.normalizeTitle(b);const dp=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)dp[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return dp[a.length][b.length];}
  function titleScore(a,b){const na=EAFC.normalize.normalizeTitle(a), nb=EAFC.normalize.normalizeTitle(b); if(!na||!nb)return 0; if(na===nb)return 1; return Math.max(0,1-levenshtein(na,nb)/Math.max(na.length,nb.length));}
  function scoreCandidate(source,target,rejections={}){const key=`${source.canonicalId}|${target.canonicalId||target.nodeId}`; if(rejections[key]) return null; const reasons=[]; let score=0, method='none';
    const checks=[['nodeId',1,'Node ID'],['intentionId',.96,'intention'],['sourceOvp',.93,'source OVP'],['exportId',.9,'export'],['dispositifCode',.84,'dispositif']];
    for(const [field,points,label] of checks){if(source[field]&&target[field]&&String(source[field])===String(target[field])){score=points;method=label;reasons.push(`${label} identique`);break;}}
    if(!score && source.moduleCodes?.length && target.moduleCodes?.length && source.moduleCodes.some(x=>target.moduleCodes.includes(x))){score=.8;method='module';reasons.push('module commun');}
    if(!score && source.groups?.length && target.groups?.length && source.groups.some(x=>target.groups.includes(x))){score=.76;method='groupe';reasons.push('groupe commun');}
    if(!score && source.rne?.length && target.rne?.length && source.rne.some(x=>target.rne.includes(x))){score=.72;method='RNE';reasons.push('RNE commun');}
    const deptHit=(source.departments||[]).some(d=>(target.departments||[]).includes(d)); if(!score && deptHit){score=.6;method='département';reasons.push('département commun');}
    const ts=titleScore(source.titleSource||source.titleDrupal, target.titleDrupal||target.titleSource); if(ts>.55 && ts>score){score=ts*.55;method='titre normalisé';reasons.push('titre similaire après retrait préfixe départemental');}
    const conflicts=[]; if(deptHit===false && source.departments?.length && target.departments?.length) conflicts.push('départements divergents');
    return {targetId:target.canonicalId, nodeId:target.nodeId, score:Number(score.toFixed(3)), method, reasons, conflicts, dataUsed:{sourceTitle:source.titleSource||source.titleDrupal,targetTitle:target.titleDrupal||target.titleSource, sourceDepartments:source.departments,targetDepartments:target.departments}};
  }
  function matchAll(sources,targets,rejections={}){return sources.map(s=>{const alternatives=targets.map(t=>scoreCandidate(s,t,rejections)).filter(Boolean).sort((a,b)=>b.score-a.score);const best=alternatives[0]||null;return {sourceId:s.canonicalId,best,alternatives,ambiguous:alternatives[1]&&best&&best.score-alternatives[1].score<.08};});}
  EAFC.matching={titleScore,scoreCandidate,matchAll};
})(window.EAFC=window.EAFC||{});
