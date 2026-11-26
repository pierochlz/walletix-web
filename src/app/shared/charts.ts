import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';

// Small SVG charts of the dashboard (US07, US09, US10), without external libraries.
// Every chart also has a hidden table with the same numbers for screen readers.

const H = 220;
const PAD = { top: 16, right: 16, bottom: 30, left: 64 };

// The chart draws at its real width (not scaled), so the texts keep their size on a phone
function realWidth(): () => number {
  const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  const width = signal(600);
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    const observer = new ResizeObserver((entries) => width.set(Math.max(260, Math.round(entries[0].contentRect.width))));
    observer.observe(host);
    destroyRef.onDestroy(() => observer.disconnect());
  });
  return width;
}

// "Nice" axis: from the minimum (or 0) to the maximum, in about 4 steps
function axis(values: number[]): { min: number; max: number; ticks: number[] } {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const step = niceStep(span / 4);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step || step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { min: lo, max: hi, ticks };
}

function niceStep(raw: number): number {
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / power;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power;
}

// ---------- Line: evolution of the balance (US07) ----------
@Component({
  selector: 'app-line-chart',
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height" role="img" [attr.aria-label]="label()" class="chart">
      @for (t of scale().ticks; track t) {
        <line class="grid" [attr.x1]="pad.left" [attr.x2]="width() - pad.right" [attr.y1]="y(t)" [attr.y2]="y(t)" />
        <text class="tick" [attr.x]="pad.left - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ format()(t) }}</text>
      }
      <polyline [attr.points]="line()" fill="none" [attr.stroke]="color()" stroke-width="3" stroke-linejoin="round" />
      @for (p of points(); track $index) {
        <circle [attr.cx]="x($index)" [attr.cy]="y(p.value)" r="5" [attr.fill]="color()">
          <title>{{ p.label }}: {{ format()(p.value) }}</title>
        </circle>
        <text class="tick" [attr.x]="x($index)" [attr.y]="height - 8" text-anchor="middle">{{ p.label }}</text>
      }
    </svg>
    <table class="sr-only">
      <caption>{{ label() }}</caption>
      @for (p of points(); track $index) {
        <tr><th scope="row">{{ p.label }}</th><td>{{ format()(p.value) }}</td></tr>
      }
    </table>
  `,
  styleUrl: './charts.css',
})
export class LineChart {
  readonly points = input.required<{ label: string; value: number }[]>();
  readonly label = input.required<string>();
  readonly color = input('#2563eb');
  readonly format = input<(n: number) => string>((n) => String(n));

  readonly width = realWidth();
  readonly height = H;
  readonly pad = PAD;
  readonly scale = computed(() => axis(this.points().map((p) => p.value)));
  readonly line = computed(() => this.points().map((p, i) => `${this.x(i)},${this.y(p.value)}`).join(' '));

  x(i: number): number {
    const n = this.points().length;
    return n <= 1 ? (PAD.left + this.width() - PAD.right) / 2 : PAD.left + (i * (this.width() - PAD.left - PAD.right)) / (n - 1);
  }

  y(value: number): number {
    const { min, max } = this.scale();
    return PAD.top + ((max - value) * (H - PAD.top - PAD.bottom)) / (max - min || 1);
  }
}

// ---------- Grouped bars: income vs expenses per month (US09) ----------
export interface BarSeries {
  name: string;
  color: string;
  values: number[];
}

@Component({
  selector: 'app-bar-chart',
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height" role="img" [attr.aria-label]="label()" class="chart">
      @for (t of scale().ticks; track t) {
        <line class="grid" [attr.x1]="pad.left" [attr.x2]="width() - pad.right" [attr.y1]="y(t)" [attr.y2]="y(t)" />
        <text class="tick" [attr.x]="pad.left - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ format()(t) }}</text>
      }
      @for (l of labels(); track $index; let i = $index) {
        @for (s of series(); track s.name; let j = $index) {
          <rect [attr.x]="barX(i, j)" [attr.y]="y(s.values[i])" [attr.width]="barWidth()" [attr.height]="barHeight(s.values[i])"
                [attr.fill]="s.color" rx="3">
            <title>{{ l }} · {{ s.name }}: {{ format()(s.values[i]) }}</title>
          </rect>
        }
        <text class="tick" [attr.x]="groupCenter(i)" [attr.y]="height - 8" text-anchor="middle">{{ l }}</text>
      }
    </svg>
    <table class="sr-only">
      <caption>{{ label() }}</caption>
      <tr><th scope="col"></th>@for (s of series(); track s.name) { <th scope="col">{{ s.name }}</th> }</tr>
      @for (l of labels(); track $index; let i = $index) {
        <tr><th scope="row">{{ l }}</th>@for (s of series(); track s.name) { <td>{{ format()(s.values[i]) }}</td> }</tr>
      }
    </table>
  `,
  styleUrl: './charts.css',
})
export class BarChart {
  readonly labels = input.required<string[]>();
  readonly series = input.required<BarSeries[]>();
  readonly label = input.required<string>();
  readonly format = input<(n: number) => string>((n) => String(n));

  readonly width = realWidth();
  readonly height = H;
  readonly pad = PAD;
  readonly scale = computed(() => axis(this.series().flatMap((s) => s.values)));
  private readonly groupWidth = computed(() => (this.width() - PAD.left - PAD.right) / Math.max(1, this.labels().length));
  readonly barWidth = computed(() => Math.min(36, (this.groupWidth() * 0.7) / Math.max(1, this.series().length)));

  groupCenter(i: number): number {
    return PAD.left + this.groupWidth() * (i + 0.5);
  }

  barX(i: number, j: number): number {
    const total = this.barWidth() * this.series().length;
    return this.groupCenter(i) - total / 2 + j * this.barWidth();
  }

  y(value: number): number {
    const { min, max } = this.scale();
    return PAD.top + ((max - Math.max(value, min)) * (H - PAD.top - PAD.bottom)) / (max - min || 1);
  }

  barHeight(value: number): number {
    return Math.max(0, this.y(0) - this.y(value));
  }
}

// ---------- Donut: distribution by category (US10) ----------
export interface DonutSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  template: `
    <div class="donut">
      <svg viewBox="0 0 200 200" role="img" [attr.aria-label]="label()">
        <circle cx="100" cy="100" [attr.r]="r" fill="none" class="track" stroke-width="28" />
        @for (s of arcs(); track $index) {
          <circle cx="100" cy="100" [attr.r]="r" fill="none" [attr.stroke]="s.color" stroke-width="28"
                  [attr.stroke-dasharray]="s.length + ' ' + (circumference - s.length)" [attr.stroke-dashoffset]="-s.offset"
                  transform="rotate(-90 100 100)">
            <title>{{ s.label }}: {{ format()(s.value) }} ({{ s.percent }}%)</title>
          </circle>
        }
        <text x="100" y="94" text-anchor="middle" class="center-label">{{ centerLabel() }}</text>
        <text x="100" y="118" text-anchor="middle" class="center-value">{{ format()(total()) }}</text>
      </svg>
      <ul class="legend">
        @for (s of slices(); track $index) {
          <li>
            <span class="dot" [style.background]="s.color" aria-hidden="true"></span>
            <span class="name">{{ s.label }}</span>
            <span class="amount">{{ format()(s.value) }} · {{ s.percent }}%</span>
          </li>
        }
      </ul>
    </div>
  `,
  styleUrl: './charts.css',
})
export class DonutChart {
  readonly slices = input.required<DonutSlice[]>();
  readonly label = input.required<string>();
  readonly centerLabel = input('');
  readonly format = input<(n: number) => string>((n) => String(n));

  readonly r = 72;
  readonly circumference = 2 * Math.PI * 72;
  readonly total = computed(() => this.slices().reduce((t, s) => t + s.value, 0));
  readonly arcs = computed(() => {
    const total = this.total() || 1;
    let offset = 0;
    return this.slices().map((s) => {
      const length = (s.value / total) * this.circumference;
      const arc = { ...s, length, offset };
      offset += length;
      return arc;
    });
  });
}
