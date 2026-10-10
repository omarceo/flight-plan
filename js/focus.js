/* focus.js: Pomodoro engine, focus-mode overlay and the Focus (bank) page.
   Integrity model: commitment plus friction, not proof. See README. */
const Focus = (() => {
  'use strict';
  const KEY = 'fp-session';
  const AWAY_LIMIT = 60000;   // total time away before a session is "unverified"
  const LEAVE_LIMIT = 3;      // times you may leave the tab
  const ASK_WINDOW = 30000;   // seconds to answer an attention check
  const MIN_OUTPUT = 15;      // characters needed for the output bonus
  const CIRC = 339.3;

  let S = null, phase = 'idle', asking = null, awayAt = 0, wake = null;
  let lastSave = 0, confirmEnd = false, last = null;
  const draft = { i: '', s: '' };

  const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
  const subjName = (id) => (st.subjects.find((s) => s.id === id) || {}).name || 'General';
  const persist = () => {
    try { S ? localStorage.setItem(KEY, JSON.stringify({ S, phase })) : localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  };

  /* ---------- device helpers ---------- */
  async function lockScreen() {
    try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { /* optional */ }
  }
  function unlockScreen() { try { if (wake) wake.release(); } catch (e) { /* optional */ } wake = null; }
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.65);
    } catch (e) { /* audio blocked */ }
  }

  /* ---------- session lifecycle ---------- */
  function start() {
    const intent = ($('f-intent').value || '').trim();
    if (intent.length < 5) { $('f-hint').textContent = 'Write what you will do first (at least 5 characters).'; $('f-intent').focus(); return; }
    const dur = st.fcfg.focus, now = Date.now();
    const checks = [];
    if (dur >= 20) [[0.2, 0.45], [0.55, 0.85]].forEach((r) => checks.push({ at: now + dur * 60000 * (r[0] + Math.random() * (r[1] - r[0])), res: null }));
    S = { type: 'focus', start: now, end: now + dur * 60000, dur, subj: $('f-subj').value, intent, away: 0, leaves: 0, seen: now, checks };
    phase = 'run'; draft.i = ''; persist(); lockScreen(); overlay();
  }

  function setAway(on) {
    if (!S || phase !== 'run') return;
    const now = Date.now();
    if (on && !awayAt) { awayAt = now; S.leaves++; }
    else if (!on && awayAt) { S.away += now - awayAt; awayAt = 0; persist(); }
  }

  function finish() { setAway(false); phase = 'done'; persist(); beep(); unlockScreen(); document.title = 'Flight Plan'; overlay(); }

  function assess(s) {
    const failed = s.checks.filter((c) => c.res !== 'ok').length;
    const reasons = [];
    if (s.away > AWAY_LIMIT) reasons.push(`away from the tab for ${Math.round(s.away / 1000)}s`);
    if (s.leaves > LEAVE_LIMIT) reasons.push(`left the tab ${s.leaves} times`);
    if (failed) reasons.push(`${failed} missed focus check${failed > 1 ? 's' : ''}`);
    return { verified: !reasons.length, reasons };
  }

  function calc(s, output) {
    const a = assess(s);
    const bonus = output.length >= MIN_OUTPUT ? Math.round(s.dur * 0.4) : 0;
    const sub = Math.round((s.dur + bonus) * (a.verified ? 1 : 0.5));
    const days = Bank.todayCount() ? Bank.streak() : Bank.streak() + 1;
    const rate = Math.min(days, 10) * 0.05;
    const interest = Math.round(sub * rate);
    return { ...a, base: s.dur, bonus, sub, rate, interest, total: sub + interest, days };
  }

  function settle(output) {
    const c = calc(S, output);
    Bank.deposit(c.total, `${S.dur}-minute session: ${S.intent.slice(0, 50)}`);
    const subject = st.subjects.find((x) => x.id === S.subj);
    if (subject && output) {
      const stamp = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      subject.notes += `${subject.notes ? '\n\n' : ''}[${stamp}, ${S.dur} min focus] ${output}`;
      save();
    }
    last = { c, dur: S.dur };
    S = null; phase = 'result'; persist(); overlay(); render();
  }

  function startBreak() {
    const dur = Bank.todayCount() % 4 === 0 ? 15 : 5, now = Date.now();
    S = { type: 'break', start: now, end: now + dur * 60000, dur, seen: now };
    phase = 'break'; persist(); overlay();
  }

  function leave() { S = null; last = null; phase = 'idle'; asking = null; persist(); unlockScreen(); document.title = 'Flight Plan'; overlay(); render(); }

  /* ---------- overlay ---------- */
  function overlay() {
    const o = $('fo');
    if (phase === 'idle') { o.hidden = true; o.innerHTML = ''; return; }
    o.hidden = false;
    o.innerHTML = phase === 'run' || phase === 'break' ? runHtml() : phase === 'done' ? doneHtml() : resultHtml();
    paint();
  }

  function runHtml() {
    const brk = phase === 'break';
    return `<div class="fo-in"><p class="fo-sub">${brk ? 'Break' : esc(subjName(S.subj))}</p>
      <h2 class="fo-intent">${brk ? 'Stand up, drink water, rest your eyes.' : esc(S.intent)}</h2>
      <div class="fo-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="#ffffff22" stroke-width="6"/>
        <circle id="fo-arc" cx="60" cy="60" r="54" fill="none" stroke="var(--hac)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${CIRC}"/></svg>
        <div class="fo-time" id="fo-t"></div></div>
      ${brk ? '' : '<div class="fo-meta" id="fo-meta"></div>'}
      <button class="btn g" data-f="${brk ? 'skipbreak' : 'end'}">${brk ? 'Skip break' : confirmEnd ? 'Tap again to forfeit this session' : 'End early'}</button>
      ${brk ? '' : '<p class="fo-note">Keep this tab open and in front. Leaving it is recorded and lowers your reward.</p>'}
      ${asking ? `<div class="fo-ask" role="alertdialog" aria-label="Focus check"><div><h3>Still focused?</h3><p>Tap within <b id="fo-ask-t">30</b> seconds.</p><button class="btn" data-f="here">I am here</button></div></div>` : ''}</div>`;
  }

  function doneHtml() {
    const a = assess(S);
    return `<div class="fo-in"><p class="fo-sub">${esc(subjName(S.subj))}</p><h2 class="fo-intent">Session complete</h2>
      <p class="fo-meta">${a.verified ? 'Integrity check passed.' : 'Integrity check flagged: ' + a.reasons.join(', ') + '. Rewards are halved.'}</p>
      <label class="fo-meta" for="f-out" style="display:block;text-align:left">What did you produce or learn? (${MIN_OUTPUT}+ characters earns the output bonus${S.subj ? ' and is saved to your notes' : ''})</label>
      <textarea id="f-out" placeholder="Solved 5 problems on Hohmann transfers; stuck on the plane change..."></textarea>
      <div style="display:grid;gap:8px;margin-top:12px"><button class="btn" data-f="claim">Claim points</button><button class="btn g" data-f="skip">Skip the bonus</button></div></div>`;
  }

  function resultHtml() {
    const c = last.c;
    const rows = [[`${c.base} minutes of focus`, c.base]];
    if (c.bonus) rows.push(['Output bonus', c.bonus]);
    if (!c.verified) rows.push(['Integrity penalty (half)', -(c.base + c.bonus - c.sub)]);
    if (c.interest) rows.push([`Streak interest ${Math.round(c.rate * 100)}% (${c.days} day${c.days > 1 ? 's' : ''})`, c.interest]);
    return `<div class="fo-in"><p class="fo-sub">Deposit made</p><h2 class="fo-intent">+${c.total} points</h2>
      <ul class="led" style="text-align:left">${rows.map((r) => `<li><span>${r[0]}</span><span class="${r[1] < 0 ? 'neg' : 'pos'}">${r[1] > 0 ? '+' : ''}${r[1]}</span></li>`).join('')}</ul>
      <p class="fo-meta">Balance: ${Bank.fmt(st.bank.bal)} points</p>
      <div style="display:grid;gap:8px;margin-top:12px"><button class="btn" data-f="brk">Take a break</button><button class="btn g" data-f="close">Back to the app</button></div></div>`;
  }

  function paint() {
    if (!S || (phase !== 'run' && phase !== 'break')) return;
    const now = Date.now(), left = S.end - now, total = S.end - S.start;
    const t = $('fo-t'); if (t) t.textContent = mmss(left);
    const arc = $('fo-arc'); if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - left / total));
    document.title = `${mmss(left)} ${phase === 'break' ? 'Break' : 'Focus'}`;
    const m = $('fo-meta');
    if (m) {
      const away = S.away + (awayAt ? now - awayAt : 0);
      const ok = away <= AWAY_LIMIT && S.leaves <= LEAVE_LIMIT && !S.checks.some((c) => c.res === 'fail');
      m.textContent = `${ok ? 'Integrity: on track' : 'Integrity: at risk'}. Away ${Math.round(away / 1000)}s of ${AWAY_LIMIT / 1000}s, left tab ${S.leaves} of ${LEAVE_LIMIT}.`;
    }
    const q = $('fo-ask-t'); if (q && asking) q.textContent = Math.max(0, Math.ceil((ASK_WINDOW - (now - asking.shown)) / 1000));
  }

  function tick() {
    if (!S || (phase !== 'run' && phase !== 'break')) return;
    const now = Date.now();
    S.seen = now;
    if (now - lastSave > 5000) { persist(); lastSave = now; }
    if (phase === 'run') {
      if (asking && now - asking.shown > ASK_WINDOW) { asking.res = 'fail'; asking = null; overlay(); }
      const due = S.checks.find((c) => c.res == null && now >= c.at);
      if (due && !asking) { asking = due; due.shown = now; beep(); overlay(); }
    }
    if (now >= S.end) {
      if (phase === 'run') { asking = null; finish(); } else { beep(); leave(); }
      return;
    }
    paint();
  }

  function restore() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { return; }
    if (!saved || !saved.S) return;
    S = saved.S; phase = saved.phase;
    const now = Date.now(), gap = now - (S.seen || now);
    if (phase === 'run' && gap > 5000) { S.away += gap; S.leaves++; }
    if (phase === 'run' && now >= S.end) phase = 'done';
    if (phase === 'break' && now >= S.end) { S = null; phase = 'idle'; persist(); return; }
    if (phase === 'run') lockScreen();
    overlay();
  }

  /* ---------- pages ---------- */
  function homeCard() {
    const n = Bank.todayCount(), goal = st.bank.goal, due = Study.dueCount();
    return `<div class="card fc"><div><h3>Focus today: ${n} of ${goal} sessions</h3><p>${due ? due + ' review question' + (due > 1 ? 's are' : ' is') + ' due.' : 'Nothing is due for review.'}</p></div>
      <div class="fcb"><button class="btn" data-pg="focus">Focus</button><button class="btn g" data-pg="study">Study</button></div></div>`;
  }

  function view() {
    const a = st.bank, r = Bank.rank(), streak = Bank.streak(), n = Bank.todayCount();
    const rate = Math.min(n ? streak : streak + 1, 10) * 5;
    const earnedToday = a.log.filter((l) => l.amt > 0 && key(new Date(l.t)) === key(today)).reduce((s, l) => s + l.amt, 0);
    const dots = Array.from({ length: a.goal }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    const subjects = st.subjects.map((s) => `<option value="${s.id}" ${draft.s === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
    const stmt = a.log.slice(0, 10).map((l) => `<li><span>${esc(l.note)}<small>${new Date(l.t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span><span class="${l.amt < 0 ? 'neg' : 'pos'}">${l.amt > 0 ? '+' : ''}${l.amt}</span></li>`).join('');
    const rewards = st.rewards.map((w) => `<div class="pr"><span>${esc(w.name)}<small>${w.cost} points</small></span><button class="chip" data-f="redeem" data-id="${w.id}" ${a.bal < w.cost ? 'disabled' : ''}>Redeem</button><button class="x" data-f="rdel" data-id="${w.id}" aria-label="Remove reward">×</button></div>`).join('');
    return topbar() + `<div class="sec" style="margin-top:0"><h2>Focus</h2></div><div class="cols"><div>
      <div class="acct"><small>Available balance</small><div class="bal">${Bank.fmt(a.bal)} <span style="font-size:16px">points</span></div>
        <div class="row2"><div><small>Rank</small><br><b>${r.name}</b></div><div><small>Earned today</small><br><b>${earnedToday}</b></div><div><small>Streak interest</small><br><b>${rate}%</b></div></div>
        <div class="pbar" style="max-width:none;margin-top:14px"><i style="width:${Math.round(r.pct * 100)}%"></i></div>
        <small>${r.next ? Bank.fmt(r.left) + ' points to ' + r.next : 'Highest rank reached'}</small></div>
      <div class="card fm" style="margin-top:12px"><h3>Start a focus session</h3>
        ${S ? '<button class="btn" data-f="resume">Resume your session</button>' : `
        <div><label class="l" for="f-subj">Subject</label><select id="f-subj"><option value="">General</option>${subjects}</select></div>
        <div><label class="l" for="f-intent">What exactly will you do?</label><input id="f-intent" type="text" maxlength="120" placeholder="Solve 5 orbital mechanics problems" value="${esc(draft.i)}"><p id="f-hint" style="margin:4px 0 0"></p></div>
        <div><span class="l">Length</span><div class="dsel">${[15, 25, 50].map((m) => `<button data-f="dur" data-v="${m}" class="${st.fcfg.focus === m ? 'on' : ''}">${m} min</button>`).join('')}</div></div>
        <button class="btn" data-f="start">Start focus</button>`}
        <div class="row" style="align-items:center;justify-content:space-between"><span class="l" style="margin:0">Daily goal: ${n} of ${a.goal}</span><span class="dots">${dots}</span>
          <span><button class="chip" data-f="goal" data-v="-1" aria-label="Lower goal">−</button> <button class="chip" data-f="goal" data-v="1" aria-label="Raise goal">+</button></span></div></div></div>
    <div><div class="card"><h3>Account statement</h3>${stmt ? `<ul class="led">${stmt}</ul>` : '<div class="empty">No deposits yet. Your first session earns your first points.</div>'}</div>
      <div class="card"><h3>Rewards</h3>${rewards}<div class="add"><input type="text" id="r-n" placeholder="New reward" aria-label="Reward name"><input type="number" id="r-c" min="10" step="10" placeholder="Cost" style="width:90px" aria-label="Cost in points"><button data-f="radd">Add</button></div></div>
      <div class="card"><h3>How focus is verified</h3><p>Nothing in a browser can prove you studied, so this system adds commitment and friction instead.</p>
        <p>You state your intent first. Leaving the tab is timed. Random focus checks ask you to tap. A short written output unlocks the bonus. Sessions that fail these checks pay half.</p></div></div></div>`;
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    const a = b.dataset.f, d = b.dataset;
    if (a === 'start') start();
    else if (a === 'resume') overlay();
    else if (a === 'dur') { st.fcfg.focus = +d.v; save(); render(); }
    else if (a === 'goal') { st.bank.goal = Math.min(12, Math.max(1, st.bank.goal + +d.v)); save(); render(); }
    else if (a === 'end') { if (!confirmEnd) { confirmEnd = true; overlay(); } else { confirmEnd = false; leave(); } }
    else if (a === 'here') { if (asking) { asking.res = 'ok'; asking = null; overlay(); } }
    else if (a === 'claim') settle(($('f-out').value || '').trim());
    else if (a === 'skip') settle('');
    else if (a === 'brk') startBreak();
    else if (a === 'close' || a === 'skipbreak') leave();
    else if (a === 'redeem') { const w = st.rewards.find((x) => x.id === d.id); if (w && Bank.withdraw(w.cost, 'Reward: ' + w.name)) render(); }
    else if (a === 'rdel') { st.rewards = st.rewards.filter((x) => x.id !== d.id); save(); render(); }
    else if (a === 'radd') { const n = $('r-n').value.trim(), c = +$('r-c').value; if (n && c > 0) { st.rewards.push({ id: 'r' + Date.now(), name: n, cost: Math.round(c) }); save(); render(); } }
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'f-intent') draft.i = e.target.value; });
  document.addEventListener('change', (e) => { if (e.target.id === 'f-subj') draft.s = e.target.value; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'f-intent') start(); });
  document.addEventListener('visibilitychange', () => { setAway(document.hidden); if (!document.hidden && phase === 'run') lockScreen(); });
  window.addEventListener('blur', () => setAway(true));
  window.addEventListener('focus', () => setAway(false));
  window.addEventListener('beforeunload', (e) => { if (S && phase === 'run') { persist(); e.preventDefault(); e.returnValue = ''; } });
  setInterval(tick, 250);
  document.addEventListener('DOMContentLoaded', restore);
  if (document.readyState !== 'loading') restore();

  return { view, homeCard };
})();
