import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="how-it-works" class="py-24 px-6 bg-sf-surface scroll-mt-20">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            How it works
          </p>
          <h2 class="font-display text-4xl font-bold text-sf-text-1 tracking-tight">
            Live in three steps
          </h2>
        </div>

        <div class="relative grid grid-cols-1 md:grid-cols-3 gap-10">
          <div class="hidden md:block absolute top-11 inset-x-0 h-px"
               style="background-image: repeating-linear-gradient(to right, var(--color-sf-border) 0 8px, transparent 8px 16px);"></div>

          @for (step of steps; track step.n) {
            <div class="animate-reveal-in relative text-center" [style.animation-delay]="(step.n * 100) + 'ms'">
              <div class="relative mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full
                          border border-sf-border bg-sf-bg shadow-sm">
                <span class="font-display font-bold text-2xl text-accent">{{ step.n }}</span>
              </div>
              <h3 class="font-display text-lg font-semibold text-sf-text-1 mt-5 mb-2">{{ step.title }}</h3>
              <p class="text-sf-text-3 text-sm leading-relaxed max-w-xs mx-auto">{{ step.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class HowItWorksComponent {
  readonly steps = [
    { n: 1, title: 'Pick your store type', desc: 'Ecommerce, restaurant, or bookings — choose the one that fits your business.' },
    { n: 2, title: 'Customize your look', desc: 'Pick a template, set your colors and logo, add your products or services.' },
    { n: 3, title: 'Go live', desc: 'Your store is instantly live at yourbrand.launchly.com — no code, no waiting.' },
  ];
}
