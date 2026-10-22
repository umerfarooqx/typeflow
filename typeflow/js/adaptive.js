const Adaptive = {
  // Get weakest keys (returns array like [';','q','z'])
  getWeakKeys(count = 5) {
    const errs = Stats.getKeyErrors();
    const sorted = Object.entries(errs).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, count).map(([k]) => k);
  },

  getWeakBigrams(count = 5) {
    const bg = Stats.getBigrams();
    return Object.entries(bg).sort((a, b) => b[1] - a[1]).slice(0, count).map(([k]) => k);
  },

  // Generate drill text targeting weak keys
  async generateWeakKeyDrill(length = 40) {
    const weak = this.getWeakKeys(5);
    if (!weak.length) {
      // No data yet — use home row
      const hr = await Content.getPack('homeRow');
      return this.shuffle(Array.isArray(hr) ? hr : []).slice(0, 15).join(' ');
    }
    const words = await Content.getWordPool();
    // Score words by how many weak keys they contain
    const scored = words.map(w => {
      let s = 0;
      for (const k of weak) if (w.includes(k)) s++;
      return { w, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    const pool = scored.length ? scored.map(x => x.w) : words;
    const out = [];
    while (out.join(' ').length < length * 3) {
      out.push(pool[Math.floor(Math.random() * Math.min(20, pool.length))]);
    }
    return out.join(' ');
  },

  // Generate drill targeting weak bigrams
  async generateBigramDrill(count = 20) {
    const weak = this.getWeakBigrams(3);
    if (!weak.length) return this.generateWeakKeyDrill();
    const words = await Content.getWordPool();
    const pool = words.filter(w => weak.some(b => w.includes(b)));
    const result = pool.length ? pool : words;
    return this.shuffle([...result]).slice(0, count).join(' ');
  },

  // Adaptive word weighting: bias word selection toward weak keys
  async getAdaptiveWords(n = 25) {
    if (!Settings.get('adaptive', true)) {
      const w = await Content.getWordPool();
      return this.shuffle([...w]).slice(0, n);
    }
    const weak = this.getWeakKeys(5);
    const words = await Content.getWordPool();
    if (!weak.length) return this.shuffle([...words]).slice(0, n);
    // Weight = 1 + 2 * (# of weak keys in word)
    const weighted = [];
    for (const w of words) {
      let score = 1;
      for (const k of weak) if (w.includes(k)) score += 2;
      for (let i = 0; i < score; i++) weighted.push(w);
    }
    const picked = [];
    while (picked.length < n) {
      picked.push(weighted[Math.floor(Math.random() * weighted.length)]);
    }
    return picked;
  },

  // Progressive difficulty: sort words by length
  progressiveSort(words) {
    return words.sort((a, b) => a.length - b.length);
  },

  // Spaced repetition: track poorly-performed texts
  saveMiss(text, accuracy) {
    if (!Settings.get('spacedRep', true)) return;
    const missed = Store.get('missed', []);
    if (accuracy < 90) {
      missed.push({ text, accuracy, ts: Date.now() });
      if (missed.length > 100) missed.splice(0, missed.length - 100);
      Store.set('missed', missed);
    }
  },

  getNextReview() {
    const missed = Store.get('missed', []);
    if (!missed.length) return null;
    // Simple: pick oldest unretried
    return missed[0];
  },

  // Recommend next lesson
  recommendLesson() {
    const progress = Stats.getLessonProgress();
    const lessons = CONTENT.lessons;
    for (const l of lessons) {
      if (!progress[l.id]) return l;
    }
    // All done — recommend weak-key drill
    return { id: 'drill', title: 'Weak-key drill', desc: 'Practice your problem keys', isDrill: true };
  },

  // Smart suggestions after a session
  getSuggestion(result) {
    if (result.accuracy < 92) {
      const weak = this.getWeakKeys(2);
      if (weak.length) {
        return `You struggled with "${weak.join('" and "')}" — practice them?`;
      }
      return 'Try slowing down to improve accuracy.';
    }
    if (result.wpm > 60) return '🔥 Great speed! Try a harder mode.';
    const weak = this.getWeakKeys(2);
    if (weak.length) return `Weak keys: "${weak.join('", "')}" — drill them?`;
    return 'Keep it up!';
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};