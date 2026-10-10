/* views.js: Today, Plan, Settings and Insights pages */
function art(p){
  return `<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
<rect x="252" y="0" width="34" height="176" fill="#4c3858"/><rect x="334" y="0" width="22" height="120" fill="#4c3858"/>
<circle cx="360" cy="84" r="54" fill="#8aa592"/>
<path d="M322 74A54 54 0 0 0 322 182Z" fill="#17463f"/><path d="M322 74A54 54 0 0 1 322 182Z" fill="#d6846a"/>
<circle cx="322" cy="128" r="27" fill="#0d121b" stroke="#f4ead2" stroke-width="3.5"/>
<path d="M236 300L270 224Q318 198 366 224L400 270V300Z" fill="#35506b"/><path d="M302 300L318 236L334 300Z" fill="#0d121b"/>
<circle cx="236" cy="258" r="30" fill="#c99a6b"/><circle cx="226" cy="206" r="13" fill="#17463f"/>
<path d="M290 176Q250 196 206 190M286 168Q248 176 214 168" fill="none" stroke="#f4ead2" stroke-width="1.2" opacity=".5"/>
<rect x="236" y="292" width="164" height="8" fill="#f4ead8" opacity=".4"/></svg>`;
}
const hm=()=>{const n=new Date();return pad(n.getHours())+':'+pad(n.getMinutes())};
const clock=n=>n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:!!st.h12})+'<small>:'+pad(n.getSeconds())+'</small>';
const sub=t=>[t.k,t.e?ft(t.h)+' to '+ft(t.e):'',t.s].filter(Boolean).join(', ');
const icon=p=>`<svg viewBox="0 0 24 24"><path d="${p}"/></svg>`;

function topbar(){return `<div class="top"><div><b class="brandname">Flight Plan</b><small>${st.name?'Hello, '+esc(st.name)+(st.year?' ('+esc(st.year)+')':''):'Your academic mission control'}</small></div><div class="tb">${Bank.chip()}<button class="ib" data-a="theme" aria-label="Toggle dark mode" title="Light or dark">${icon(isDark()?SUN:MOON)}</button><button class="ib" data-pg="set" aria-label="Settings" title="Settings">${icon(GEAR)}</button></div></div>`}
function welcome(){return `<div class="narrow"><div class="top"><b>Flight Plan</b><div class="tb"><button class="ib" data-a="theme" aria-label="Toggle dark mode">${icon(isDark()?SUN:MOON)}</button></div></div><div class="hero" style="min-height:230px">${art(0)}<div><h1>Welcome</h1><p style="max-width:200px">Build your timetable and daily routine, then track your performance every week, month, and term.</p></div></div>
<div class="card fm" style="margin-top:12px"><div><label class="l" for="wn">Your name</label><input id="wn" type="text"></div><div><label class="l" for="wy">Year or level (optional)</label><input id="wy" type="text" placeholder="For example: Year 2, Level 4"></div>
<button class="btn" data-a="start0">Start with an empty plan</button><button class="btn g" data-a="startex">Load an example routine</button><p>Works for any faculty and any year. Add your classes, labs, and habits from the Plan tab.</p></div></div>`}

function home(){
  const k=key(cur),s=score(cur),p=s.total?s.n/s.total:0,isT=k==key(today),o=dd(k),now=hm();
  const live=isT?s.L.find(t=>!s.dn[t.id]&&t.h&&t.e&&t.h<=now&&now<t.e):null;
  const nx=isT?s.L.find(t=>!s.dn[t.id]&&t.h&&t.h>now):null;
  let hj='';try{hj=cur.toLocaleDateString('en-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'})}catch(e){}
  const msg=!s.total?'Nothing planned. Add a task.':live?`Now: <b>${esc(live.t)}</b>`:nx?`Next: <b>${esc(nx.t)}</b> at ${ft(nx.h)}`:s.n==s.total?'Everything done. Orbit complete.':`${s.n} of ${s.total} done`;
  let h=topbar()+`<div class="home"><div class="hero">${art(p)}<div><h1>${DN[cur.getDay()]}</h1><p>${cur.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p><p>${esc(hj)}</p>${isT?`<div class="clk" id="clk">${clock(new Date())}</div><div class="tz">${esc(Intl.DateTimeFormat().resolvedOptions().timeZone||'')}</div>`:''}<div class="pct">${pc(p)}% complete</div><div class="pbar"><i style="width:${pc(p)}%"></i></div></div>
  <div class="next"><span>${msg}</span><span class="arrows"><button data-a="prevd" aria-label="Previous day">‹</button><button data-a="nextd" aria-label="Next day">›</button></span></div></div><div>`;
  h+=Focus.homeCard()+`<div class="sec"><h2>${isT?"Today's plan":'Plan for the day'}</h2>${isT?'':'<button class="lnk" data-a="today">Back to today</button>'}</div><ul class="tl">`;
  s.L.forEach(t=>{const d=!!s.dn[t.id];
    h+=`<li class="tk ${t.c=='class'?'cl':''} ${d?'done':''}"><input type="checkbox" id="t_${t.id}" data-id="${t.id}" ${d?'checked':''}><time>${ft(t.h)}</time><div><label for="t_${t.id}">${esc(t.t)}</label>${sub(t)?`<small>${esc(sub(t))}</small>`:''}</div><button class="x" data-del="${t.id}" aria-label="Remove task">×</button></li>`});
  h+=`</ul>`;
  if(!s.L.length)h+=`<div class="empty">This day is empty. Add a task below, or build your weekly timetable in the Plan tab.</div>`;
  h+=`<div class="add"><input type="text" id="newt" placeholder="Add a one-off task" aria-label="New task"><input type="time" id="newh" aria-label="Time"><button data-a="add">Add</button></div>`;
  if(o.hidden.length)h+=`<div style="text-align:center;margin-top:10px"><button class="lnk" data-a="restore">Restore removed tasks (${o.hidden.length})</button></div>`;
  return h+'</div></div>';
}
function plan(){
  const ord=order(),it=(st.sched||[]).find(x=>x.id==ed)||{days:[pd],c:'class'};
  const L=byTime((st.sched||[]).filter(x=>x.days.includes(pd)));
  let h=topbar()+`<div class="sec" style="margin-top:0"><h2>Weekly plan</h2></div><div class="dsel">${ord.map(w=>`<button data-pd="${w}" class="${pd==w?'on':''}">${SH[w]}</button>`).join('')}</div><div class="cols"><div class="card">`;
  if(!L.length)h+=`<div class="empty">Nothing scheduled on ${DN[pd]}.</div>`;
  L.forEach(x=>{h+=`<div class="pr"><span>${esc(x.t)}<small>${esc([CAT[x.c],x.k,x.h?ft(x.h)+(x.e?' to '+ft(x.e):''):'',x.s].filter(Boolean).join(', '))}</small></span><button class="chip" data-ed="${x.id}">Edit</button><button class="x" data-sd="${x.id}" aria-label="Delete from plan">×</button></div>`});
  h+=`</div><div class="card fm" id="form"><h3>${ed?'Edit item':'Add to plan'}</h3>
  <div><label class="l" for="f_t">Title</label><input id="f_t" type="text" placeholder="Course name, lab, habit..." value="${esc(it.t||'')}"></div>
  <div class="row"><div><label class="l" for="f_c">Category</label><select id="f_c">${Object.keys(CAT).filter(c=>c!='other').map(c=>`<option value="${c}" ${it.c==c?'selected':''}>${CAT[c]}</option>`).join('')}</select></div>
  <div><label class="l" for="f_k">Class type</label><select id="f_k"><option value="">None</option>${KINDS.map(k=>`<option ${it.k==k?'selected':''}>${k}</option>`).join('')}</select></div></div>
  <div class="row"><div><label class="l" for="f_h">Starts</label><input id="f_h" type="time" value="${it.h||''}"></div><div><label class="l" for="f_e">Ends</label><input id="f_e" type="time" value="${it.e||''}"></div></div>
  <div><label class="l" for="f_s">Room, instructor, or note</label><input id="f_s" type="text" value="${esc(it.s||'')}"></div>
  <div><span class="l">Repeats every</span><div class="dchips">${ord.map(w=>`<label><input type="checkbox" class="fd" value="${w}" ${it.days.includes(w)?'checked':''}><span>${SH[w]}</span></label>`).join('')}</div></div>
  <div class="row"><button class="btn" data-a="sadd">${ed?'Save changes':'Add to plan'}</button>${ed?'<button class="btn g" data-a="cancel">Cancel</button>':''}</div></div></div>`;
  h+=`<div class="sec"><h2>Projects</h2></div><div class="card">`;
  if(!st.projects.length)h+=`<div class="empty">No projects yet. Add one idea to build this term.</div>`;
  st.projects.forEach(p=>{h+=`<div class="pr"><span>${esc(p.name)}</span><button class="chip s${p.s}" data-pc="${p.id}">${['Idea','Active','Done'][p.s]}</button><button class="x" data-pd2="${p.id}" aria-label="Remove project">×</button></div>`});
  return h+`<div class="add"><input type="text" id="newp" placeholder="New project" aria-label="New project"><button data-a="padd">Add</button></div></div>`;
}
function settings(){
  return topbar()+`<div class="sec" style="margin-top:0"><h2>Settings</h2><button class="lnk" data-pg="home">Done</button></div>
  <div class="cols"><div class="card fm"><div><label class="l" for="sn">Name</label><input id="sn" type="text" value="${esc(st.name)}"></div><div><label class="l" for="sy">Year or level</label><input id="sy" type="text" value="${esc(st.year)}"></div>
  <div class="row"><div><label class="l" for="ts">Term starts</label><input type="date" id="ts" value="${st.term.start}"></div><div><label class="l" for="te">Term ends</label><input type="date" id="te" value="${st.term.end}"></div></div>
  <div class="row"><div><label class="l" for="sw">Week starts on</label><select id="sw">${[6,0,1].map(w=>`<option value="${w}" ${st.ws==w?'selected':''}>${DN[w]}</option>`).join('')}</select></div><div><label class="l" for="sth">Appearance</label><select id="sth">${[['auto','Match device'],['light','Light'],['dark','Dark']].map(a=>`<option value="${a[0]}" ${st.theme==a[0]?'selected':''}>${a[1]}</option>`).join('')}</select></div></div>
  <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="s12" style="width:auto" ${st.h12?'checked':''}>Use 12-hour clock</label></div>
  <div><div class="card fm"><h3>Schedule</h3><p>Replace your plan with an example routine, or wipe everything and start over.</p>
  <button class="btn g" data-a="ex">${cf=='ex'?'Tap again to replace my plan':'Load example routine'}</button><button class="btn d" data-a="reset">${cf=='reset'?'Tap again to erase everything':'Erase all data'}</button></div>
  <div class="card"><h3>Backup</h3><p>Data stays in this browser only. Copy the text to move it to another device.</p><textarea id="bk" aria-label="Backup text"></textarea><div class="add"><button data-a="bexp">Show backup</button><button data-a="bimp">Import</button></div></div></div></div>`;
}
function chart(items,line){
  const n=items.length,W=700,H=210,L=30,B=26,T=16,hh=H-B-T,bw=(W-L)/n;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  [0,.5,1].forEach(v=>{const y=T+hh*(1-v);s+=`<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="0" y="${y+4}">${pc(v)}</text>`});
  const pts=[];
  items.forEach((x,i)=>{const cx=L+i*bw+bw/2,y=T+hh*(1-x.p);
    if(!x.f){if(line)pts.push([cx,y]);else s+=`<rect x="${cx-Math.min(bw*.3,22)}" y="${y}" width="${Math.min(bw*.6,44)}" height="${Math.max(hh*x.p,2)}" rx="3" fill="${col(x.p)}"/><text x="${cx}" y="${y-5}" text-anchor="middle">${pc(x.p)}</text>`}
    s+=`<text x="${cx}" y="${H-8}" text-anchor="middle">${x.label}</text>`});
  if(line&&pts.length){const d=pts.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join(' ');s+=`<path d="${d} L${pts[pts.length-1][0]} ${T+hh} L${pts[0][0]} ${T+hh}z" fill="var(--acc)" opacity=".12"/><path d="${d}" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linejoin="round"/>`+pts.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="var(--card)" stroke="var(--acc)" stroke-width="2"/>`).join('')}
  return s+'</svg>';
}
function weeks(per,pre){const g={};per.forEach(x=>{const k=key(sow(x.d));(g[k]=g[k]||[]).push(x)});
  return Object.keys(g).sort().map((k,i)=>{const a=g[k].filter(x=>!x.f);return{label:pre+(i+1),p:a.length?a.reduce((s,x)=>s+x.p,0)/a.length:0,f:!a.length}})}
function heat(per){
  let h='<div class="heat">'+order().map(w=>`<span class="hd">${SH[w]}</span>`).join('');
  for(let i=0;i<(per[0].d.getDay()-st.ws+7)%7;i++)h+='<span class="hd"></span>';
  per.forEach(x=>{const t=x.p>=.7?['good','ong']:x.p>=.4?['mid','onm']:['low','onl'];h+=x.f?`<span>${x.d.getDate()}</span>`:`<span style="background:var(--${t[0]});color:var(--${t[1]})">${x.d.getDate()}</span>`});
  return h+'</div>';
}
function evalPage(){
  let dates,title,nav=true;
  if(page=='week'){const s=addD(sow(today),off*7);dates=range(s,addD(s,6));title=fmtR(s)+' – '+fmtR(addD(s,6))}
  else if(page=='month'){const m=new Date(today.getFullYear(),today.getMonth()+off,1);dates=range(m,new Date(m.getFullYear(),m.getMonth()+1,0));title=m.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
  else{nav=false;dates=range(parse(st.term.start),parse(st.term.end));title='Term overview'}
  const S=stats(dates);
  let h=topbar()+seg()+(nav?`<div class="nav"><button data-a="pprev" aria-label="Previous">‹</button><b>${title}</b><button data-a="pnext" aria-label="Next">›</button></div>`:`<div class="nav"><b>${title}</b></div>`);
  h+=`<div class="kpis"><div class="kpi"><b>${S.avg==null?'–':pc(S.avg)+'%'}</b><small>Average</small></div><div class="kpi"><b style="color:var(--acc)">${grade(S.avg)}</b><small>Grade</small></div><div class="kpi"><b>${streak()}</b><small>Day streak</small></div><div class="kpi"><b>${S.best?SH[S.best.d.getDay()]:'–'}</b><small>Best day</small></div></div>`;
  h+=`<div class="card"><h3>${verdict(S.avg)}</h3><p>${S.good} of ${S.cnt} days above 70%</p></div><div class="cols">`;
  if(page=='week')h+=`<div class="card"><h3>Daily performance</h3>${chart(S.per.map(x=>({label:SH[x.d.getDay()],p:x.p,f:x.f})))}</div>`;
  else if(page=='month')h+=`<div class="card"><h3>Month at a glance</h3>${S.per.length?heat(S.per):''}</div><div class="card"><h3>Weekly average</h3>${chart(weeks(S.per,'W'))}</div>`;
  else h+=`<div class="card"><h3>Weekly trajectory</h3>${S.per.length?chart(weeks(S.per,''),1):'<div class="empty">Check the term dates in Settings.</div>'}<p>${fmtR(parse(st.term.start))} to ${fmtR(parse(st.term.end))}. Change dates in Settings.</p></div>`;
  h+=`</div><div class="card"><h3>Performance by category</h3>`;
  const ks=Object.keys(S.cats);
  if(!ks.length)h+=`<div class="empty">No days to evaluate in this period yet</div>`;
  ks.sort((a,b)=>S.cats[b].n/S.cats[b].t-S.cats[a].n/S.cats[a].t).forEach(c=>{const x=S.cats[c],p=x.n/x.t;h+=`<div class="cat"><span>${CAT[c]||c}</span><div class="trk"><i style="width:${pc(p)}%;background:${col(p)}"></i></div><small>${pc(p)}%</small></div>`});
  return h+'</div>';
}

const seg=()=>`<div class="seg">${[['week','Week'],['month','Month'],['term','Term']].map(t=>`<button data-pg="${t[0]}" class="${page==t[0]?'on':''}">${t[1]}</button>`).join('')}</div>`;
