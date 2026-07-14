import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-platform-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="faq" class="py-24 px-6 scroll-mt-20">
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-14">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            Questions
          </p>
          <h2 class="font-display text-4xl font-bold text-sf-text-1 tracking-tight">
            Frequently asked
          </h2>
        </div>

        <div class="space-y-2.5">
          @for (item of items; track item.q; let i = $index) {
            <div class="rounded-xl border border-sf-border bg-sf-surface overflow-hidden">
              <button type="button" (click)="toggle(i)"
                class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-sf-text-1
                       hover:bg-sf-bg/50 transition-colors">
                <span>{{ item.q }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     class="w-4 h-4 flex-shrink-0 text-accent transition-transform duration-220" [class.rotate-45]="open() === i">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
              @if (open() === i) {
                <p class="animate-reveal-in px-5 pb-4 text-sm text-sf-text-3 leading-relaxed">{{ item.a }}</p>
              }
            </div>
          }
        </div>

        <p class="text-center text-sf-text-3 text-sm mt-10">
          Still have questions?
          <a routerLink="/pricing" class="text-accent font-medium hover:underline">See pricing</a>
          or reach out — we're happy to help.
        </p>
      </div>
    </section>
  `,
})
export class PlatformFaqComponent {
  readonly open = signal<number | null>(0);

  readonly items = [
    { q: 'Do I need to know how to code?',
      a: 'No — pick a store type and template, customize colors and content, and you\'re live. No code required at any step.' },
    { q: 'Can I use my own domain?',
      a: 'Your store starts on a free yourbrand.launchly.com subdomain instantly. Custom domain support is on our roadmap.' },
    { q: 'Which store type should I pick?',
      a: 'Ecommerce for physical or digital products, Restaurant for food ordering, and Bookings for appointment-based services. Each is purpose-built, not a generic template.' },
    { q: 'Can I change templates later?',
      a: 'Yes — you can switch between the three templates for your store type any time from your admin dashboard.' },
    { q: 'Is there a free plan?',
      a: 'Yes, you can get started for free — no credit card required. See the pricing page for full plan details.' },
  ];

  toggle(i: number): void {
    this.open.set(this.open() === i ? null : i);
  }
}
