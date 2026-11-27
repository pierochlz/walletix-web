import { TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';

describe('Skeleton (loading placeholders)', () => {
  it('draws the requested number of placeholders and tells screen readers once that it is loading', () => {
    TestBed.configureTestingModule({ imports: [Skeleton] });
    const fixture = TestBed.createComponent(Skeleton);
    fixture.componentRef.setInput('variant', 'list');
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelectorAll('.item').length).toBe(4);
    expect(root.querySelector('[role="status"]')).not.toBeNull();
    expect(root.querySelector('.sr-only')?.textContent?.trim()).toBeTruthy();
    // The gray blocks themselves are hidden from screen readers
    root.querySelectorAll('.item').forEach((item) => expect(item.getAttribute('aria-hidden')).toBe('true'));
  });
});
