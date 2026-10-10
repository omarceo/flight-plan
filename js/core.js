/* core.js: constants, helpers, persisted state, theme */
const DN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SH=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CAT={class:'Classes',study:'Study',skill:'Skills',work:'Work',faith:'Faith',health:'Health',rest:'Rest',project:'Projects',other:'Extra tasks'};
const KINDS=['Lecture','Lab','Tutorial','Section','Exam'];
const IDEAS=[['Delta-v calculator with the rocket equation','Position from pseudoranges by least squares','NDVI from a satellite image with numpy','Two-body orbit simulation with matplotlib'],['ls, cd, mkdir, cp, mv','chmod, pipes, grep','CSV processing with awk, sed, cut','A Bash backup script, then cron']];
const IC={home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',plan:'M4 6h16M4 12h16M4 18h10',week:'M4 20V11M10 20V4M16 20v-6M22 20H2',month:'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',term:'M3 18l6-7 4 4 8-10',focus:'M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 1h4',study:'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 1 2-2h13'};
const TABS=[['home','Today'],['plan','Plan'],['focus','Focus'],['study','Study'],['week','Insights']];
const SUN='M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4';
const MOON='M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z';
const GEAR='M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4';

const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=k=>{const a=k.split('-').map(Number);return new Date(a[0],a[1]-1,a[2])};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtR=d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const range=(a,b)=>{const r=[];for(let d=new Date(a);d<=b;d=addD(d,1))r.push(d);return r};
const pc=p=>Math.round(p*100);
const col=p=>p>=.7?'var(--good)':p>=.4?'var(--mid)':'var(--low)';
const $=id=>document.getElementById(id);
const dayStart=()=>{const d=new Date();d.setHours(0,0,0,0);return d};

const fresh=()=>({name:'',year:'',sched:null,days:{},term:{start:'2026-10-04',end:'2027-01-28'},projects:[],ws:0,h12:false,theme:'auto',bank:{bal:0,earned:0,log:[],goal:4},subjects:[],rewards:[{id:'r1',name:'30 minutes of a show',cost:60},{id:'r2',name:'A treat of your choice',cost:120}],fcfg:{focus:25}});
let st=fresh();
try{const r=localStorage.getItem('plan-v1');if(r)st=Object.assign(st,JSON.parse(r))}catch(e){}
const save=()=>{try{localStorage.setItem('plan-v1',JSON.stringify(st))}catch(e){}};
const applyTheme=()=>{const r=document.documentElement;if(st.theme=='light'||st.theme=='dark')r.setAttribute('data-theme',st.theme);else r.removeAttribute('data-theme')};
const isDark=()=>st.theme=='dark'||(st.theme!='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
applyTheme();
function example(){
  const A=[0,1,2,3,4,5,6];
  const E=[['fajr','Fajr prayer','faith',A,'04:45'],['outlier','Outlier, 2 hours','work',A,'05:15','07:15'],['study','Study the same-day courses','study',[0,1,2,3],'17:00','19:00'],['tech','Explore the field, 1 hour','skill',[0,1,2,3,4],'20:30','21:30'],['work','Work','work',[4],'10:00'],['catch','Catch up on backlog','study',[4],'17:00'],['out','Go out and rest','rest',[5],'16:00'],['review','Weekly review and planning','study',[5],'21:00'],['proj','Project in my field, 3 to 4 hours','project',[6],'11:00','15:00']];
  const R=E.map(a=>({id:a[0],t:a[1],c:a[2],days:a[3],h:a[4],e:a[5]||'',s:'',k:''}));
  for(let i=0;i<4;i++)R.push({id:'py'+i,t:'Python task',c:'skill',days:[i],h:'19:00',e:'19:45',s:IDEAS[0][i],k:''},{id:'sh'+i,t:'Bash task',c:'skill',days:[i],h:'19:45',e:'20:30',s:IDEAS[1][i],k:''});
  return R;
}
if(!st.sched&&Object.keys(st.days).length){st.sched=example()}
let today=dayStart(),cur=new Date(today),page=st.sched?'home':'welcome',off=0,pd=today.getDay(),ed=null,cf='';
const sow=d=>addD(d,-((d.getDay()-st.ws+7)%7));
const order=()=>[0,1,2,3,4,5,6].map(i=>(st.ws+i)%7);
const ft=h=>{if(!h)return'';if(!st.h12)return h;const a=h.split(':').map(Number);return ((a[0]+11)%12+1)+':'+pad(a[1])+(a[0]<12?' AM':' PM')};
const dd=k=>{const d=st.days[k]=st.days[k]||{};d.done=d.done||{};d.custom=d.custom||[];d.hidden=d.hidden||[];return d};
const byTime=L=>L.map((t,i)=>[t,i]).sort((a,b)=>{const x=a[0].h||'99:99',y=b[0].h||'99:99';return x>y?1:x<y?-1:a[1]-b[1]}).map(x=>x[0]);

