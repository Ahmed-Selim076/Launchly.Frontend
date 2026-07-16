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
 * For elements that already have their own positioning transform (e.g. the
 * hero's fanned-out preview cards, which use translate/rotate to sit off to
 * one side), pass that transform in via [baseTransform]. Without it, this
 * directive would overwrite the element's transform outright on the very
 * first mousemove — and since it writes directly via Renderer2.setStyle,
 * that inline value beats any CSS rule and nothing else ever resets it, so
 * the element stays stuck in the wrong place even after the mouse leaves.
 * Prepending baseTransform keeps the element's real position intact and
 * only layers the small magnetic wobble on top of it.
 *
 * Only transform is mutated — always GPU composited.
 */
@Directive({
  selector: '[appMagneticHover]',
  standalone: true,
})
export class MagneticHoverDirective implements OnDestroy {
  @Input() magnetStrength = 4;
  @Input() baseTransform = '';

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

    this.renderer.setStyle(
      this.el.nativeElement, 'transform',
      `${this.baseTransform} translate(${tx}px,${ty}px)`.trim()
    );
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 80ms linear');
  }

  private onLeave(): void {
    this.renderer.setStyle(
      this.el.nativeElement, 'transform',
      `${this.baseTransform} translate(0,0)`.trim()
    );
    this.renderer.setStyle(this.el.nativeElement, 'transition',
      `transform var(--duration-slow) var(--ease-spring)`);
  }

  ngOnDestroy(): void {
    this.unlisten.forEach(fn => fn());
  }
}
