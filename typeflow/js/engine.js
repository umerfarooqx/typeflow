class TypingEngine {
  constructor(o) {
    this.text = o.text; this.mode = o.mode;
    this.onTick = o.onTick || (() => {});
    this.onFinish = o.onFinish || (() => {});
    this.reset();
  }
  reset() {
    this.pos = 0; this.errors = 0; this.keystrokes = 0; this.correctChars = 0;
    this.started = false; this.finished = false; this.startTime = 0; this.elapsed = 0;
    this.keyErrors = {}; this.bigrams = {}; this.perSecondSamples = [];
    this._timer = null; this._lastCharTime = 0; this._lastBigramChar = null;
  }
  start() {
    if (this.started) return;
    this.started = true; this.startTime = performance.now(); this._tickLoop();
  }
  _tickLoop() {
    if (this.finished) return;
    this.elapsed = performance.now() - this.startTime;
    const sec = Math.floor(this.elapsed / 1000);
    if (sec >= this.perSecondSamples.length) {
      this.perSecondSamples.push(StatsUtil.computeWPM(this.correctChars, this.elapsed));
    }
    this.onTick(this.elapsed);
    this._timer = requestAnimationFrame(() => this._tickLoop());
  }
  pause() { if (this._timer) cancelAnimationFrame(this._timer); }
  handleInput(char) {
    if (this.finished) return;
    if (!this.started) this.start();
    const expected = this.text[this.pos];
    this.keystrokes++;
    if (char === expected) {
      this.correctChars++; this.pos++;
      if (this._lastBigramChar) {
        const bg = this._lastBigramChar + char;
        const timing = performance.now() - this._lastCharTime;
        if (timing > 300) this.bigrams[bg] = (this.bigrams[bg] || 0) + 1;
      }
      this._lastBigramChar = char; this._lastCharTime = performance.now();
      if (this.pos >= this.text.length) this.finish();
      return { correct: true };
    } else {
      this.errors++;
      const key = expected === ' ' ? 'space' : expected;
      this.keyErrors[key] = (this.keyErrors[key] || 0) + 1;
      this.pos++;
      if (this.pos >= this.text.length) this.finish();
      return { correct: false, expected };
    }
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this._timer) cancelAnimationFrame(this._timer);
    this.elapsed = performance.now() - this.startTime;
    this.onFinish({
      wpm: StatsUtil.computeWPM(this.correctChars, this.elapsed),
      raw: StatsUtil.computeWPM(this.keystrokes, this.elapsed),
      accuracy: StatsUtil.computeAccuracy(this.correctChars, this.keystrokes),
      consistency: StatsUtil.computeConsistency(this.perSecondSamples),
      errors: this.errors, keystrokes: this.keystrokes,
      correctChars: this.correctChars, duration: this.elapsed,
      mode: this.mode, keyErrors: this.keyErrors, bigrams: this.bigrams,
      samples: this.perSecondSamples
    });
  }
}