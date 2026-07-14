import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TenantService }         from '../../../../../core/tenant/tenant.service';
import { BookingStoreService, IPublicService } from '../../../../../core/storefront/booking-store.service';
import { BookingTranslationService } from '../../../../../core/storefront/booking-translation.service';
import { BookingNavComponent }    from '../../layout/booking-nav/booking-nav.component';
import { BookingFooterComponent } from '../../layout/booking-footer/booking-footer.component';
import { CurrencyFormatPipe }     from '../../../../../shared/pipes/pipes';

/**
 * Booking — Template 1 — Home
 *
 * Structure takes cues from a reference clinic-booking marketplace site
 * (search-driven hero with floating trust badges, how-it-works steps, FAQ)
 * but adapted for Launchly's model: ONE business's own booking site, not a
 * multi-provider marketplace — so no location search, no fabricated
 * "500+ providers" stats or fake testimonials. Everything shown is either
 * real tenant data or a generic, honest guarantee ("instant confirmation",
 * "free rescheduling") rather than an invented number.
 *
 * Bilingual EN/AR + RTL via BookingTranslationService.
 */
@Component({
  selector: 'app-booking-minimal-home',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    BookingNavComponent, BookingFooterComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col overflow-x-clip">
      <app-booking-nav />

      <!-- ══════════════════════════════════════════════════════════
           HERO — search + floating trust badges
      ══════════════════════════════════════════════════════════ -->
      <section class="relative overflow-hidden">
        <div class="pointer-events-none absolute inset-0 bg-tenant-mesh"></div>

        <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24
                    grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">

          <!-- Copy + search -->
          <div class="lg:col-span-3">
            <span class="inline-flex items-center gap-2 mb-6">
              <span class="w-1.5 h-1.5 rounded-full" style="background: var(--tenant-primary);"></span>
              <span class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3">
                {{ i18n.t('hero.kicker') }}
              </span>
            </span>

            <h1 class="font-display font-semibold text-sf-text-1 text-4xl sm:text-6xl leading-[1.05] mb-6">
              {{ tenant()?.storeName ?? 'Book with us' }}
            </h1>

            @if (tenant()?.heroText) {
              <p class="text-sf-text-2 text-lg leading-relaxed max-w-xl mb-8">
                {{ tenant()!.heroText }}
              </p>
            }

            <!-- Search bar -->
            <form
              (submit)="onSearch($event)"
              class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl sm:rounded-full
                     border border-sf-border bg-sf-bg p-2 shadow-tenant-glow max-w-lg mb-5"
            >
              <div class="flex flex-1 items-center gap-2 px-4 py-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4 text-sf-text-3 flex-shrink-0">
                  <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                </svg>
                <input
                  [(ngModel)]="query" name="query"
                  class="w-full bg-transparent text-sm outline-none placeholder:text-sf-text-3 text-sf-text-1"
                  [placeholder]="i18n.t('hero.search.placeholder')"
                />
              </div>
              <button type="submit"
                class="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white
                       bg-tenant-gradient transition-opacity hover:opacity-90">
                {{ i18n.t('hero.search.button') }}
              </button>
            </form>

            @if (popularServices().length) {
              <div class="flex flex-wrap items-center gap-2 text-sm text-sf-text-3 mb-8">
                <span class="font-medium">{{ i18n.t('hero.popular') }}:</span>
                @for (s of popularServices(); track s.id) {
                  <button type="button" (click)="goToService(s)"
                    class="rounded-full border border-sf-border px-3 py-1 text-xs transition-colors
                           hover:border-tenant-primary/60 hover:text-sf-text-1">
                    {{ s.name }}
                  </button>
                }
              </div>
            }

            <div class="flex flex-wrap items-center gap-3">
              <a routerLink="/services"
                 class="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white
                        bg-tenant-gradient shadow-tenant-glow transition-transform hover:-translate-y-0.5">
                {{ i18n.t('hero.cta.book') }}
              </a>
              <a href="#how-it-works"
                 class="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold
                        text-sf-text-1 border border-sf-border hover:border-sf-border-2 transition-colors">
                {{ i18n.t('hero.cta.services') }}
              </a>
            </div>
          </div>

          <!-- Floating badges around a soft placeholder panel -->
          <div class="hidden lg:block lg:col-span-2 relative h-[420px]">
            <div class="absolute inset-8 rounded-[2rem]"
                 style="background: linear-gradient(160deg, color-mix(in srgb, var(--tenant-primary) 18%, transparent), transparent);">
            </div>

            <div class="absolute top-6 end-2 z-10 flex items-center gap-2 rounded-xl bg-sf-bg px-3 py-2 shadow-tenant-glow border border-sf-border">
              <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: color-mix(in srgb, var(--tenant-primary) 15%, transparent);">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--tenant-primary)" stroke-width="2" class="w-4 h-4">
                  <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-[10px] text-sf-text-3">{{ i18n.t('hero.badge.status') }}</p>
                <p class="text-xs font-bold" style="color: var(--tenant-primary);">{{ i18n.t('hero.badge.verified') }}</p>
              </div>
            </div>

            <div class="float-slow absolute top-1/3 start-0 z-10 w-56 rounded-xl bg-sf-bg p-3 shadow-tenant-glow border border-sf-border">
              <div class="flex items-start gap-2">
                <div class="rounded-full p-1.5" style="background: color-mix(in srgb, var(--tenant-primary) 15%, transparent);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--tenant-primary)" stroke-width="2" class="w-4 h-4">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-sf-text-1">{{ i18n.t('hero.badge.confirmed.title') }}</p>
                  <p class="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold" style="color: var(--tenant-primary);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    {{ i18n.t('hero.badge.confirmed.time') }}
                  </p>
                </div>
              </div>
            </div>

            <div class="float-slower absolute bottom-8 end-4 z-10 flex items-center gap-2 rounded-xl bg-sf-bg px-3 py-2 shadow-tenant-glow border border-sf-border">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--tenant-primary)" stroke-width="1.8" class="w-4 h-4">
                <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
              </svg>
              <span class="text-xs font-semibold text-sf-text-1">{{ i18n.t('hero.trust.confirmed') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           TRUST STRIP
      ══════════════════════════════════════════════════════════ -->
      <section class="border-y border-sf-border bg-sf-surface">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          @for (item of trustItems(); track item.key) {
            <div class="flex items-center gap-2 justify-center sm:justify-start text-sm text-sf-text-2">
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background: var(--tenant-primary);"></span>
              {{ item.label }}
            </div>
          }
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           HOW IT WORKS
      ══════════════════════════════════════════════════════════ -->
      <section id="how-it-works" class="mx-auto max-w-6xl w-full px-4 sm:px-6 py-16 sm:py-24">
        <div class="text-center mb-14">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            {{ i18n.t('how.kicker') }}
          </p>
          <h2 class="font-display font-medium text-sf-text-1 text-3xl sm:text-4xl">
            {{ i18n.t('how.title') }}
          </h2>
        </div>

        <div class="relative grid grid-cols-1 md:grid-cols-3 gap-10">
          <div class="hidden md:block absolute top-11 inset-x-0 h-px"
               style="background-image: repeating-linear-gradient(to right, var(--color-sf-border) 0 8px, transparent 8px 16px);"></div>

          @for (step of howSteps(); track step.n) {
            <div class="relative text-center">
              <div class="relative mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full
                          border border-sf-border bg-sf-bg shadow-tenant-glow">
                <span class="font-display font-bold text-2xl" style="color: var(--tenant-primary);">{{ step.n }}</span>
              </div>
              <h3 class="font-display text-lg text-sf-text-1 mt-5 mb-1.5">{{ step.title }}</h3>
              <p class="text-sf-text-3 text-sm leading-relaxed max-w-xs mx-auto">{{ step.desc }}</p>
            </div>
          }
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           SERVICES
      ══════════════════════════════════════════════════════════ -->
      <section id="services" class="mx-auto max-w-5xl w-full px-4 sm:px-6 py-16 sm:py-24 border-t border-sf-border">
        <div class="text-center mb-12">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            {{ i18n.t('services.kicker') }}
          </p>
          <h2 class="font-display font-medium text-sf-text-1 text-3xl sm:text-4xl">
            {{ i18n.t('services.title') }}
          </h2>
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (_ of [1,2,3]; track $index) {
              <div class="rounded-2xl bg-sf-surface animate-pulse h-48"></div>
            }
          </div>
        } @else if (services().length) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (svc of services().slice(0, 6); track svc.id) {
              <div class="rounded-2xl border border-sf-border bg-sf-surface p-6 flex flex-col
                          hover:border-tenant-primary/40 hover:shadow-tenant-glow transition-all">
                <h3 class="font-display text-lg text-sf-text-1 mb-2">{{ svc.name }}</h3>
                @if (svc.description) {
                  <p class="text-sf-text-3 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">{{ svc.description }}</p>
                }
                <div class="flex items-center justify-between mt-auto pt-3 border-t border-sf-border">
                  <span class="text-xs text-sf-text-3">{{ svc.durationMins }} {{ i18n.t('services.duration') }}</span>
                  <span class="font-bold text-sm" style="color: var(--tenant-primary);">
                    {{ svc.price | currencyFormat }}
                  </span>
                </div>
                <a [routerLink]="['/services']" [queryParams]="{ serviceId: svc.id }"
                   class="mt-4 w-full inline-flex items-center justify-center h-10 rounded-xl text-white font-bold text-sm
                          bg-tenant-gradient hover:shadow-tenant-glow transition-shadow">
                  {{ i18n.t('services.bookBtn') }}
                </a>
              </div>
            }
          </div>
          <div class="text-center mt-10">
            <a routerLink="/services" class="text-sm font-semibold hover:opacity-75 transition-opacity"
               style="color: var(--tenant-primary);">
              {{ i18n.t('services.viewAll') }} →
            </a>
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-sf-border-2 py-16 text-center">
            <p class="text-sf-text-3 text-sm">{{ i18n.t('services.empty') }}</p>
          </div>
        }
      </section>

      @if (tenant()?.aboutText) {
        <section id="about" class="border-t border-sf-border py-16 sm:py-20" aria-label="About">
          <div class="mx-auto max-w-2xl px-4 sm:px-6 text-center">
            <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-4">
              {{ i18n.t('about.kicker') }}
            </p>
            <p class="font-display text-2xl sm:text-3xl leading-snug text-sf-text-1">
              {{ tenant()!.aboutText }}
            </p>
          </div>
        </section>
      }

      <!-- ══════════════════════════════════════════════════════════
           FAQ
      ══════════════════════════════════════════════════════════ -->
      <section class="mx-auto max-w-2xl w-full px-4 sm:px-6 py-16 sm:py-20 border-t border-sf-border">
        <h2 class="text-center font-display font-medium text-3xl text-sf-text-1 mb-10">
          {{ i18n.t('faq.title') }}
        </h2>
        <div class="space-y-2.5">
          @for (item of faqItems(); track item.q; let i = $index) {
            <div class="rounded-xl border border-sf-border bg-sf-surface overflow-hidden">
              <button type="button" (click)="toggleFaq(i)"
                class="w-full flex items-center justify-between gap-4 px-5 py-4 text-start font-semibold text-sf-text-1
                       hover:bg-sf-bg/50 transition-colors">
                <span>{{ item.q }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--tenant-primary)" stroke-width="2"
                     class="w-4 h-4 flex-shrink-0 transition-transform" [class.rotate-45]="openFaq() === i">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
              @if (openFaq() === i) {
                <p class="px-5 pb-4 text-sm text-sf-text-3 leading-relaxed">{{ item.a }}</p>
              }
            </div>
          }
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           CTA
      ══════════════════════════════════════════════════════════ -->
      <section class="mx-auto max-w-6xl w-full px-4 sm:px-6 pb-6">
        <div class="rounded-3xl bg-tenant-gradient p-10 md:p-16 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-tenant-mesh opacity-40"></div>
          <div class="relative text-white max-w-xl mx-auto">
            <h2 class="font-display font-medium text-3xl md:text-4xl mb-3">{{ i18n.t('cta.title') }}</h2>
            <p class="opacity-90 mb-8">{{ i18n.t('cta.subtitle') }}</p>
            <a routerLink="/services"
               class="inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold bg-white transition-opacity hover:opacity-90"
               style="color: var(--tenant-primary);">
              {{ i18n.t('cta.button') }}
            </a>
          </div>
        </div>
      </section>

      <app-booking-footer />
    </div>

    <style>
      .float-slow  { animation: floatY 5s ease-in-out infinite; }
      .float-slower{ animation: floatY 6.5s ease-in-out infinite .8s; }
      @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @media (prefers-reduced-motion: reduce) { .float-slow, .float-slower { animation: none; } }
    </style>
  `,
})
export class BookingMinimalHomeComponent implements OnInit {
  private readonly bookingSvc = inject(BookingStoreService);
  private readonly router     = inject(Router);
  readonly tenant  = inject(TenantService).currentTenant;
  readonly i18n    = inject(BookingTranslationService);

  readonly services = signal<IPublicService[]>([]);
  readonly loading  = signal(true);
  query = '';
  readonly openFaq  = signal<number | null>(0);

  readonly popularServices = () => this.services().slice(0, 4);

  readonly trustItems = () => [
    { key: 'secure',   label: this.i18n.t('trust.secure') },
    { key: 'instant',  label: this.i18n.t('trust.instant') },
    { key: 'reschedule', label: this.i18n.t('trust.reschedule') },
    { key: 'verified', label: this.i18n.t('trust.verified') },
  ];

  readonly howSteps = () => [
    { n: 1, title: this.i18n.t('how.step1.title'), desc: this.i18n.t('how.step1.desc') },
    { n: 2, title: this.i18n.t('how.step2.title'), desc: this.i18n.t('how.step2.desc') },
    { n: 3, title: this.i18n.t('how.step3.title'), desc: this.i18n.t('how.step3.desc') },
  ];

  readonly faqItems = () => [
    { q: this.i18n.t('faq.q1'), a: this.i18n.t('faq.a1') },
    { q: this.i18n.t('faq.q2'), a: this.i18n.t('faq.a2') },
    { q: this.i18n.t('faq.q3'), a: this.i18n.t('faq.a3') },
  ];

  ngOnInit(): void {
    this.bookingSvc.getServices().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) this.services.set(res.data.filter(s => s.isActive));
      },
      error: () => this.loading.set(false),
    });
  }

  toggleFaq(i: number): void {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  onSearch(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/services'], { queryParams: { q: this.query || null } });
  }

  goToService(svc: IPublicService): void {
    this.router.navigate(['/services'], { queryParams: { serviceId: svc.id } });
  }
}
