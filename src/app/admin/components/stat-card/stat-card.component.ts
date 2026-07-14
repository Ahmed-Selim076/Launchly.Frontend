import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

/**
 * Trend indicator shown under the value — purely presentational input,
 * the consumer computes the percentage from whatever period comparison
 * makes sense (e.g. this week vs last week).
 */
export interface IStatTrend {
  /** Signed percentage, e.g. 12.4 or -3.1. Sign alone decides up/down + color. */
  value: number;
  /** Optional context label, e.g. "vs last week". */
  label?: string;
}

/**
 * StatCardComponent — Admin dashboard stat tile.
 *
 * Presentational only: takes a final numeric `value` and animates it in with
 * `CountUpDirective` once it scrolls into view. Does NOT fetch or know about
 * any data source — the parent (DashboardComponent) is responsible for
 * resolving the right numbers per StoreType.
 *
 * `prefix`/`suffix` are rendered as separate sibling elements (NOT inside the
 * count-up host) because CountUpDirective overwrites its host's textContent
 * directly — putting a prefix in the same element would get wiped out.
 *
 * Always uses `ad-*` (espresso/dark) tokens — this component only ever lives
 * inside the admin shell.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CountUpDirective, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg bg-ad-surface border border-ad-border p-5 flex items-center gap-4">

      <!-- Loading skeleton state -->
      @if (loading) {
        <app-skeleton variant="avatar" [dark]="true" />
        <div class="flex-1 min-w-0 space-y-2">
          <app-skeleton variant="text" width="60%" [dark]="true" />
          <app-skeleton variant="text" width="40%" height="1.5rem" [dark]="true" />
        </div>
      } @else {

        <!-- Icon -->
        @if (icon) {
          <div
            class="w-11 h-11 rounded-md bg-ad-surface-2 flex items-center justify-center
                   text-[var(--color-accent)] flex-shrink-0"
            aria-hidden="true"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.75"
                 stroke-linecap="round" stroke-linejoin="round">
              <path [attr.d]="icon" />
            </svg>
          </div>
        }

        <div class="flex-1 min-w-0">
          <p class="text-ad-text-3 text-sm truncate">{{ label }}</p>

          <p
            class="font-display text-2xl font-bold text-ad-text-1 flex items-baseline gap-0.5 mt-0.5"
            [attr.aria-label]="prefix + value + suffix"
          >
            @if (prefix) { <span aria-hidden="true">{{ prefix }}</span> }
            <span [appCountUp]="value" aria-hidden="true">0</span>
            @if (suffix) { <span aria-hidden="true">{{ suffix }}</span> }
          </p>

          @if (trend) {
            <p
              class="text-xs font-medium flex items-center gap-1 mt-1.5"
              [class.text-[var(--color-success)]]="trend.value >= 0"
              [class.text-[var(--color-danger)]]="trend.value < 0"
            >
              <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path [attr.d]="trend.value >= 0 ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'" />
              </svg>
              <span>{{ trend.value >= 0 ? '+' : '' }}{{ trend.value }}%</span>
              @if (trend.label) {
                <span class="text-ad-text-3 font-normal">{{ trend.label }}</span>
              }
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class StatCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = 0;
  @Input() prefix = '';
  @Input() suffix = '';
  /** Lucide-compatible SVG path `d` value — same convention as Sidebar/Topbar. */
  @Input() icon = '';
  @Input() trend: IStatTrend | null = null;
  @Input() loading = false;
}
