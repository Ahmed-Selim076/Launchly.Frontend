import {
  Directive, Input, ElementRef, OnInit, OnDestroy, inject,
} from '@angular/core';

@Directive({
  selector: 'img[appLazyImage]',
  standalone: true,
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input({ required: true }) appLazyImage = '';
  @Input() fallback = '/assets/images/placeholder.png';

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    const img = this.el.nativeElement;
    img.style.opacity = '0';
    img.style.transition = 'opacity 220ms ease';

    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          img.src = this.appLazyImage;
          img.onload  = () => { img.style.opacity = '1'; };
          img.onerror = () => { img.src = this.fallback; img.style.opacity = '1'; };
          this.observer?.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    this.observer.observe(img);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
