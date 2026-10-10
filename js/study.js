/* study.js: subjects, notes, questions with spaced review, and files (IndexedDB) */
const Study = (() => {
  'use strict';
  const INTERVALS = [0, 1, 3, 7, 14, 30];   // days until the next review, by Leitner box
  const REVIEW_POINTS = 2, REVIEW_DAILY_CAP = 10;

  let sel = null, tab = 'notes', rq = null, confirmDel = false, saveTimer = null;
  const urls = [];

  const cur = () => st.subjects.find((s) => s.id === sel);
  const dueOf = (s) => s.q.filter((q) => q.due <= key(today));
  const dueCount = () => st.subjects.reduce((n, s) => n + dueOf(s).length, 0);
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

  /* ---------- views ---------- */
  function view() {
    const c = cur();
    if (!c) return listView();
    const tabs = [['notes', 'Notes'], ['q', `Questions (${c.q.length})`], ['files', 'Files'], ['review', `Review (${dueOf(c).length})`]];
    return topbar() + `<div class="sec" style="margin-top:0"><h2>${esc(c.name)}</h2><button class="lnk" data-s="back">All subjects</button></div>
      <div class="seg">${tabs.map((t) => `<button data-s="tab" data-v="${t[0]}" class="${tab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div>
      ${tab === 'notes' ? notesView(c) : tab === 'q' ? questionsView(c) : tab === 'files' ? filesView() : reviewView(c)}
      <div style="margin-top:18px;text-align:center"><button class="lnk" data-s="delsub">${confirmDel ? 'Tap again to delete this subject and its files' : 'Delete this subject'}</button></div>`;
  }

  function listView() {
    const cards = st.subjects.map((s) => `<button class="card sbj" data-s="open" data-id="${s.id}"><span><b>${esc(s.name)}</b><small>${s.q.length} question${s.q.length === 1 ? '' : 's'}, ${dueOf(s).length} due, ${s.notes.trim() ? s.notes.trim().split(/\s+/).length : 0} words</small></span><span aria-hidden="true">›</span></button>`).join('');
    return topbar() + `<div class="sec" style="margin-top:0"><h2>Study</h2><button class="lnk" data-s="import">Import classes from my plan</button></div>
      ${cards || '<div class="card empty">Add a subject to start collecting notes, questions, and files for it.</div>'}
      <div class="add"><input type="text" id="s-new" placeholder="New subject, for example Orbital Mechanics" aria-label="New subject"><button data-s="addsub">Add</button></div>`;
  }

  function notesView(c) {
    return `<textarea id="s-notes" class="notes" placeholder="Write your notes here. They save automatically on this device." aria-label="Notes">${esc(c.notes)}</textarea>
      <div class="meta" id="s-meta">${wordsLabel(c.notes)}</div>`;
  }
  const wordsLabel = (t) => `${t.trim() ? t.trim().split(/\s+/).length : 0} words, saved`;

  function questionsView(c) {
    const list = c.q.map((q) => `<div class="pr"><span><b>${esc(q.q)}</b>${q.a ? `<small>${esc(q.a)}</small>` : ''}<small>Box ${q.box}, next review ${q.due}</small></span><button class="x" data-s="delq" data-id="${q.id}" aria-label="Delete question">×</button></div>`).join('');
    return `<div class="card fm"><h3>Add a question</h3><input id="s-q" type="text" placeholder="Question you want to remember" aria-label="Question"><input id="s-a" type="text" placeholder="Answer (optional)" aria-label="Answer"><button class="btn" data-s="addq">Add question</button></div>
      <div class="card">${list || '<div class="empty">No questions yet. Write the ones you could not answer, then review them here.</div>'}</div>`;
  }

  function filesView() {
    return `<label class="btn" for="s-file" style="display:block;text-align:center;cursor:pointer;margin-bottom:12px">Add files or photos</label><input id="s-file" class="vh" type="file" multiple>
      <div id="s-files" class="files"><div class="empty">Loading files...</div></div>
      <p class="meta">Files are stored privately in this browser. They are not included in the text backup.</p>`;
  }

  function reviewView(c) {
    if (!rq || rq.sid !== c.id) rq = { sid: c.id, ids: dueOf(c).map((q) => q.id), i: 0, show: false, n: 0 };
    if (!rq.ids.length) return '<div class="card rv"><h3>Nothing due</h3><p>Add questions in the Questions tab. Cards come back after 1, 3, 7, 14, and 30 days.</p></div>';
    if (rq.i >= rq.ids.length) return `<div class="card rv"><h3>Review complete</h3><p>You reviewed ${rq.n} card${rq.n === 1 ? '' : 's'}. See you when the next ones are due.</p></div>`;
    const q = c.q.find((x) => x.id === rq.ids[rq.i]);
    return `<div class="card rv"><p>${rq.i + 1} of ${rq.ids.length}</p><div class="qa">${esc(q.q)}</div>
      ${rq.show ? `<p class="ans">${q.a ? esc(q.a) : 'No saved answer. Say it out loud, then check your notes.'}</p>
        <div class="row"><button class="btn g" data-s="grade" data-v="0">Again</button><button class="btn" data-s="grade" data-v="1">Good</button><button class="btn g" data-s="grade" data-v="2">Easy</button></div>`
        : '<button class="btn" data-s="show" style="margin-top:16px">Show answer</button>'}</div>`;
  }

  /* ---------- async: files ---------- */
  async function refreshFiles() {
    const box = $('s-files'); if (!box || !sel) return;
    urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
    let files = [];
    try { files = await DB.list(sel); } catch (e) { box.innerHTML = '<div class="empty">File storage is not available in this browser.</div>'; return; }
    files.sort((a, b) => b.added - a.added);
    box.innerHTML = files.length ? files.map((f) => {
      let thumb = '';
      if (f.type.startsWith('image/')) { const u = URL.createObjectURL(f.blob); urls.push(u); thumb = `<img src="${u}" alt="${esc(f.name)}">`; }
      return `<div class="file">${thumb}<b>${esc(f.name)}</b><br><small>${kb(f.size)}</small><div class="row" style="margin-top:6px"><button class="chip" data-s="openf" data-id="${f.id}">Open</button><button class="chip" data-s="delf" data-id="${f.id}">Delete</button></div></div>`;
    }).join('') : '<div class="empty">No files yet. Add slides, PDFs, or photos of your notes.</div>';
  }

  async function addFiles(list) {
    for (const f of list) {
      try { await DB.put({ id: uid('f'), subj: sel, name: f.name, type: f.type || 'application/octet-stream', size: f.size, added: Date.now(), blob: f }); } catch (e) { /* quota */ }
    }
    refreshFiles();
  }

  /* ---------- logic ---------- */
  function grade(v) {
    const c = cur(), q = c.q.find((x) => x.id === rq.ids[rq.i]);
    q.box = v === 0 ? 0 : Math.min(5, q.box + (v === 1 ? 1 : 2));
    q.due = key(addD(today, INTERVALS[q.box]));
    if (v === 0) rq.ids.push(q.id);
    else { rq.n++; reward(); }
    rq.i++; rq.show = false; save();
  }
  function reward() {
    const r = st.bank.rv && st.bank.rv.d === key(today) ? st.bank.rv : (st.bank.rv = { d: key(today), n: 0 });
    if (r.n < REVIEW_DAILY_CAP) { r.n++; Bank.deposit(REVIEW_POINTS, 'Reviewed a question', 'review'); }
  }
  function addSubject(name) {
    name = name.trim();
    if (!name || st.subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) return null;
    const s = { id: uid('s'), name, notes: '', q: [] };
    st.subjects.push(s); save(); return s;
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const a = b.dataset.s, d = b.dataset, c = cur();
    if (a === 'open') { sel = d.id; tab = 'notes'; rq = null; confirmDel = false; }
    else if (a === 'back') { sel = null; rq = null; }
    else if (a === 'tab') { tab = d.v; rq = null; }
    else if (a === 'addsub') { const s = addSubject($('s-new').value); if (s) { sel = s.id; tab = 'notes'; } }
    else if (a === 'import') { (st.sched || []).filter((x) => x.c === 'class').forEach((x) => addSubject(x.t)); }
    else if (a === 'addq') { const q = $('s-q').value.trim(); if (q) { c.q.push({ id: uid('q'), q, a: $('s-a').value.trim(), box: 0, due: key(today) }); save(); } }
    else if (a === 'delq') { c.q = c.q.filter((x) => x.id !== d.id); save(); }
    else if (a === 'show') rq.show = true;
    else if (a === 'grade') grade(+d.v);
    else if (a === 'openf') { const w = window.open('', '_blank'); DB.get(d.id).then((r) => { const u = URL.createObjectURL(r.blob); if (w) w.location.href = u; else location.href = u; }); return; }
    else if (a === 'delf') { DB.del(d.id).then(refreshFiles); return; }
    else if (a === 'delsub') {
      if (!confirmDel) { confirmDel = true; }
      else { DB.list(c.id).then((fs) => fs.forEach((f) => DB.del(f.id))); st.subjects = st.subjects.filter((x) => x.id !== c.id); save(); sel = null; confirmDel = false; }
    } else return;
    render();
  });

  document.addEventListener('input', (e) => {
    if (e.target.id !== 's-notes' || !cur()) return;
    const c = cur(); c.notes = e.target.value;
    $('s-meta').textContent = 'Saving...';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { save(); const m = $('s-meta'); if (m) m.textContent = wordsLabel(c.notes); }, 500);
  });
  document.addEventListener('change', (e) => { if (e.target.id === 's-file') { addFiles([...e.target.files]); e.target.value = ''; } });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.id === 's-new') document.querySelector('[data-s=addsub]').click();
    if (e.target.id === 's-q' || e.target.id === 's-a') document.querySelector('[data-s=addq]').click();
  });
  document.addEventListener('rendered', () => { if (page === 'study' && tab === 'files') refreshFiles(); });

  return { view, dueCount };
})();
