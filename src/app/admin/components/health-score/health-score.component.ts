import {
  Component, ChangeDetectionStrategy, Input, OnChanges,
  SimpleChanges, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOnboardingStatus } from '../../../core/models';

// ─── Health Score Formula (agreed in project plan) ───────────────────────────
//
//   25% — Store Identity    : logo_uploaded complete
//   35% — Catalog readiness : product_created OR service_created OR menu_item_created
//   40% — First real activity: first_order OR first_appointment
//
// Note: email_verified is shown in the checklist but intentionally excluded
// from the score — it's a prerequisite/gate, not a store quality signal.
// The backend resolves which catalog/activity key applies per StoreType;
// the frontend simply checks those key names regardless of which ones came back.

const CATALOG_KEYS  = new Set(['product_created', 'service_created', 'menu_item_created']);
const ACTIVITY_KEYS = new Set(['first_order', 'first_appointment']);

interface ScoreBreakdown {
  identity:  { earned: number; max: number; done: boolean };
  catalog:   { earned: number; max: number; done: boolean };
  activity:  { earned: number; max: number; done: boolean };
  total:     number;
}

function computeScore(status: IOnboardingStatus | null): ScoreBreakdown {
  if (!status) {
    return {
      identity: { earned: 0, max: 25, done: false },
      catalog:  { earned: 0, max: 35, done: false },
      activity: { earned: 0, max: 40, done: false },
      total: 0,
    };
  }

  const done = (key: string) =>
    status.steps.find(s => s.key === key)?.isComplete ?? false;

  const identityDone  = done('logo_uploaded');
  const catalogDone   = status.steps.some(s => CATALOG_KEYS.has(s.key) && s.isComplete);
  const activityDone  = status.steps.some(s => ACTIVITY_KEYS.has(s.key) && s.isComplete);

  const identity = identityDone ? 25 : 0;
  const catalog  = catalogDone  ? 35 : 0;
  const activity = activityDone ? 40 : 0;

  return {
    identity: { earned: identity, max: 25, done: identityDone },
    catalog:  { earned: catalog,  max: 35, done: catalogDone  },
    activity: { earned: activity, max: 40, done: activityDone },
    total: identity + catalog + activity,
  };
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-accent)';
  return 'var(--color-warning)';
}

function scoreLabel(score: number): string {
  if (score === 100) return 'Excellent';
  if (score >= 75)   return 'Great';
  if (score >= 40)   return 'Getting there';
  return 'Just started';
}

function scoreTip(bd: ScoreBreakdown): string {
  if (!bd.identity.done) return 'Upload your store logo to build brand trust.';
  if (!bd.catalog.done)  return 'Add your first product, service, or menu item to open your store.';
  if (!bd.activity.done) return 'Share your store link — your first sale or booking unlocks full score!';
  return 'Your store is fully optimized. Keep the momentum going!';
}

@Component({
  selector: 'app-health-score',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-ad-border bg-ad-surface p-6 space-y-5">

      <!-- Header -->
      <div>
        <h2 class="font-display text-lg font-semibold text-ad-text-1 leading-tight">
          Store Health Score
        </h2>
        <p class="text-ad-text-3 text-sm mt-0.5">How ready is your store?</p>
      </div>

      @if (loading) {
        <!-- Skeleton -->
        <div class="flex flex-col items-center gap-4">
          <div class="w-28 h-28 rounded-full bg-ad-surface-2 animate-pulse"></div>
          <div class="w-32 h-4 rounded bg-ad-surface-2 animate-pulse"></div>
        </div>
      } @else {
        <!-- Score ring -->
        <div class="flex flex-col items-center gap-1">
          <div class="relative w-28 h-28">
            <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
              <!-- Track -->
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="var(--color-ad-border, #e2e8f0)"
                stroke-width="10"
              />
              <!-- Progress — stroke-dasharray = circumference (≈251.3) -->
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                [attr.stroke]="ringColor()"
                stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="251.3"
                [attr.stroke-dashoffset]="dashOffset()"
                style="transition: stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1),
                                   stroke 0.4s ease"
              />
            </svg>
            <!-- Score text centred inside ring -->
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="font-display text-3xl font-bold text-ad-text-1 leading-none">
                {{ breakdown().total }}
              </span>
              <span class="text-[10px] text-ad-text-3 uppercase tracking-wide">/ 100</span>
            </div>
          </div>

          <!-- Label -->
          <span
            class="text-sm font-semibold"
            [style.color]="ringColor()"
          >{{ label() }}</span>
        </div>

        <!-- Breakdown bars -->
        <div class="space-y-3">
          @for (item of breakdownItems(); track item.label) {
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <span class="text-xs text-ad-text-2 font-medium">{{ item.label }}</span>
                <span class="text-xs text-ad-text-3">{{ item.earned }}/{{ item.max }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-ad-surface-2 overflow-hidden">
                <div
                  class="h-full rounded-full transition-[width] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  [style.width.%]="item.done ? 100 : 0"
                  [style.background-color]="item.done ? 'var(--color-accent)' : 'transparent'"
                ></div>
              </div>
            </div>
          }
        </div>

        <!-- Actionable tip -->
        <div class="rounded-xl bg-ad-surface-2 px-4 py-3 text-sm text-ad-text-2 leading-snug">
          💡 {{ tip() }}
        </div>
      }

    </div>
  `,
})
export class HealthScoreComponent implements OnChanges {
  /** Pass the same IOnboardingStatus used by OnboardingChecklistComponent — no extra API call. */
  @Input() status: IOnboardingStatus | null = null;
  @Input() loading = true;

  private readonly _breakdown = signal<ScoreBreakdown>(computeScore(null));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status']) {
      this._breakdown.set(computeScore(this.status));
    }
  }

  readonly breakdown = computed(() => this._breakdown());

  readonly ringColor = computed(() => scoreColor(this._breakdown().total));
  readonly label     = computed(() => scoreLabel(this._breakdown().total));
  readonly tip       = computed(() => scoreTip(this._breakdown()));

  /** stroke-dashoffset for the SVG ring: 251.3 * (1 - score/100) */
  readonly dashOffset = computed(() =>
    Math.round(251.3 * (1 - this._breakdown().total / 100))
  );

  readonly breakdownItems = computed(() => {
    const bd = this._breakdown();
    return [
      { label: 'Store Identity',     earned: bd.identity.earned, max: bd.identity.max, done: bd.identity.done },
      { label: 'Catalog Readiness',  earned: bd.catalog.earned,  max: bd.catalog.max,  done: bd.catalog.done  },
      { label: 'First Real Activity',earned: bd.activity.earned, max: bd.activity.max, done: bd.activity.done },
    ];
  });
}
