import {
  Component, ChangeDetectionStrategy, OnInit, inject,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OnboardingService } from '../../../core/admin/onboarding.service';
import { IOnboardingStatus, IOnboardingStep } from '../../../core/models';

// ─── Route hints per step key ─────────────────────────────────────────────────
// Maps each backend step key to the admin route the user should navigate to
// in order to complete it. The CTA link is omitted for steps with no direct
// admin-side action (first_order / first_appointment — those come from customers).

const STEP_ROUTE: Record<string, string | null> = {
  email_verified:     null,               // no admin route — user checks email
  logo_uploaded:      '/admin/settings',
  product_created:    '/admin/products',
  service_created:    '/admin/services',
  menu_item_created:  '/admin/menu',
  first_order:        null,               // customer-driven
  first_appointment:  null,               // customer-driven
};

const STEP_CTA: Record<string, string> = {
  logo_uploaded:     'Go to Settings →',
  product_created:   'Add Product →',
  service_created:   'Add Service →',
  menu_item_created: 'Add Menu Item →',
};

// Checkmark path (lucide check)
const CHECK_PATH = 'M20 6 9 17l-5-5';

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!hidden()) {
      <div class="rounded-2xl border border-ad-border bg-ad-surface p-6 space-y-5">

        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="font-display text-lg font-semibold text-ad-text-1 leading-tight">
              Get your store ready
            </h2>
            <p class="text-ad-text-3 text-sm mt-0.5">
              {{ status()?.completedCount ?? 0 }} of {{ status()?.totalCount ?? 4 }} steps complete
            </p>
          </div>
          @if (status()?.isFullyComplete) {
            <button
              (click)="dismiss()"
              class="text-ad-text-3 hover:text-ad-text-1 transition-colors text-xs shrink-0 mt-0.5"
              aria-label="Dismiss checklist"
            >Dismiss</button>
          }
        </div>

        <!-- Progress bar — GPU-composited clip-path animation -->
        @if (status(); as s) {
          <div class="relative h-1.5 rounded-full bg-ad-surface-2 overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent)]
                     transition-[width] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              [style.width.%]="progressPct()"
              role="progressbar"
              [attr.aria-valuenow]="s.completedCount"
              [attr.aria-valuemax]="s.totalCount"
            ></div>
          </div>
        }

        <!-- Steps -->
        @if (loading()) {
          <div class="space-y-3">
            @for (_ of [1,2,3,4]; track $index) {
              <div class="h-10 rounded-lg bg-ad-surface-2 animate-pulse"></div>
            }
          </div>
        } @else if (errored()) {
          <p class="text-sm text-[var(--color-danger)]">
            Couldn't load checklist. Please refresh.
          </p>
        } @else {
          <ol class="space-y-2">
            @for (step of status()?.steps ?? []; track step.key) {
              <li
                class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                [class.opacity-50]="step.isComplete"
              >
                <!-- Checkbox circle -->
                <span
                  class="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                         transition-colors duration-200"
                  [class.border-[var(--color-accent)]]="step.isComplete"
                  [class.bg-[var(--color-accent)]]="step.isComplete"
                  [class.border-ad-border]="!step.isComplete"
                  [attr.aria-hidden]="true"
                >
                  @if (step.isComplete) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="white"
                         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                         class="w-3 h-3">
                      <path [attr.d]="checkPath"/>
                    </svg>
                  }
                </span>

                <!-- Label -->
                <span class="flex-1 text-sm text-ad-text-1 font-medium">{{ step.label }}</span>

                <!-- CTA link (only for incomplete actionable steps) -->
                @if (!step.isComplete && getRoute(step)) {
                  <a
                    [routerLink]="getRoute(step)"
                    class="text-xs text-[var(--color-accent)] hover:underline shrink-0"
                  >{{ getCta(step) }}</a>
                }
              </li>
            }
          </ol>
        }

        <!-- All done banner -->
        @if (status()?.isFullyComplete) {
          <div class="rounded-xl bg-[var(--color-success-dim)] px-4 py-3 text-sm
                      text-[var(--color-success)] font-medium text-center">
            🎉 Your store is ready to go!
          </div>
        }

      </div>
    }
  `,
})
export class OnboardingChecklistComponent implements OnInit {
  private readonly svc = inject(OnboardingService);

  readonly checkPath = CHECK_PATH;

  readonly status  = signal<IOnboardingStatus | null>(null);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly hidden  = signal(false);

  readonly progressPct = computed(() => {
    const s = this.status();
    if (!s || s.totalCount === 0) return 0;
    return Math.round((s.completedCount / s.totalCount) * 100);
  });

  ngOnInit(): void {
    this.svc.getStatus().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.status.set(res.data);
          // Auto-hide only if already fully complete AND the user previously dismissed
          // (here we just keep it visible when complete so user sees the done banner)
        } else {
          this.errored.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  dismiss(): void {
    this.hidden.set(true);
  }

  getRoute(step: IOnboardingStep): string | null {
    return STEP_ROUTE[step.key] ?? null;
  }

  getCta(step: IOnboardingStep): string {
    return STEP_CTA[step.key] ?? 'Complete →';
  }
}
