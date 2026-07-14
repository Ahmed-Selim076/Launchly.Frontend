import { Component, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MagneticHoverDirective } from '../../../shared/directives/magnetic-hover.directive';

@Component({
  selector: 'app-store-types',
  standalone: true,
  imports: [CommonModule, RouterLink, MagneticHoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="store-types" class="py-24 px-6 scroll-mt-20">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            Built for your business
          </p>
          <h2 class="font-display text-4xl font-bold text-sf-text-1 tracking-tight mb-4">
            Three store types, one platform
          </h2>
          <p class="text-sf-text-3 text-lg max-w-xl mx-auto">
            Pick the storefront that fits how you actually sell — each one purpose-built,
            not a generic template stretched to fit.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (t of types; track t.label; let i = $index) {
            <a
              #card
              routerLink="/showcase"
              appMagneticHover [magnetStrength]="3"
              class="reveal group relative rounded-2xl border border-sf-border bg-sf-surface p-8
                     overflow-hidden transition-all duration-220 hover:border-sf-border-2 hover:shadow-lg"
              [style.transition-delay]="(i * 80) + 'ms'"
            >
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   [style.background]="'linear-gradient(135deg, ' + t.color + '18, transparent)'"></div>

              <div class="relative">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6"
                     [style.background]="t.color + '1f'">
                  {{ t.icon }}
                </div>
                <h3 class="font-display text-xl font-semibold text-sf-text-1 mb-2">{{ t.label }}</h3>
                <p class="text-sf-text-3 text-sm leading-relaxed mb-6">{{ t.desc }}</p>

                <ul class="space-y-2 mb-6">
                  @for (f of t.features; track f) {
                    <li class="flex items-center gap-2 text-sm text-sf-text-2">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
                           class="w-4 h-4 flex-shrink-0" [style.color]="t.color">
                        <path d="M5 10l3 3 7-7"/>
                      </svg>
                      {{ f }}
                    </li>
                  }
                </ul>

                <span class="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1"
                      [style.color]="t.color">
                  See live demo
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/>
                  </svg>
                </span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class StoreTypesComponent implements AfterViewInit {
  @ViewChildren('card') cards!: QueryList<ElementRef<HTMLElement>>;

  readonly types = [
    {
      label: 'Ecommerce', icon: '🛍️', color: '#C1522A',
      desc: 'Sell physical or digital products with a full catalog, cart, and checkout.',
      features: ['Wishlist & reviews', 'Discounts & sale badges', 'Real-time inventory'],
    },
    {
      label: 'Restaurant', icon: '🍽️', color: '#6D28D9',
      desc: 'Take food orders online with a menu customers can actually browse.',
      features: ['Delivery & pickup', 'Live order status', 'Category-organized menu'],
    },
    {
      label: 'Bookings', icon: '📅', color: '#1F2937',
      desc: 'Let clients book appointments against your real, live availability.',
      features: ['Service catalog', 'Instant confirmation', 'Bilingual (EN/AR) storefront'],
    },
  ];

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.15 }
    );
    this.cards.forEach(c => observer.observe(c.nativeElement));
  }
}
