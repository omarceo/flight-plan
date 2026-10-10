/* schedule.js: daily tasks, scoring and statistics */
function tasksFor(d){
  const o=st.days[key(d)]||{},hid=o.hidden||[],w=d.getDay();
  const L=(st.sched||[]).filter(x=>x.days.includes(w)&&!hid.includes(x.id));
  (o.custom||[]).forEach(x=>L.push({id:x.id,c:'other',t:x.text,h:x.time||'',custom:1}));
  return byTime(L);
}
function score(d){const L=tasksFor(d),dn=(st.days[key(d)]||{}).done||{};let n=0;L.forEach(t=>{if(dn[t.id])n++});return{n,total:L.length,L,dn}}
function stats(dates){
  const cats={};let sum=0,cnt=0,best=null,good=0;const per=[];
  dates.forEach(d=>{const s=score(d),p=s.total?s.n/s.total:0,f=d>today||!s.total;per.push({d,p,f});
    if(!f){sum+=p;cnt++;if(p>=.7)good++;if(!best||p>best.p)best={d,p};
      s.L.forEach(t=>{const c=cats[t.c]=cats[t.c]||{n:0,t:0};c.t++;if(s.dn[t.id])c.n++})}});
  return{avg:cnt?sum/cnt:null,cnt,good,best,cats,per};
}
function streak(){let n=0;for(let d=new Date(today),i=0;i<400;d=addD(d,-1),i++){const s=score(d),ok=s.total&&s.n/s.total>=.5;if(!ok){if(i==0)continue;break}n++}return n}
const grade=p=>p==null?'–':p>=.9?'A+':p>=.8?'A':p>=.7?'B':p>=.6?'C':p>=.5?'D':'F';
const verdict=p=>p==null?'No data for this period yet':p>=.85?'Excellent. The trajectory is steady.':p>=.7?'Very good consistency.':p>=.5?'Acceptable, with room to improve.':'Time for a course correction.';

