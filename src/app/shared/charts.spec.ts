import { TestBed } from '@angular/core/testing';
import { axis, BarChart, DonutChart, LineChart } from './charts';

const rounded = (n: number) => 'S/ ' + Math.round(n);
const exact = (n: number) => 'S/ ' + n.toFixed(2);

// Text of each cell (or span) of a row, separated by a space
function cells(row: Element): string {
  return [...row.children].map((c) => (c.textContent ?? '').trim()).filter((t) => t).join(' ');
}

// Text of the hidden table that screen readers read
function tableText(el: HTMLElement): string[] {
  return [...el.querySelectorAll('table tr')].map((tr) => cells(tr));
}

describe('dashboard charts', () => {
  it('builds a readable axis, also when every value is 0 or negative', () => {
    expect(axis([0, 0, 0]).ticks).toEqual([0, 50]); // not "S/ 0, S/ 1"
    const withNegative = axis([-393.2, 0, 8.5]);
    expect(withNegative.min).toBeLessThanOrEqual(-393.2);
    expect(withNegative.max).toBeGreaterThanOrEqual(8.5);
    expect(withNegative.ticks).toContain(0);
    const big = axis([6542]);
    expect(big.max).toBeGreaterThanOrEqual(6542);
    expect(big.max).toBeLessThan(10000); // no big empty space on top
  });

  it('line chart: one point per month and the exact amounts for screen readers (US07)', async () => {
    const fixture = TestBed.createComponent(LineChart);
    fixture.componentRef.setInput('points', [
      { label: 'sep', value: 8.5 },
      { label: 'oct', value: -393.2 },
      { label: 'nov', value: 0 },
    ]);
    fixture.componentRef.setInput('label', 'Evolución del saldo');
    fixture.componentRef.setInput('format', rounded);
    fixture.componentRef.setInput('detail', exact);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('circle').length).toBe(3);
    expect(el.querySelector('svg')?.getAttribute('role')).toBe('img');
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('Evolución del saldo');
    // The axis is rounded, but the hidden table and the tooltip keep the cents
    expect(tableText(el)).toEqual(['sep S/ 8.50', 'oct S/ -393.20', 'nov S/ 0.00']);
    expect(el.querySelector('circle title')?.textContent).toBe('sep: S/ 8.50');
    // Every point is inside the drawing
    for (const c of el.querySelectorAll('circle')) {
      const y = Number(c.getAttribute('cy'));
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(220);
    }
  });

  it('bar chart: one bar per month and series, taller for the bigger amount (US09)', async () => {
    const fixture = TestBed.createComponent(BarChart);
    fixture.componentRef.setInput('labels', ['sep', 'oct']);
    fixture.componentRef.setInput('series', [
      { name: 'Ingresos', color: '#16a34a', values: [450, 0] },
      { name: 'Gastos', color: '#dc2626', values: [48.3, 8.5] },
    ]);
    fixture.componentRef.setInput('label', 'Ingresos vs. gastos');
    fixture.componentRef.setInput('detail', exact);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const bars = [...el.querySelectorAll('rect')].map((r) => Number(r.getAttribute('height')));
    expect(bars.length).toBe(4);
    expect(bars[0]).toBeGreaterThan(bars[1]); // 450 > 48.30
    expect(bars[2]).toBe(0); // October income: 0
    expect(bars.every((h) => h >= 0)).toBe(true);
    expect(tableText(el)).toEqual(['Ingresos Gastos', 'sep S/ 450.00 S/ 48.30', 'oct S/ 0.00 S/ 8.50']);
  });

  it('donut: the slices fill the whole circle and the legend shows each category (US10)', async () => {
    const fixture = TestBed.createComponent(DonutChart);
    fixture.componentRef.setInput('slices', [
      { label: 'Comida', value: 75, percent: 75, color: '#16a34a' },
      { label: 'Salud', value: 25, percent: 25, color: '#dc2626' },
    ]);
    fixture.componentRef.setInput('label', 'Distribución por categoría');
    fixture.componentRef.setInput('centerLabel', 'Total gastado');
    fixture.componentRef.setInput('format', exact);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const donut = fixture.componentInstance;

    const total = donut.arcs().reduce((t, a) => t + a.length, 0);
    expect(total).toBeCloseTo(donut.circumference, 5);
    expect(donut.arcs()[1].offset).toBeCloseTo(donut.circumference * 0.75, 5);
    expect(el.querySelector('.center-value')?.textContent).toBe('S/ 100.00');
    expect([...el.querySelectorAll('.legend li')].map((li) => cells(li))).toEqual([
      'Comida S/ 75.00 · 75%',
      'Salud S/ 25.00 · 25%',
    ]);
  });
});
