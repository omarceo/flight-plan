/* app.js: render loop, event handling, live clock */
function render(){
  $('app').innerHTML=page=='welcome'?welcome():page=='home'?home():page=='focus'?Focus.view():page=='study'?Study.view():page=='plan'?plan():page=='set'?settings():evalPage();
  $('nav').style.display=page=='welcome'?'none':'';
  $('nav').innerHTML='<div class="brand">Flight Plan</div>'+TABS.map(t=>`<button data-pg="${t[0]}" class="${(page==t[0]||(t[0]=='week'&&/^(month|term)$/.test(page)))?'on':''}">${icon(IC[t[0]])}${t[1]}</button>`).join('');
  document.dispatchEvent(new Event('rendered'));
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const D=b.dataset;
  if(D.pg){page=D.pg;off=0;cf='';ed=null;render();window.scrollTo(0,0);return}
  if(D.pd!=null){pd=+D.pd;ed=null;render();return}
  const o=dd(key(cur));
  if(D.del){const c=o.custom.findIndex(x=>x.id==D.del);if(c>=0)o.custom.splice(c,1);else o.hidden.push(D.del);save()}
  else if(D.ed){ed=D.ed;render();$('form').scrollIntoView({behavior:'smooth'});return}
  else if(D.sd){st.sched=st.sched.filter(x=>x.id!=D.sd);if(ed==D.sd)ed=null;save()}
  else if(D.pc){const p=st.projects.find(x=>x.id==D.pc);p.s=(p.s+1)%3;save()}
  else if(D.pd2){st.projects=st.projects.filter(x=>x.id!=D.pd2);save()}
  else{const a=D.a;if(!a)return;
    if(a=='theme'){st.theme=isDark()?'light':'dark';applyTheme();save()}
    else if(a=='prevd')cur=addD(cur,-1);else if(a=='nextd')cur=addD(cur,1);else if(a=='today')cur=new Date(today);
    else if(a=='pprev')off--;else if(a=='pnext')off++;
    else if(a=='restore'){o.hidden=[];save()}
    else if(a=='add'){const v=$('newt').value.trim();if(v){o.custom.push({id:'c'+Date.now(),text:v,time:$('newh').value});save()}}
    else if(a=='padd'){const v=$('newp').value.trim();if(v){st.projects.push({id:'p'+Date.now(),name:v,s:0});save()}}
    else if(a=='start0'||a=='startex'){st.name=$('wn').value.trim();st.year=$('wy').value.trim();st.sched=a=='startex'?example():[];if(a=='startex'&&!st.projects.length)st.projects=['Satellite orbit simulator','GNSS/INS simulator with a Kalman filter','Mission delta-v planner'].map((n,i)=>({id:'p'+i,name:n,s:0}));page=a=='startex'?'home':'plan';save()}
    else if(a=='sadd'){const t=$('f_t').value.trim(),dys=[...document.querySelectorAll('.fd:checked')].map(x=>+x.value);
      if(!t||!dys.length){$('f_t').focus();return}
      const it={id:ed||'s'+Date.now(),t,c:$('f_c').value,k:$('f_k').value,days:dys,h:$('f_h').value,e:$('f_e').value,s:$('f_s').value.trim()};
      if(ed)st.sched=st.sched.map(x=>x.id==ed?it:x);else st.sched.push(it);ed=null;save()}
    else if(a=='cancel')ed=null;
    else if(a=='ex'){if(cf!='ex'||!st.sched){cf='ex';render();return}st.sched=example();cf='';save()}
    else if(a=='reset'){if(cf!='reset'){cf='reset';render();return}try{localStorage.removeItem('plan-v1')}catch(er){}st=fresh();applyTheme();page='welcome';cf=''}
    else if(a=='bexp'){$('bk').value=JSON.stringify(st);return}
    else if(a=='bimp'){try{const x=JSON.parse($('bk').value);if(x&&x.days){st=Object.assign(fresh(),x);if(!st.sched)st.sched=[];applyTheme();save()}}catch(er){$('bk').value='Invalid text';return}}
  }
  render();
});
document.addEventListener('change',e=>{
  const t=e.target,m={sn:'name',sy:'year'};
  if(t.dataset.id){dd(key(cur)).done[t.dataset.id]=t.checked;save();render()}
  else if(m[t.id]){st[m[t.id]]=t.value.trim();save();render()}
  else if(t.id=='ts'||t.id=='te'){if(t.value){st.term[t.id=='ts'?'start':'end']=t.value;save();render()}}
  else if(t.id=='sw'){st.ws=+t.value;save();render()}
  else if(t.id=='sth'){st.theme=t.value;applyTheme();save();render()}
  else if(t.id=='s12'){st.h12=t.checked;save();render()}
});
document.addEventListener('keydown',e=>{if(e.key=='Enter'&&(e.target.id=='newt'||e.target.id=='newp'))e.target.parentNode.querySelector('button').click()});
let lastMin='';
function tick(){
  const n=new Date(),t0=dayStart();
  if(key(t0)!=key(today)){const f=key(cur)==key(today);today=t0;if(f)cur=new Date(today);render()}
  const c=$('clk');if(c)c.innerHTML=clock(n);
  const m=pad(n.getHours())+pad(n.getMinutes());
  if(m!=lastMin){lastMin=m;const a=document.activeElement;if(page=='home'&&!(a&&(a.tagName=='INPUT'||a.tagName=='SELECT')))render()}
}
setInterval(tick,1000);document.addEventListener('visibilitychange',tick);
render();
