const Store = {
  P: 'typeflow_',
  get(k, d = null) { try { const v = localStorage.getItem(this.P + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(this.P + k, JSON.stringify(v)); } catch {} },
  remove(k) { localStorage.removeItem(this.P + k); },
  clearAll() { Object.keys(localStorage).filter(k => k.startsWith(this.P)).forEach(k => localStorage.removeItem(k)); }
};

const Stats = {
  getSessions() { return Store.get('sessions', []); },
  addSession(s) {
    const a = this.getSessions(); a.push(s);
    if (a.length > 500) a.splice(0, a.length - 500);
    Store.set('sessions', a);
    this.updateStreak(); this.updateXP(s);
  },
  updateStreak() {
    const dates = [...new Set(this.getSessions().map(s => new Date(s.ts).toDateString()))];
    const d = new Date(); let streak = 0;
    for (let i = 0; i < 365; i++) {
      if (dates.includes(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    Store.set('streak', streak);
  },
  getStreak() { return Store.get('streak', 0); },
  updateXP(s) { Store.set('xp', Store.get('xp', 0) + Math.round(s.wpm * (s.accuracy / 100))); },
  getXP() { return Store.get('xp', 0); },
  getLevel() { return Math.floor(this.getXP() / 500) + 1; },
  getPersonalBests() {
    const ss = this.getSessions();
    if (!ss.length) return { wpm: 0, acc: 0, streak: this.getStreak() };
    return { wpm: Math.max(...ss.map(s => s.wpm)), acc: Math.max(...ss.map(s => s.accuracy)), streak: this.getStreak() };
  },
  getKeyErrors() {
    const m = {};
    this.getSessions().forEach(s => s.keyErrors && Object.entries(s.keyErrors).forEach(([k, v]) => m[k] = (m[k] || 0) + v));
    return m;
  },
  getBigrams() {
    const m = {};
    this.getSessions().forEach(s => s.bigrams && Object.entries(s.bigrams).forEach(([k, v]) => m[k] = (m[k] || 0) + v));
    return m;
  },
  getLessonProgress() { return Store.get('lessonProgress', {}); },
  markLessonComplete(id, wpm, acc) {
    const p = this.getLessonProgress();
    if (!p[id] || wpm > p[id].wpm) p[id] = { wpm, accuracy: acc };
    Store.set('lessonProgress', p);
  }
};

const Settings = {
  get(k, d) { return Store.get('set_' + k, d); },
  set(k, v) { Store.set('set_' + k, v); }
};