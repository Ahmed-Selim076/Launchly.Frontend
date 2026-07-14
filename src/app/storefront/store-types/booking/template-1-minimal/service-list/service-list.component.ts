import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  BookingStoreService,
  IPublicService,
}                              from '../../../../../core/storefront/booking-store.service';
import { BookingTranslationService } from '../../../../../core/storefront/booking-translation.service';
import { BookingNavComponent }   from '../../layout/booking-nav/booking-nav.component';
import { BookingFooterComponent} from '../../layout/booking-footer/booking-footer.component';
import { CurrencyFormatPipe }  from '../../../../../shared/pipes/pipes';

type SortKey = 'relevance' | 'priceAsc' | 'priceDesc' | 'duration' | 'name';

const RECENT_KEY = 'launchly_booking_recent_searches';

/**
 * Booking — Template 1 — Service List (/services)
 *
 * Bilingual (EN/AR + RTL), list-item cards with photo (adapted from a
 * reference clinic-marketplace's doctor list — genericized: no ratings/
 * fabricated review counts since this isn't a marketplace and we don't
 * have that data). Adds sort + recent-searches on top of the existing
 * client-side filter, and honors ?q= / ?serviceId= arriving from Home.
 */
@Component({
  selector: 'app-booking-minimal-service-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    BookingNavComponent, BookingFooterComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg">
      <app-booking-nav />

      <main class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">

        <!-- ── Header ── -->
        <div class="mb-8">
          <h1 class="font-display font-semibold text-sf-text-1 text-3xl sm:text-4xl mb-1.5">
            {{ i18n.t('list.title') }}
          </h1>
          @if (!loading() && allServices().length > 0) {
            <p class="text-sf-text-3 text-sm">
              {{ allServices().length }}
              {{ allServices().length === 1 ? i18n.t('list.count.one') : i18n.t('list.count.many') }}
            </p>
          }
        </div>

        <!-- ── Search + sort ── -->
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
          <div class="relative flex-1">
            <svg class="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-text-3 pointer-events-none"
                 viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="6.5" cy="6.5" r="5"/><path d="M10.5 10.5L14 14" stroke-linecap="round"/>
            </svg>
            <input
              [formControl]="searchCtrl"
              type="search"
              [placeholder]="i18n.t('list.search.placeholder')"
              class="w-full ps-10 pe-4 py-2.5 bg-sf-surface border border-sf-border rounded-lg
                     text-sf-text-1 text-sm placeholder:text-sf-text-3
                     focus:outline-none focus:border-sf-border-2 transition-colors"
              (focus)="showRecent.set(true)"
              (blur)="onSearchBlur()"
            />

            @if (showRecent() && recentSearches().length && !searchCtrl.value) {
              <div class="absolute z-10 top-full mt-1.5 w-full rounded-lg border border-sf-border bg-sf-bg shadow-tenant-glow p-2">
                <div class="flex items-center justify-between px-2 pb-1.5">
                  <span class="text-[11px] font-medium text-sf-text-3 uppercase tracking-wide">{{ i18n.t('list.recent') }}</span>
                  <button type="button" (mousedown)="clearRecent()" class="text-[11px] text-sf-text-3 hover:text-sf-text-1">
                    {{ i18n.t('list.recent.clear') }}
                  </button>
                </div>
                @for (term of recentSearches(); track term) {
                  <button type="button" (mousedown)="searchCtrl.setValue(term)"
                    class="w-full text-start px-2 py-1.5 rounded-md text-sm text-sf-text-2 hover:bg-sf-surface transition-colors">
                    {{ term }}
                  </button>
                }
              </div>
            }
          </div>

          <select
            [formControl]="sortCtrl"
            class="rounded-lg border border-sf-border bg-sf-surface text-sf-text-1 text-sm px-3.5 py-2.5
                   focus:outline-none focus:border-sf-border-2"
          >
            <option value="relevance">{{ i18n.t('list.sort.relevance') }}</option>
            <option value="priceAsc">{{ i18n.t('list.sort.priceAsc') }}</option>
            <option value="priceDesc">{{ i18n.t('list.sort.priceDesc') }}</option>
            <option value="duration">{{ i18n.t('list.sort.duration') }}</option>
            <option value="name">{{ i18n.t('list.sort.name') }}</option>
          </select>
        </div>

        @if (searchCtrl.value) {
          <p class="text-xs text-sf-text-3 mb-6">
            {{ filtered().length }} {{ i18n.t('list.results.for') }} "{{ searchCtrl.value }}"
          </p>
        } @else {
          <div class="mb-6"></div>
        }

        <!-- ── Loading ── -->
        @if (loading()) {
          <div class="space-y-4">
            @for (_ of skeletons; track $index) {
              <div class="flex gap-4 rounded-xl border border-sf-border bg-sf-surface p-5 animate-pulse">
                <div class="h-20 w-20 rounded-lg bg-sf-surface-2 flex-shrink-0"></div>
                <div class="flex-1 space-y-2.5">
                  <div class="h-4 w-1/3 rounded bg-sf-surface-2"></div>
                  <div class="h-3 w-2/3 rounded bg-sf-surface-2"></div>
                  <div class="h-3 w-1/4 rounded bg-sf-surface-2"></div>
                </div>
              </div>
            }
          </div>

        } @else if (allServices().length === 0) {
          <div class="py-24 text-center">
            <p class="text-sf-text-1 font-semibold mb-2">{{ i18n.t('list.empty.title') }}</p>
            <p class="text-sf-text-3 text-sm">{{ i18n.t('list.empty.desc') }}</p>
          </div>

        } @else if (filtered().length === 0) {
          <div class="py-16 text-center">
            <p class="text-sf-text-1 font-semibold mb-2">{{ i18n.t('list.noResults.title') }}</p>
            <p class="text-sf-text-3 text-sm mb-5">
              {{ i18n.t('list.noResults.desc') }} "{{ searchCtrl.value }}".
            </p>
            <button type="button" (click)="searchCtrl.setValue('')"
              class="text-sm font-medium underline underline-offset-2 text-sf-text-3 hover:text-sf-text-1 transition-colors">
              {{ i18n.t('list.noResults.clear') }}
            </button>
          </div>

        } @else {
          <div class="space-y-4">
            @for (svc of filtered(); track svc.id) {
              <article
                [id]="'svc-' + svc.id"
                class="flex gap-4 sm:gap-5 rounded-xl border bg-sf-surface p-4 sm:p-5 transition-all duration-200 hover:shadow-md"
                [style.border-color]="highlightedId() === svc.id ? 'var(--tenant-primary)' : 'var(--color-sf-border)'"
                [style.box-shadow]="highlightedId() === svc.id ? '0 0 0 3px color-mix(in srgb, var(--tenant-primary) 20%, transparent)' : null"
              >
                <div class="h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden bg-sf-bg flex-shrink-0">
                  @if (svc.imageUrl) {
                    <img [src]="svc.imageUrl" [alt]="svc.name" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" class="w-7 h-7 text-sf-border-2">
                        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                      </svg>
                    </div>
                  }
                </div>

                <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <h2 class="font-display font-semibold text-sf-text-1 text-base sm:text-lg leading-snug mb-1">
                      {{ svc.name }}
                    </h2>
                    @if (svc.description) {
                      <p class="text-sf-text-3 text-sm leading-relaxed line-clamp-2 mb-2">{{ svc.description }}</p>
                    }
                    <span class="inline-flex items-center gap-1 text-xs text-sf-text-3">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5" stroke-linecap="round"/>
                      </svg>
                      {{ svc.durationMins }} {{ i18n.t('services.duration') }}
                    </span>
                  </div>

                  <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1.5 flex-shrink-0">
                    <span class="font-bold text-lg" style="color: var(--tenant-primary);">
                      {{ svc.price | currencyFormat }}
                    </span>
                    <a [routerLink]="['/book', svc.id]"
                       class="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold text-white
                              bg-tenant-gradient hover:shadow-tenant-glow transition-shadow whitespace-nowrap">
                      {{ i18n.t('list.bookNow') }}
                    </a>
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </main>

      <app-booking-footer />
    </div>
  `,
})
export class BookingMinimalServiceListComponent implements OnInit {

  private readonly bookingSvc = inject(BookingStoreService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  readonly i18n = inject(BookingTranslationService);

  readonly allServices = signal<IPublicService[]>([]);
  readonly loading     = signal(true);
  readonly skeletons   = Array(5);
  readonly highlightedId = signal<string | null>(null);
  readonly showRecent  = signal(false);
  readonly recentSearches = signal<string[]>(this.#loadRecent());

  readonly searchCtrl = new FormControl('');
  readonly sortCtrl   = new FormControl<SortKey>('relevance');

  readonly filtered = computed(() => {
    const q = (this.searchCtrl.value ?? '').toLowerCase().trim();
    let list = this.allServices();
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q)
      );
    }

    const sort = this.sortCtrl.value ?? 'relevance';
    if (sort === 'priceAsc')   return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc')  return [...list].sort((a, b) => b.price - a.price);
    if (sort === 'duration')   return [...list].sort((a, b) => a.durationMins - b.durationMins);
    if (sort === 'name')       return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const q = params.get('q');
    if (q) this.searchCtrl.setValue(q);
    this.highlightedId.set(params.get('serviceId'));

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(value => {
      if (value && value.trim().length > 1) this.#pushRecent(value.trim());
    });

    this.bookingSvc.getServices().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.allServices.set(res.data);
          const id = this.highlightedId();
          if (id) {
            setTimeout(() => {
              document.getElementById('svc-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
          }
        }
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchBlur(): void {
    // Small delay so a (mousedown) on a recent-search item still fires
    // before the dropdown is hidden by blur.
    setTimeout(() => this.showRecent.set(false), 150);
  }

  clearRecent(): void {
    this.recentSearches.set([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  }

  #pushRecent(term: string): void {
    const next = [term, ...this.recentSearches().filter(t => t !== term)].slice(0, 5);
    this.recentSearches.set(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  #loadRecent(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}
