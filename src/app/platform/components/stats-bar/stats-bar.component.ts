import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';

/**
 * Honest, factual numbers about the product only (store types, templates,
 * setup time) — deliberately NOT fabricated social-proof numbers like
 * "10,000+ merchants" or star ratings we have no data to back up.
 */
@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule, CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-y border-sf-border bg-sf-bg">
      <div class="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        @for (stat of stats; track stat.label) {
          <div>
            <p class="font-display font-bold text-3xl sm:text-4xl text-sf-text-1">
              <span [appCountUp]="stat.value">0</span>{{ stat.suffix }}
            </p>
            <p class="text-sf-text-3 text-sm mt-1">{{ stat.label }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class StatsBarComponent {
  readonly stats = [
    { value: 3,  suffix: '',  label: 'Store types' },
    { value: 9,  suffix: '',  label: 'Templates' },
    { value: 2,  suffix: '',  label: 'Minutes to launch' },
    { value: 2,  suffix: '',  label: 'Languages (EN/AR)' },
  ];
}
