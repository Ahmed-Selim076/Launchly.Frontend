import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

import {
  BookingStoreService,
  IPublicService,
  IAvailableSlot,
}                              from '../../../../../core/storefront/booking-store.service';
import { BookingTranslationService } from '../../../../../core/storefront/booking-translation.service';
import { BookingNavComponent }   from '../../layout/booking-nav/booking-nav.component';
import { BookingFooterComponent} from '../../layout/booking-footer/booking-footer.component';
import { CurrencyFormatPipe }  from '../../../../../shared/pipes/pipes';

/**
 * Phase 6 — Booking Storefront, Template 1 (Editorial)
 * Booking Calendar Page  (/book/:serviceId)
 *
 * Layout philosophy (Editorial — centred, whitespace-forward):
 *   - Two-column layout on md+: left = mini calendar, right = time slots
 *   - Calendar renders current month with navigation (prev/next)
 *   - Only future dates (today inclusive) are selectable
 *   - On date pick → calls getAvailableSlots(serviceId, date)
 *     date is formatted as "YYYY-MM-DD" (date-only, no time component)
 *     per BookingStoreController comment & [FromQuery] DateTime date binding
 *   - Slots returned as IAvailableSlot[]  { startTime: string, endTime: string }
 *     both are ISO datetime strings (DateTime on the server → serialised as full ISO)
 *   - Selecting a slot navigates to /book/:serviceId/confirm?slot=<ISO startTime>
 *   - Loading / empty-state / error-state handled consistently with service-list
 */

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-booking-editorial-calendar',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    BookingNavComponent, BookingFooterComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg">
      <app-booking-nav />

      <main class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">

        <!-- ══════════════════════════════════════════════════════════════
             BACK LINK
        ══════════════════════════════════════════════════════════════ -->
        <a
          routerLink="/services"
          class="inline-flex items-center gap-1.5 text-sm text-sf-text-3
                 hover:text-sf-text-1 transition-colors mb-8 group"
        >
          <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
               [style.transform]="i18n.isRtl() ? 'scaleX(-1)' : null"
               viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10 3L5 8l5 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ i18n.t('cal.back') }}
        </a>

        <!-- ══════════════════════════════════════════════════════════════
             SERVICE HEADER
        ══════════════════════════════════════════════════════════════ -->
        @if (serviceLoading()) {
          <div class="mb-10 space-y-2 animate-pulse">
            <div class="h-8 bg-sf-surface-2 rounded w-56"></div>
            <div class="h-4 bg-sf-surface-2 rounded w-80"></div>
          </div>
        } @else if (service()) {
          <div class="mb-10">
            <h1 class="font-display font-black text-sf-text-1
                       text-3xl sm:text-4xl tracking-tight mb-1">
              {{ service()!.name }}
            </h1>
            <div class="flex flex-wrap items-center gap-3 text-sm text-sf-text-3">
              <span class="inline-flex items-center gap-1">
                <!-- clock icon -->
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" stroke-width="1.5">
                  <circle cx="8" cy="8" r="6.5"/>
                  <path d="M8 4.5V8l2.5 1.5" stroke-linecap="round"/>
                </svg>
                {{ service()!.durationMins }} {{ i18n.t('services.duration') }}
              </span>
              <span class="text-sf-border">•</span>
              <span class="font-semibold text-sf-text-1">
                {{ service()!.price | currencyFormat }}
              </span>
            </div>
          </div>
        } @else if (serviceError()) {
          <div class="mb-10 p-4 rounded-lg bg-sf-surface border border-sf-border">
            <p class="text-sf-text-1 font-semibold text-sm">{{ i18n.t('cal.serviceError') }}</p>
          </div>
        }

        <!-- ══════════════════════════════════════════════════════════════
             STEP LABEL
        ══════════════════════════════════════════════════════════════ -->
        <p class="text-xs font-semibold uppercase tracking-widest text-sf-text-3 mb-6"
           style="letter-spacing: .12em;">
          {{ i18n.t('cal.step') }}
        </p>

        <!-- ══════════════════════════════════════════════════════════════
             CALENDAR + SLOTS — two-col on md+
        ══════════════════════════════════════════════════════════════ -->
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 lg:gap-12">

          <!-- ─── LEFT: Mini Calendar ──────────────────────────────── -->
          <div class="bg-sf-surface rounded-xl border border-sf-border p-6">

            <!-- Month navigation -->
            <div class="flex items-center justify-between mb-6">
              <button
                type="button"
                (click)="prevMonth()"
                [disabled]="cannotGoPrev()"
                class="p-2 rounded-lg hover:bg-sf-surface-2 disabled:opacity-30
                       disabled:cursor-not-allowed transition-colors"
                aria-label="Previous month"
              >
                <svg class="w-4 h-4 text-sf-text-1" [style.transform]="i18n.isRtl() ? 'scaleX(-1)' : null"
                     viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" stroke-width="1.5">
                  <path d="M10 3L5 8l5 5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <span class="font-semibold text-sf-text-1 text-sm">
                {{ monthLabel() }}
              </span>

              <button
                type="button"
                (click)="nextMonth()"
                class="p-2 rounded-lg hover:bg-sf-surface-2 transition-colors"
                aria-label="Next month"
              >
                <svg class="w-4 h-4 text-sf-text-1" [style.transform]="i18n.isRtl() ? 'scaleX(-1)' : null"
                     viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" stroke-width="1.5">
                  <path d="M6 3l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <!-- Weekday headers -->
            <div class="grid grid-cols-7 mb-2">
              @for (d of weekdays(); track d) {
                <div class="text-center text-[10px] font-semibold text-sf-text-3
                            uppercase tracking-wide py-1">
                  {{ d }}
                </div>
              }
            </div>

            <!-- Day cells -->
            <div class="grid grid-cols-7 gap-y-1">
              @for (day of calendarDays(); track day.date.toISOString()) {
                <button
                  type="button"
                  (click)="selectDate(day)"
                  [disabled]="day.isPast || !day.isCurrentMonth"
                  [attr.aria-label]="day.date | date:'MMMM d, yyyy'"
                  [attr.aria-pressed]="day.isSelected"
                  class="aspect-square flex items-center justify-center rounded-lg
                         text-sm transition-all duration-100 select-none
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-offset-1"
                  [class]="dayCellClass(day)"
                  [style.background]="day.isSelected ? 'var(--tenant-primary, #C1522A)' : ''"
                >
                  {{ day.dayOfMonth }}
                </button>
              }
            </div>

          </div><!-- /calendar -->

          <!-- ─── RIGHT: Time Slots ─────────────────────────────────── -->
          <div>

            @if (!selectedDate()) {
              <!-- No date chosen yet -->
              <div class="h-full flex flex-col items-center justify-center
                          py-16 text-center">
                <div class="w-12 h-12 rounded-full bg-sf-surface-2 flex items-center
                            justify-center mb-4">
                  <svg class="w-6 h-6 text-sf-text-3" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round"/>
                  </svg>
                </div>
                <p class="text-sf-text-1 font-semibold mb-1">{{ i18n.t('cal.pickDate.title') }}</p>
                <p class="text-sf-text-3 text-sm">
                  {{ i18n.t('cal.pickDate.desc') }}
                </p>
              </div>

            } @else if (slotsLoading()) {
              <!-- Loading slots -->
              <div>
                <p class="text-sm font-semibold text-sf-text-1 mb-4">
                  {{ fmtDay(selectedDate()!) }}
                </p>
                <div class="grid grid-cols-2 gap-3">
                  @for (_ of skeletons; track $index) {
                    <div class="h-11 bg-sf-surface rounded-lg animate-pulse"></div>
                  }
                </div>
              </div>

            } @else if (slotsError()) {
              <!-- Error loading slots -->
              <div class="py-10 text-center">
                <p class="text-sf-text-1 font-semibold mb-2">{{ i18n.t('cal.slotsError.title') }}</p>
                <p class="text-sf-text-3 text-sm mb-5">
                  {{ i18n.t('cal.slotsError.desc') }}
                </p>
                <button
                  type="button"
                  (click)="retrySlots()"
                  class="text-sm font-medium underline underline-offset-2 text-sf-text-3
                         hover:text-sf-text-1 transition-colors"
                >
                  {{ i18n.t('cal.retry') }}
                </button>
              </div>

            } @else if (slots().length === 0) {
              <!-- No slots available -->
              <div class="py-10 text-center">
                <p class="text-sf-text-1 font-semibold mb-2">{{ i18n.t('cal.noAvail.title') }}</p>
                <p class="text-sf-text-3 text-sm">
                  {{ i18n.t('cal.noAvail.desc') }} {{ fmtDay(selectedDate()!, true) }}.
                  {{ i18n.t('cal.noAvail.tryOther') }}
                </p>
              </div>

            } @else {
              <!-- Slot grid -->
              <div>
                <p class="text-sm font-semibold text-sf-text-1 mb-4">
                  {{ fmtDay(selectedDate()!) }}
                  <span class="font-normal text-sf-text-3 ms-1">
                    — {{ slots().length }} {{ slots().length === 1 ? i18n.t('cal.slotCount.one') : i18n.t('cal.slotCount.many') }}
                  </span>
                </p>

                <div class="grid grid-cols-2 gap-3">
                  @for (slot of slots(); track slot.startTime) {
                    <button
                      type="button"
                      (click)="selectSlot(slot)"
                      [attr.aria-pressed]="selectedSlot()?.startTime === slot.startTime"
                      class="h-11 rounded-lg border text-sm font-medium transition-all
                             duration-150 active:scale-95 focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-offset-1"
                      [class]="slotBtnClass(slot)"
                      [style.background]="selectedSlot()?.startTime === slot.startTime ? 'var(--tenant-primary, #C1522A)' : ''"
                      [style.borderColor]="selectedSlot()?.startTime === slot.startTime ? 'var(--tenant-primary, #C1522A)' : ''"
                    >
                      {{ fmtTime(slot.startTime) }}
                    </button>
                  }
                </div>

                <!-- Confirm CTA -->
                @if (selectedSlot()) {
                  <div class="mt-8 pt-6 border-t border-sf-border">
                    <div class="flex items-start justify-between gap-3 mb-5 text-sm">
                      <div>
                        <p class="text-sf-text-3">{{ i18n.t('cal.selectedTime') }}</p>
                        <p class="font-semibold text-sf-text-1 mt-0.5">
                          {{ fmtDay(toDate(selectedSlot()!.startTime)) }}
                          {{ i18n.t('cal.at') }} {{ fmtTime(selectedSlot()!.startTime) }}
                        </p>
                      </div>
                      <button
                        type="button"
                        (click)="selectedSlot.set(null)"
                        class="text-sf-text-3 hover:text-sf-text-1 transition-colors
                               text-xs underline underline-offset-2 mt-0.5 shrink-0"
                      >
                        {{ i18n.t('cal.change') }}
                      </button>
                    </div>

                    <button
                      type="button"
                      (click)="confirmBooking()"
                      class="block w-full py-3 text-sm font-semibold rounded-md
                             text-white transition-all duration-150 active:scale-95"
                      style="background: var(--tenant-primary, #C1522A);"
                      (mouseenter)="confirmHover = true"
                      (mouseleave)="confirmHover = false"
                      [style.filter]="confirmHover ? 'brightness(0.9)' : ''"
                    >
                      {{ i18n.t('cal.continue') }}
                    </button>
                  </div>
                }

              </div>
            }

          </div><!-- /slots -->

        </div><!-- /grid -->

      </main>

      <app-booking-footer />
    </div>
  `,
})
export class BookingEditorialCalendarComponent implements OnInit {

  private readonly bookingSvc = inject(BookingStoreService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  readonly i18n = inject(BookingTranslationService);

  // ─── Service meta ─────────────────────────────────────────────────────────
  readonly service        = signal<IPublicService | null>(null);
  readonly serviceLoading = signal(true);
  readonly serviceError   = signal(false);

  private serviceId!: string;

  // ─── Calendar state ───────────────────────────────────────────────────────
  private readonly today = new Date();
  private viewYear  = signal(this.today.getFullYear());
  private viewMonth = signal(this.today.getMonth()); // 0-indexed

  readonly weekdays = computed(() => {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    // Sunday-first, matching the calendar grid's day-of-week ordering.
    return [0, 1, 2, 3, 4, 5, 6].map(i => fmt.format(new Date(2023, 0, 1 + i)));
  });
  readonly skeletons = Array(6);

  readonly selectedDate = signal<Date | null>(null);

  // ─── Slot state ───────────────────────────────────────────────────────────
  readonly slots        = signal<IAvailableSlot[]>([]);
  readonly slotsLoading = signal(false);
  readonly slotsError   = signal(false);
  readonly selectedSlot = signal<IAvailableSlot | null>(null);

  // ─── Confirm hover (inline style trick — no ng-class needed) ─────────────
  confirmHover = false;

  // ─── Computed: month label ────────────────────────────────────────────────
  readonly monthLabel = computed(() => {
    const d = new Date(this.viewYear(), this.viewMonth(), 1);
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  });

  // ─── Computed: can we go to previous month? ───────────────────────────────
  readonly cannotGoPrev = computed(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    return y === this.today.getFullYear() && m <= this.today.getMonth();
  });

  // ─── Computed: calendar grid (6 rows × 7 cols) ───────────────────────────
  readonly calendarDays = computed((): CalendarDay[] => {
    const year  = this.viewYear();
    const month = this.viewMonth();
    const sel   = this.selectedDate();
    const todayMidnight = this._midnight(this.today);

    const firstOfMonth  = new Date(year, month, 1);
    const startPadding  = firstOfMonth.getDay(); // Sun = 0

    const days: CalendarDay[] = [];

    // Padding from previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(this._makeDay(date, false, todayMidnight, sel));
    }

    // Current month days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push(this._makeDay(date, true, todayMidnight, sel));
    }

    // Padding to fill remaining cells (always show 6 rows = 42 cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push(this._makeDay(date, false, todayMidnight, sel));
    }

    return days;
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('serviceId') ?? '';

    this.bookingSvc.getServiceById(this.serviceId).subscribe({
      next: res => {
        this.serviceLoading.set(false);
        if (res.success && res.data) this.service.set(res.data);
        else this.serviceError.set(true);
      },
      error: () => {
        this.serviceLoading.set(false);
        this.serviceError.set(true);
      },
    });
  }

  // ─── Locale-aware date/time formatting ──────────────────────────────────
  // Angular's DatePipe reads a static app-wide LOCALE_ID, which doesn't
  // follow this page's runtime EN/AR toggle — so dates here are formatted
  // directly with Intl, keyed off i18n.locale(), instead.

  toDate(iso: string): Date { return new Date(iso); }

  fmtDay(date: Date, shortMonthDay = false): string {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    return date.toLocaleDateString(locale,
      shortMonthDay ? { month: 'long', day: 'numeric' }
                    : { weekday: 'long', month: 'long', day: 'numeric' });
  }

  fmtTime(iso: string): string {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }

  // ─── Calendar navigation ──────────────────────────────────────────────────
  prevMonth(): void {
    if (this.cannotGoPrev()) return;
    if (this.viewMonth() === 0) {
      this.viewYear.set(this.viewYear() - 1);
      this.viewMonth.set(11);
    } else {
      this.viewMonth.set(this.viewMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewYear.set(this.viewYear() + 1);
      this.viewMonth.set(0);
    } else {
      this.viewMonth.set(this.viewMonth() + 1);
    }
  }

  // ─── Date selection ───────────────────────────────────────────────────────
  selectDate(day: CalendarDay): void {
    if (day.isPast || !day.isCurrentMonth) return;
    this.selectedDate.set(day.date);
    this.selectedSlot.set(null);
    this.loadSlots(day.date);
  }

  // ─── Slot loading ─────────────────────────────────────────────────────────
  private loadSlots(date: Date): void {
    this.slotsLoading.set(true);
    this.slotsError.set(false);
    this.slots.set([]);

    // Format as "YYYY-MM-DD" — what the controller expects as [FromQuery] DateTime date
    const dateStr = this._toDateOnlyString(date);

    this.bookingSvc.getAvailableSlots(this.serviceId, dateStr).subscribe({
      next: res => {
        this.slotsLoading.set(false);
        if (res.success && res.data) this.slots.set(res.data);
        else this.slotsError.set(true);
      },
      error: () => {
        this.slotsLoading.set(false);
        this.slotsError.set(true);
      },
    });
  }

  retrySlots(): void {
    if (this.selectedDate()) this.loadSlots(this.selectedDate()!);
  }

  // ─── Slot selection ───────────────────────────────────────────────────────
  selectSlot(slot: IAvailableSlot): void {
    this.selectedSlot.set(
      this.selectedSlot()?.startTime === slot.startTime ? null : slot
    );
  }

  // ─── Confirm → navigate to /book/:serviceId/confirm ──────────────────────
  confirmBooking(): void {
    const slot = this.selectedSlot();
    if (!slot) return;
    this.router.navigate(
      ['/book', this.serviceId, 'confirm'],
      { queryParams: { slot: slot.startTime } },
    );
  }

  // ─── CSS helpers ─────────────────────────────────────────────────────────

  dayCellClass(day: CalendarDay): string {
    if (!day.isCurrentMonth || day.isPast) {
      return 'text-sf-text-3 opacity-25 cursor-not-allowed';
    }
    if (day.isSelected) {
      return 'text-white font-semibold cursor-pointer';
    }
    if (day.isToday) {
      return 'font-semibold text-sf-text-1 ring-1 ring-inset hover:bg-sf-surface-2 cursor-pointer';
    }
    return 'text-sf-text-1 hover:bg-sf-surface-2 cursor-pointer';
  }

  slotBtnClass(slot: IAvailableSlot): string {
    const isSelected = this.selectedSlot()?.startTime === slot.startTime;
    if (isSelected) {
      return 'text-white border-transparent';
    }
    return 'bg-sf-surface text-sf-text-1 border-sf-border hover:border-sf-border-2 hover:bg-sf-surface-2';
  }

  // ─── Private helpers ──────────────────────────────────────────────────────
  private _midnight(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private _makeDay(
    date: Date,
    isCurrentMonth: boolean,
    todayMidnight: Date,
    sel: Date | null,
  ): CalendarDay {
    const midnight = this._midnight(date);
    return {
      date,
      dayOfMonth:     date.getDate(),
      isCurrentMonth,
      isPast:         midnight < todayMidnight,
      isToday:        midnight.getTime() === todayMidnight.getTime(),
      isSelected:     sel ? midnight.getTime() === this._midnight(sel).getTime() : false,
    };
  }

  private _toDateOnlyString(d: Date): string {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
}
