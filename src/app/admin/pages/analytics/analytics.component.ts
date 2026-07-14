import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-bold text-ad-text-1">Analytics</h1>
      <div class="rounded-lg bg-ad-surface border border-ad-border p-8 text-center">
        <p class="text-ad-text-3">Analytics — coming next step</p>
      </div>
    </div>
  `,
})
export class AnalyticsComponent {}
