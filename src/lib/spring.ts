/**
 * Critically-tunable springs, integrated with semi-implicit Euler.
 * Interruptible by design: retargeting keeps the current position and velocity,
 * so a morph redirected mid-flight never jumps (Apple's "fluid interfaces" rule).
 */

export type SpringConfig = {
  /** Stiffness, N/m-ish. ~380 matches the snappy Dynamic Island feel. */
  stiffness: number;
  /** Damping ratio ζ. < 1 overshoots, 1 is critically damped. */
  damping: number;
};

export const islandSpring: SpringConfig = { stiffness: 380, damping: 0.72 };
export const calmSpring: SpringConfig = { stiffness: 520, damping: 1 };
/** Slower follower used for the liquid "ghost" that trails the island when it changes shape. */
export const ghostSpring: SpringConfig = { stiffness: 150, damping: 0.86 };

const MAX_DT = 1 / 30;
const REST_DELTA = 0.05;
const REST_SPEED = 0.05;

export class Spring {
  value: number;
  velocity = 0;
  target: number;

  constructor(initial: number, public config: SpringConfig) {
    this.value = initial;
    this.target = initial;
  }

  /** Advances the spring; returns true while it is still moving. */
  step(dt: number): boolean {
    const h = Math.min(dt, MAX_DT);
    const { stiffness: k, damping: zeta } = this.config;
    const c = 2 * zeta * Math.sqrt(k);
    const accel = -k * (this.value - this.target) - c * this.velocity;
    this.velocity += accel * h;
    this.value += this.velocity * h;

    const settled = Math.abs(this.value - this.target) < REST_DELTA && Math.abs(this.velocity) < REST_SPEED;
    if (settled) {
      this.value = this.target;
      this.velocity = 0;
    }
    return !settled;
  }

  snap(to = this.target) {
    this.target = to;
    this.value = to;
    this.velocity = 0;
  }
}

/**
 * Drives a set of springs on one requestAnimationFrame loop that sleeps once
 * every spring has settled.
 */
export class SpringLoop {
  private raf = 0;
  private last = 0;

  constructor(
    private springs: Spring[],
    private onFrame: () => void,
  ) {}

  kick() {
    if (this.raf) return;
    this.last = performance.now();
    const tick = (now: number) => {
      const dt = (now - this.last) / 1000;
      this.last = now;
      let moving = false;
      for (const s of this.springs) moving = s.step(dt) || moving;
      this.onFrame();
      this.raf = moving ? requestAnimationFrame(tick) : 0;
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
