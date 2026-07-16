import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { MagneticHoverDirective } from '../../../shared/directives/magnetic-hover.directive';

/**
 * Platform Hero — full redesign. The old version ended in a static
 * "mock browser + gradient box + 'Your store here ✦'" placeholder, which
 * said nothing real about the product. This version shows the three real
 * store types as a tilted, staggered card fan (their own icon + color),
 * so the very first thing a visitor sees is an honest preview of what
 * they'd actually get — not a generic SaaS-template gradient box.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, ButtonComponent, MagneticHoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative overflow-hidden pt-20 pb-28 px-6" id="top">
      <!-- Ambient mesh -->
      <div class="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-[0.10] bg-accent"></div>
      <div class="pointer-events-none absolute top-40 -right-24 w-96 h-96 rounded-full blur-3xl opacity-[0.08] bg-accent"></div>

      <div class="relative max-w-4xl mx-auto text-center">
        <div class="animate-reveal-in stagger-1 inline-flex items-center gap-2 px-3 py-1.5
                    rounded-full border border-sf-border bg-sf-surface text-xs font-medium
                    text-sf-text-2 mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
          Launch your store in minutes
        </div>

        <h1 class="animate-reveal-in stagger-2 font-display font-bold text-5xl md:text-6xl
                   text-sf-text-1 tracking-tighter leading-[1.1] mb-6">
          One platform.<br>
          <span class="text-accent">Every kind of storefront.</span>
        </h1>

        <p class="animate-reveal-in stagger-3 text-lg text-sf-text-3 max-w-xl mx-auto mb-10">
          Launchly gives your business a beautiful, fully-customisable online store —
          ecommerce, bookings, or restaurant ordering. No code needed.
        </p>

        <div class="animate-reveal-in stagger-4 flex items-center justify-center gap-4 flex-wrap">
          <span appMagneticHover [magnetStrength]="6" class="inline-block">
            <app-button variant="primary" size="lg" routerLink="/signup">
              Start for free
            </app-button>
          </span>
          <span appMagneticHover [magnetStrength]="6" class="inline-block">
            <app-button variant="secondary" size="lg" routerLink="/pricing">
              See pricing
            </app-button>
          </span>
        </div>

        <p class="animate-reveal-in stagger-5 mt-10 text-xs text-sf-text-3">
          No credit card required · Free plan available · Setup in 2 minutes
        </p>
      </div>

      <!-- Store-type preview fan — three tilted cards, not one flat mock browser -->
      <div class="animate-reveal-in stagger-6 mt-20 max-w-4xl mx-auto relative h-[280px] sm:h-[320px]">
        @for (card of previewCards; track card.label; let i = $index) {
          <a
            appMagneticHover [magnetStrength]="8"
            routerLink="/showcase"
            class="preview-card absolute top-1/2 left-1/2 w-52 sm:w-60 rounded-2xl border border-sf-border
                   bg-sf-surface shadow-lg overflow-hidden cursor-pointer"
            [style.--card-x.px]="card.x"
            [style.--card-rotate.deg]="card.rotate"
            [style.z-index]="card.z"
          >
            <div class="h-24 flex items-center justify-center text-4xl" [style.background]="card.bg">
              {{ card.icon }}
            </div>
            <div class="p-4">
              <p class="font-display font-semibold text-sf-text-1 text-sm mb-1">{{ card.label }}</p>
              <p class="text-xs text-sf-text-3">{{ card.desc }}</p>
            </div>
          </a>
        }
      </div>
    </section>

    <style>
      .preview-card {
        transform: translate(-50%, -50%) translateX(var(--card-x)) rotate(var(--card-rotate));
        transition: transform 280ms var(--ease-spring, cubic-bezier(.2,1,.3,1)), box-shadow 280ms;
      }
      .preview-card:hover {
        /* Keep each card's own --card-x offset — only straighten rotation
           and scale up. Overwriting the whole transform (the old approach)
           dropped translateX entirely, snapping every card back to dead
           center on hover so they all piled on top of each other. */
        transform: translate(-50%, -55%) translateX(var(--card-x)) rotate(0deg) scale(1.04);
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        z-index: 10;
      }
    </style>
  `,
})
export class HeroComponent {
  readonly previewCards = [
    { label: 'Ecommerce', desc: 'Sell products online',   icon: '🛍️', bg: 'color-mix(in srgb, #C1522A 15%, transparent)', x: -170, rotate: -8, z: 1 },
    { label: 'Restaurant', desc: 'Take food orders',       icon: '🍽️', bg: 'color-mix(in srgb, #6D28D9 15%, transparent)', x: 0,    rotate: 0,  z: 2 },
    { label: 'Bookings',   desc: 'Manage appointments',    icon: '📅', bg: 'color-mix(in srgb, #1F2937 15%, transparent)', x: 170,  rotate: 8,  z: 1 },
  ];
}
