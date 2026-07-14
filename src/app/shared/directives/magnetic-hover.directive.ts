import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';

/**
 * MagneticHoverDirective
 *
 * On hover: element follows cursor slightly (±magnetStrength px).
 * On leave: springs back using --ease-spring from globals.css.
 * Auto-disabled when prefers-reduced-motion is active.
 *
 * Usage:
 *   <button appMagneticHover>Click me</button>
 *   <button appMagneticHover [magnetStrength]="6">Stronger</button>
 *
 * Only transform is mutated — always GPU composited.
 */
@Directive({
  selector: '[appMagneticHover]',
  standalone: true,
})
export class MagneticHoverDirective implements OnDestroy {
  @Input() magnetStrength = 4;

  private readonly el       = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  private readonly reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private unlisten: (() => void)[] = [];

  constructor() {
    if (this.reducedMotion) return;

    const host = this.el.nativeElement;
    this.unlisten = [
      this.renderer.listen(host, 'mousemove',  (e: MouseEvent) => this.onMove(e)),
      this.renderer.listen(host, 'mouseleave', ()               => this.onLeave()),
    ];
  }

  private onMove(e: MouseEvent): void {
    const rect    = this.el.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    const maxDist = Math.max(rect.width, rect.height) / 2;
    const tx      = ((e.clientX - centerX) / maxDist) * this.magnetStrength;
    const ty      = ((e.clientY - centerY) / maxDist) * this.magnetStrength;

    this.renderer.setStyle(this.el.nativeElement, 'transform',  `translate(${tx}px,${ty}px)`);
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 80ms linear');
  }

  private onLeave(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transform',  'translate(0,0)');
    this.renderer.setStyle(this.el.nativeElement, 'transition',
      `transform var(--duration-slow) var(--ease-spring)`);
  }

  ngOnDestroy(): void {
    this.unlisten.forEach(fn => fn());
  }
}
