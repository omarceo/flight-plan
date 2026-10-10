/* bank.js: points account (balance, ledger), ranks and streak */
const Bank = (() => {
  'use strict';
  const RANKS = [[0, 'Cadet'], [250, 'Navigator'], [700, 'Pilot'], [1500, 'Flight Engineer'],
                 [3000, 'Mission Specialist'], [6000, 'Commander'], [12000, 'Astronaut']];
  const acct = () => st.bank;
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  function rank() {
    const earned = acct().earned;
    let i = 0;
    RANKS.forEach((r, k) => { if (earned >= r[0]) i = k; });
    const cur = RANKS[i], next = RANKS[i + 1];
    return {
      name: cur[1],
      next: next ? next[1] : null,
      pct: next ? (earned - cur[0]) / (next[0] - cur[0]) : 1,
      left: next ? next[0] - earned : 0,
    };
  }

  function record(amount, note, kind) {
    const a = acct();
    a.log.unshift({ id: 'l' + Date.now(), t: Date.now(), amt: amount, note, kind });
    a.log = a.log.slice(0, 300);
    save();
  }

  function deposit(amount, note, kind = 'focus') {
    acct().bal += amount;
    acct().earned += amount;
    record(amount, note, kind);
  }

  function withdraw(amount, note) {
    if (acct().bal < amount) return false;
    acct().bal -= amount;
    record(-amount, note, 'spend');
    return true;
  }

  const focusDays = () => new Set(acct().log.filter((l) => l.kind === 'focus').map((l) => key(new Date(l.t))));
  const todayCount = () => acct().log.filter((l) => l.kind === 'focus' && key(new Date(l.t)) === key(today)).length;

  /* Consecutive days with at least one verified-or-not focus deposit. */
  function streak() {
    const days = focusDays();
    let d = new Date(today), n = 0;
    if (!days.has(key(d))) d = addD(d, -1);
    while (days.has(key(d))) { n++; d = addD(d, -1); }
    return n;
  }

  function chip() {
    const r = rank();
    return `<button class="bank" data-pg="focus" aria-label="Balance ${fmt(acct().bal)} points, rank ${r.name}">
      <span class="coin"></span><span><small>Balance</small><b>${fmt(acct().bal)}</b></span><span class="rk">${r.name}</span></button>`;
  }

  return { RANKS, fmt, rank, deposit, withdraw, streak, todayCount, chip };
})();
