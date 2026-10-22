const CONTENT = {
  lessons: [
    { id: 'home-row', title: '1. Home Row', desc: 'asdf jkl;', level: 1, pack: 'homeRow' },
    { id: 'top-row', title: '2. Top Row', desc: 'qwerty uiop', level: 2, pack: 'topRow' },
    { id: 'bottom-row', title: '3. Bottom Row', desc: 'zxcv bnm,', level: 3, pack: 'bottomRow' },
    { id: 'all-letters', title: '4. All Letters', desc: 'Full alphabet', level: 3, pack: 'words1000' },
    { id: 'numbers', title: '5. Numbers', desc: '1-0', level: 4, pack: 'numbers' },
    { id: 'symbols', title: '6. Symbols', desc: '!@#$%', level: 4, pack: 'symbols' },
    { id: 'capitals', title: '7. Capitals', desc: 'Shift discipline', level: 5, pack: 'capitals' },
    { id: 'bigrams', title: '8. Common Bigrams', desc: 'th he in er', level: 5, pack: 'bigrams' },
    { id: 'trigrams', title: '9. Common Trigrams', desc: 'the and ing', level: 5, pack: 'trigrams' },
    { id: 'pangrams', title: '10. Pangrams', desc: 'Every letter', level: 6, pack: 'pangrams' },
    { id: 'phrases', title: '11. Phrases', desc: 'Real flow', level: 6, pack: 'phrases' },
    { id: 'paragraphs', title: '12. Paragraphs', desc: 'Endurance', level: 6, pack: 'literature' }
  ]
};

const App = {
  engine: null, currentMode: 'time', currentSub: 30,
  currentText: '', charEls: [], _timeLimit: null, _tabPressed: false,

  async init() {
    ThemeManager.init();
    Keyboard.build(document.getElementById('virtualKeyboard'));
    this.bindNav(); this.bindPractice(); this.bindSettings(); this.bindLeaderboard();
    this.bindTexts(); this.applyAllSettings();
    this.renderStreak();
    ThemeManager.buildSwatches(document.getElementById('themeGrid'));
    await this.loadMode('time');
    document.getElementById('learnRecommend').textContent = 'Smart recommendation ready.';
  },

  bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + btn.dataset.view).classList.add('active');
        const v = btn.dataset.view;
        if (v === 'stats') this.renderStats();
        if (v === 'learn') this.renderLessons();
        if (v === 'leaderboard') this.renderLeaderboard('alltime');
        if (v === 'texts') this.renderTexts();
      });
    });
  },

  bindPractice() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadMode(btn.dataset.mode);
      });
    });
    document.addEventListener('keydown', e => this.onKeyDown(e));
    document.getElementById('resRestart').addEventListener('click', () => {
      document.getElementById('resultModal').classList.add('hidden');
      this.startSession();
    });
    document.getElementById('resClose').addEventListener('click', () => {
      document.getElementById('resultModal').classList.add('hidden');
    });
  },

  async loadMode(mode) {
    this.currentMode = mode;
    const subBar = document.getElementById('subBar');
    subBar.innerHTML = '';

    if (mode === 'time') {
      [15, 30, 60, 120].forEach(s => this.addSubBtn(subBar, s + 's', s, () => this.startSession()));
      if (![15, 30, 60, 120].includes(this.currentSub)) this.currentSub = 30;
    } else if (mode === 'words') {
      [10, 25, 50, 100].forEach(n => this.addSubBtn(subBar, n + ' words', n, () => this.startSession()));
      if (![10, 25, 50, 100].includes(this.currentSub)) this.currentSub = 25;
    } else if (mode === 'quote') {
      ['short', 'medium', 'long'].forEach(q => this.addSubBtn(subBar, q, q, () => this.startSession()));
    } else if (mode === 'drill') {
      this.addSubBtn(subBar, '🎯 weak keys', 'weak', async () => {
        this.currentText = await Adaptive.generateWeakKeyDrill();
        this.startSession(true);
      }, true);
      this.addSubBtn(subBar, '🎯 weak bigrams', 'bigram', async () => {
        this.currentText = await Adaptive.generateBigramDrill();
        this.startSession(true);
      });
    } else if (mode === 'custom') {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.placeholder = 'Type or paste text, press Enter...';
      inp.style.cssText = 'flex:1;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-card);color:var(--fg);min-width:200px;';
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && inp.value.trim()) {
          this.currentText = inp.value.trim();
          this.startSession(true);
        }
      });
      subBar.appendChild(inp);
    }
    await this.startSession();
  },

  addSubBtn(container, label, val, onClick, active = false) {
    const b = document.createElement('button');
    b.className = 'sub-btn' + (active ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      container.querySelectorAll('.sub-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      this.currentSub = val;
      onClick();
    });
    container.appendChild(b);
  },

  async buildTextForMode() {
    if (this.currentMode === 'time') {
      return (await Adaptive.getAdaptiveWords(80)).join(' ');
    }
    if (this.currentMode === 'words') {
      return (await Adaptive.getAdaptiveWords(this.currentSub)).join(' ');
    }
    if (this.currentMode === 'quote') return await Content.getQuote();
    if (this.currentMode === 'code') return await Content.getCodeSnippet();
    if (this.currentMode === 'numbers') return await Content.getNumbers();
    if (this.currentMode === 'symbols') return await Content.getSymbols();
    if (this.currentMode === 'zen') {
      return this.shuffle((await Content.getWordPool()).slice()).slice(0, 60).join(' ');
    }
    return this.currentText || 'Type something here.';
  },

  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

  async startSession(keepText = false) {
    if (!keepText) this.currentText = await this.buildTextForMode();
    this.renderText(this.currentText);
    this.engine = new TypingEngine({
      text: this.currentText, mode: this.currentMode,
      onTick: (e) => this.onTick(e),
      onFinish: (r) => this.onFinish(r)
    });
    document.getElementById('keyboardWrap').style.display =
      (Settings.get('keyboard', true) && !Settings.get('blind', false)) ? '' : 'none';
    document.getElementById('liveWpm').textContent = '0';
    document.getElementById('liveAcc').textContent = '100';
    document.getElementById('liveTime').textContent = this.currentMode === 'time' ? this.currentSub : '0';
    document.getElementById('liveProgress').textContent = `0/${this.currentText.length}`;
    this._timeLimit = this.currentMode === 'time' ? this.currentSub * 1000 : null;
    document.getElementById('typingPanel').focus();
    this.updateCaret();
    Keyboard.highlightNext(this.currentText[0]);
  },

  renderText(text) {
    const c = document.getElementById('typingText');
    c.innerHTML = ''; this.charEls = [];
    for (let i = 0; i < text.length; i++) {
      const sp = document.createElement('span');
      sp.className = 'untyped';
      sp.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      c.appendChild(sp); this.charEls.push(sp);
    }
  },

  updateCaret() {
    const pos = this.engine ? this.engine.pos : 0;
    this.charEls.forEach((el, i) => {
      el.classList.remove('current');
      if (i < pos) {
        el.classList.remove('untyped');
        if (!el.classList.contains('correct') && !el.classList.contains('incorrect')) el.classList.add('correct');
      } else if (i === pos) el.classList.add('current');
    });
  },

  onKeyDown(e) {
    if (!document.getElementById('view-practice').classList.contains('active') || !this.engine) return;
    if (e.key === 'Tab') { e.preventDefault(); this._tabPressed = true; return; }
    if (e.key === 'Enter' && this._tabPressed) { e.preventDefault(); this._tabPressed = false; this.startSession(); return; }
    this._tabPressed = false;
    if (e.key === 'Escape') { if (this.engine) this.engine.pause(); return; }
    if (e.key === 'Backspace') {
      e.preventDefault(); if (this.engine.finished) return;
      const prev = this.engine.pos - 1;
      if (prev >= 0) {
        this.engine.pos = prev;
        const el = this.charEls[prev];
        el.classList.remove('correct', 'incorrect'); el.classList.add('untyped');
        this.updateCaret();
        Keyboard.highlightNext(this.currentText[this.engine.pos]);
      }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1) return;
    e.preventDefault();
    if (this.engine.finished) return;
    const expected = this.currentText[this.engine.pos];
    const r = this.engine.handleInput(e.key);
    Keyboard.press(e.key, Settings.get('ripple', true));
    const el = this.charEls[this.engine.pos - 1];
    if (el) {
      el.classList.remove('untyped', 'correct', 'incorrect', 'current');
      el.classList.add(r.correct ? 'correct' : 'incorrect');
    }
    if (!r.correct) {
      Keyboard.flashError(expected);
      if (Settings.get('shake', true)) {
        const panel = document.getElementById('typingPanel');
        panel.classList.add('shake');
        setTimeout(() => panel.classList.remove('shake'), 200);
      }
    }
    this.updateCaret();
    Keyboard.highlightNext(this.currentText[this.engine.pos]);
    document.getElementById('liveProgress').textContent = `${this.engine.pos}/${this.currentText.length}`;
    document.getElementById('liveAcc').textContent = StatsUtil.computeAccuracy(this.engine.correctChars, this.engine.keystrokes);
    if (Settings.get('stopOnErr', false) && !r.correct) this.engine.pause();
  },

  onTick(elapsed) {
    if (this.currentMode === 'time' && this._timeLimit) {
      const remain = Math.max(0, (this._timeLimit - elapsed) / 1000);
      document.getElementById('liveTime').textContent = Math.ceil(remain);
      if (remain <= 0 && this.engine && !this.engine.finished) this.engine.finish();
    } else {
      document.getElementById('liveTime').textContent = (elapsed / 1000).toFixed(1) + 's';
    }
    document.getElementById('liveWpm').textContent = StatsUtil.computeWPM(this.engine.correctChars, elapsed);
  },

  onFinish(r) {
    const session = {
      ts: Date.now(), mode: this.currentMode,
      wpm: r.wpm, raw: r.raw, accuracy: r.accuracy, consistency: r.consistency,
      errors: r.errors, duration: Math.round(r.duration),
      keyErrors: r.keyErrors, bigrams: r.bigrams
    };
    const oldBest = Stats.getPersonalBests().wpm;
    Stats.addSession(session);
    Adaptive.saveMiss(this.currentText, r.accuracy);

    document.getElementById('resWpm').textContent = r.wpm;
    document.getElementById('resRaw').textContent = r.raw;
    document.getElementById('resAcc').textContent = r.accuracy + '%';
    document.getElementById('resCons').textContent = r.consistency + '%';
    document.getElementById('resErr').textContent = r.errors;
    document.getElementById('resTime').textContent = Math.round(r.duration / 1000) + 's';
    Charts.lineChart(document.getElementById('resultChart'), [{ data: r.samples, color: '#ffd166' }]);

    const sugg = document.getElementById('smartSuggest');
    if (Settings.get('smartSuggest', true)) {
      sugg.classList.remove('hidden');
      sugg.innerHTML = `💡 ${Adaptive.getSuggestion(r)} <button class="btn" id="suggDrill">Try drill</button>`;
      document.getElementById('suggDrill').onclick = async () => {
        document.getElementById('resultModal').classList.add('hidden');
        this.currentMode = 'drill';
        this.currentText = await Adaptive.generateWeakKeyDrill();
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.mode-btn[data-mode="drill"]').classList.add('active');
        await this.startSession(true);
      };
    } else sugg.classList.add('hidden');

    document.getElementById('resultModal').classList.remove('hidden');
    if (r.wpm > oldBest && Settings.get('confetti', true)) this.confetti();
    this.renderStreak();
  },

  confetti() {
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-10px;width:8px;height:8px;background:hsl(${Math.random()*360},80%,60%);z-index:300;pointer-events:none;border-radius:2px;transition:transform 1.5s,opacity 1.5s;`;
      document.body.appendChild(el);
      setTimeout(() => { el.style.transform = `translateY(100vh) rotate(${Math.random()*720}deg)`; el.style.opacity = '0'; }, 20);
      setTimeout(() => el.remove(), 1700);
    }
  },

  renderStreak() {
    document.getElementById('streakCount').textContent = Stats.getStreak();
    document.getElementById('userLevel').textContent = `Lv. ${Stats.getLevel()} · ${Stats.getXP()} XP`;
  },

  bindSettings() {
    const S = (k, v) => { Settings.set(k, v); };
    document.getElementById('setAccent').addEventListener('input', e => {
      S('accent', e.target.value);
      document.documentElement.style.setProperty('--accent', e.target.value);
    });
    document.getElementById('setFont').addEventListener('change', e => { S('font', e.target.value); this.applyFont(); });
    document.getElementById('setFontSize').addEventListener('input', e => { S('fontSize', e.target.value); this.applyFont(); document.getElementById('fontSizeVal').textContent = e.target.value + 'px'; });
    document.getElementById('setFontWeight').addEventListener('change', e => { S('fontWeight', e.target.value); this.applyFont(); });
    document.getElementById('setLetterSpacing').addEventListener('input', e => { S('ls', e.target.value); this.applyFont(); });
    document.getElementById('setLineHeight').addEventListener('input', e => { S('lh', e.target.value); this.applyFont(); });
    document.getElementById('setCaret').addEventListener('change', e => { S('caret', e.target.value); this.applyFont(); });
    document.getElementById('setBlink').addEventListener('change', e => S('blink', e.target.checked));
    document.getElementById('setSmoothCaret').addEventListener('change', e => S('smoothCaret', e.target.checked));
    document.getElementById('setMaxWidth').addEventListener('input', e => {
      S('maxWidth', e.target.value);
      document.documentElement.style.setProperty('--typing-max-width', e.target.value + 'px');
    });
    document.getElementById('setAlign').addEventListener('change', e => {
      S('align', e.target.value);
      document.documentElement.style.setProperty('--typing-align', e.target.value);
    });
    document.getElementById('setSpacing').addEventListener('change', e => S('spacing', e.target.value));
    document.getElementById('setSound').addEventListener('change', e => S('sound', e.target.checked));
    document.getElementById('setKeyboard').addEventListener('change', e => S('keyboard', e.target.checked));
    document.getElementById('setLiveStats').addEventListener('change', e => {
      S('liveStats', e.target.checked);
      document.getElementById('liveStats').style.display = e.target.checked ? '' : 'none';
    });
    document.getElementById('setBlind').addEventListener('change', e => S('blind', e.target.checked));
    document.getElementById('setStopOnErr').addEventListener('change', e => S('stopOnErr', e.target.checked));
    document.getElementById('setRipple').addEventListener('change', e => S('ripple', e.target.checked));
    document.getElementById('setShake').addEventListener('change', e => S('shake', e.target.checked));
    document.getElementById('setConfetti').addEventListener('change', e => S('confetti', e.target.checked));
    document.getElementById('setFocus').addEventListener('change', e => {
      S('focus', e.target.checked);
      document.body.classList.toggle('focus-mode', e.target.checked);
    });
    document.getElementById('setAdaptive').addEventListener('change', e => S('adaptive', e.target.checked));
    document.getElementById('setProgressive').addEventListener('change', e => S('progressive', e.target.checked));
    document.getElementById('setSpacedRep').addEventListener('change', e => S('spacedRep', e.target.checked));
    document.getElementById('setSmartSuggest').addEventListener('change', e => S('smartSuggest', e.target.checked));

    document.getElementById('exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ sessions: Stats.getSessions(), exported: Date.now() }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'typeflow-stats.json'; a.click();
    });
    document.getElementById('exportThemeBtn').addEventListener('click', () => {
      const blob = new Blob([ThemeManager.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'typeflow-theme.json'; a.click();
    });
    document.getElementById('importThemeBtn').addEventListener('click', () => document.getElementById('importThemeFile').click());
    document.getElementById('importThemeFile').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { if (ThemeManager.importJSON(r.result)) this.toast('Theme imported!'); else this.toast('Invalid file'); };
      r.readAsText(f);
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Delete all stats and settings?')) { Store.clearAll(); location.reload(); }
    });

    // Custom theme builder
    const fields = ['bg','bg-alt','bg-card','fg','fg-muted','accent','accent-2','good','bad','border'];
    document.getElementById('openCustomTheme').addEventListener('click', () => {
      const grid = document.getElementById('customThemeGrid'); grid.innerHTML = '';
      const cur = Settings.get('customTheme', {});
      fields.forEach(f => {
        const val = cur[f] || getComputedStyle(document.documentElement).getPropertyValue('--' + f).trim() || '#000000';
        const lbl = document.createElement('label'); lbl.className = 'row';
        lbl.textContent = f;
        const inp = document.createElement('input'); inp.type = 'color'; inp.value = val; inp.dataset.var = f;
        lbl.appendChild(inp); grid.appendChild(lbl);
      });
      document.getElementById('customThemeModal').classList.remove('hidden');
    });
    document.getElementById('closeCustomTheme').addEventListener('click', () => document.getElementById('customThemeModal').classList.add('hidden'));
    document.getElementById('saveCustomTheme').addEventListener('click', () => {
      const theme = {};
      document.querySelectorAll('#customThemeGrid input').forEach(inp => {
        theme[inp.dataset.var] = inp.value;
      });
      Settings.set('customTheme', theme);
      for (const [k, v] of Object.entries(theme)) document.documentElement.style.setProperty('--' + k, v);
      document.getElementById('customThemeModal').classList.add('hidden');
      this.toast('Custom theme saved!');
    });
  },

  applyFont() {
    const size = Settings.get('fontSize', 24);
    const font = Settings.get('font', "'JetBrains Mono', monospace");
    const weight = Settings.get('fontWeight', '400');
    const ls = Settings.get('ls', 5);
    const lh = Settings.get('lh', 17);
    const caret = Settings.get('caret', 'line');
    const t = document.querySelector('.typing-text');
    if (!t) return;
    t.style.fontSize = size + 'px';
    t.style.fontFamily = font;
    t.style.fontWeight = weight;
    t.style.letterSpacing = (ls / 10) + 'px';
    t.style.lineHeight = (lh / 10);
    t.classList.remove('caret-line', 'caret-block', 'caret-underline', 'caret-off');
    t.classList.add('caret-' + caret);
    t.classList.toggle('blink', Settings.get('blink', true));
  },

  applyAllSettings() {
    this.applyFont();
    const lt = Settings.get('liveStats', true);
    document.getElementById('liveStats').style.display = lt ? '' : 'none';
    document.body.classList.toggle('focus-mode', Settings.get('focus', false));
    const mw = Settings.get('maxWidth', 900);
    document.documentElement.style.setProperty('--typing-max-width', mw + 'px');
    const al = Settings.get('align', 'left');
    document.documentElement.style.setProperty('--typing-align', al);
    // Sync UI values
    document.getElementById('setTheme').value = ThemeManager.current;
    document.getElementById('setFontSize').value = Settings.get('fontSize', 24);
    document.getElementById('setAccent').value = Settings.get('accent', '#ffd166');
    document.getElementById('setMaxWidth').value = mw;
    document.getElementById('setAlign').value = al;
    document.getElementById('setCaret').value = Settings.get('caret', 'line');
  },

  renderStats() {
    const ss = Stats.getSessions().slice(-20);
    Charts.lineChart(document.getElementById('progressChart'), [{ data: ss.map(s => s.wpm), color: '#ffd166' }]);
    Charts.lineChart(document.getElementById('accChart'), [{ data: ss.map(s => s.accuracy), color: '#4cc9f0' }]);
    Keyboard.buildHeatmap(document.getElementById('heatmapKeyboard'), Stats.getKeyErrors());
    const pb = Stats.getPersonalBests();
    document.getElementById('pbList').innerHTML = `
      <li><span>Best WPM</span><strong>${pb.wpm}</strong></li>
      <li><span>Best Accuracy</span><strong>${pb.acc}%</strong></li>
      <li><span>Streak</span><strong>${pb.streak} days</strong></li>
      <li><span>Sessions</span><strong>${Stats.getSessions().length}</strong></li>`;
    const bg = Object.entries(Stats.getBigrams()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    document.getElementById('bigramList').innerHTML = bg.length
      ? bg.map(([k, n]) => `<li><span>"${k}"</span><strong>${n}×</strong></li>`).join('')
      : '<li class="muted">Not enough data</li>';
    const tb = document.querySelector('#historyTable tbody');
    tb.innerHTML = Stats.getSessions().slice(-15).reverse().map(s => `<tr>
      <td>${new Date(s.ts).toLocaleDateString()}</td><td>${s.mode}</td>
      <td>${s.wpm}</td><td>${s.accuracy}%</td><td>${Math.round(s.duration / 1000)}s</td><td>${s.errors}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">No sessions</td></tr>';
  },

  async renderLessons() {
    const container = document.getElementById('lessonGrid');
    const progress = Stats.getLessonProgress();
    const rec = Adaptive.recommendLesson();
    container.innerHTML = CONTENT.lessons.map(l => {
      const p = progress[l.id];
      const pct = p ? Math.min(100, Math.round((p.wpm / 40) * 100)) : 0;
      const isRec = rec.id === l.id;
      return `<div class="lesson-card${isRec ? ' recommended' : ''}" data-id="${l.id}">
        <h4>${l.title}${isRec ? ' ⭐' : ''}</h4>
        <p>${l.desc}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
    container.querySelectorAll('.lesson-card').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.dataset.id;
        const l = CONTENT.lessons.find(x => x.id === id);
        if (!l) return;
        const data = await Content.getPack(l.pack);
        this.currentMode = 'custom';
        this.currentText = Array.isArray(data) ? data.slice(0, 25).join(' ') : data;
        document.querySelector('.nav-btn[data-view="practice"]').click();
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.mode-btn[data-mode="custom"]').classList.add('active');
        setTimeout(() => this.startSession(true), 50);
      });
    });
    document.getElementById('learnRecommend').textContent =
      rec.isDrill ? '🎯 All lessons done — try a weak-key drill!' : `⭐ Recommended: ${rec.title}`;
  },

  bindLeaderboard() {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this.renderLeaderboard(b.dataset.tab);
      });
    });
  },

  renderLeaderboard(tab) {
    const ss = Stats.getSessions();
    const cut = tab === 'weekly' ? Date.now() - 7 * 864e5 : 0;
    const sorted = ss.filter(s => s.ts >= cut).sort((a, b) => b.wpm - a.wpm).slice(0, 20);
    const c = document.getElementById('leaderboardList');
    c.innerHTML = sorted.length ? sorted.map((s, i) => `<div class="lb-row">
      <div class="lb-rank">#${i + 1}</div>
      <div class="lb-name">${s.mode} · ${new Date(s.ts).toLocaleString()}<div class="muted small">${s.accuracy}% accuracy</div></div>
      <div class="lb-wpm">${s.wpm} wpm</div>
    </div>`).join('') : '<p class="muted">No sessions yet.</p>';
  },

  bindTexts() {
    // placeholder; renderTexts on click
  },

  async renderTexts() {
    const bar = document.getElementById('filterBar');
    const list = document.getElementById('textList');
    if (!bar.dataset.built) {
      bar.dataset.built = '1';
      const sel = document.createElement('select');
      sel.innerHTML = `
        <option value="words1000">Common words</option>
        <option value="phrases">Phrases</option>
        <option value="quotesClassic">Classic quotes</option>
        <option value="quotesCoding">Coding quotes</option>
        <option value="literature">Literature</option>
        <option value="codeJS">JavaScript</option>
        <option value="codePython">Python</option>
        <option value="codeHTML">HTML/CSS</option>
        <option value="numbers">Numbers</option>
        <option value="symbols">Symbols</option>
        <option value="bigrams">Bigrams</option>
        <option value="trigrams">Trigrams</option>
        <option value="pangrams">Pangrams</option>`;
      sel.id = 'textPackSelect';
      sel.addEventListener('change', () => this.loadTextPack(sel.value));
      bar.appendChild(sel);
    }
    await this.loadTextPack(document.getElementById('textPackSelect').value || 'words1000');
  },

  async loadTextPack(name) {
    const list = document.getElementById('textList');
    list.innerHTML = '<p class="muted">Loading...</p>';
    const data = await Content.getPack(name);
    const arr = Array.isArray(data) ? data : [];
    list.innerHTML = arr.slice(0, 200).map((t, i) => {
      const fav = (Store.get('favs', []) || []).includes(t);
      return `<div class="text-row">
        <div class="text-body">${(t + '').slice(0, 120).replace(/</g, '&lt;')}</div>
        <button class="fav${fav ? ' on' : ''}" data-i="${i}">★</button>
        <button class="btn" data-practice="${i}">Practice</button>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-practice]').forEach(b => {
      b.addEventListener('click', () => {
        this.currentText = arr[+b.dataset.practice];
        this.currentMode = 'custom';
        document.querySelector('.nav-btn[data-view="practice"]').click();
        document.querySelectorAll('.mode-btn').forEach(x => x.classList.remove('active'));
        document.querySelector('.mode-btn[data-mode="custom"]').classList.add('active');
        setTimeout(() => this.startSession(true), 50);
      });
    });
    list.querySelectorAll('.fav').forEach(b => {
      b.addEventListener('click', () => {
        const favs = Store.get('favs', []);
        const t = arr[+b.dataset.i];
        const idx = favs.indexOf(t);
        if (idx >= 0) favs.splice(idx, 1); else favs.push(t);
        Store.set('favs', favs);
        b.classList.toggle('on');
      });
    });
  },

  toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());