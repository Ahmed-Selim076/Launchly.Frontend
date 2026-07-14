import {
  Directive, Input, ElementRef, OnInit, OnDestroy, inject,
} from '@angular/core';

@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnInit, OnDestroy {
  @Input({ required: true }) appCountUp = 0;
  @Input() countUpDuration = 0; // 0 = auto-calculate

  private readonly el = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;
  private hasPlayed = false;

  ngOnInit(): void {
    this.el.nativeElement.textContent = '0';

    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !this.hasPlayed) {
          this.hasPlayed = true;
          this.#animate();
          this.observer?.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  #animate(): void {
    const target   = this.appCountUp;
    const duration = this.countUpDuration || Math.min(Math.max(target * 1.5, 400), 2000);
    const start    = performance.now();
    const el       = this.el.nativeElement;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = this.#format(target);
      return;
    }

    const step = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const current  = Math.round(eased * target);

      el.textContent = this.#format(current);

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  #format(n: number): string {
    return n.toLocaleString();
  }
}
