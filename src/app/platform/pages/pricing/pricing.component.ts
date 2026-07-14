import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlatformNavComponent } from '../../components/nav/platform-nav.component';
import { PlatformFooterComponent } from '../../components/footer/platform-footer.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, PlatformNavComponent, PlatformFooterComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-sf-bg">
      <app-platform-nav></app-platform-nav>

      <main class="flex-1 py-24 px-6">
        <div class="max-w-5xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-16">
            <h1 class="font-display text-5xl font-bold text-sf-text-1 tracking-tight mb-4">
              Simple, honest pricing
            </h1>
            <p class="text-sf-text-3 text-lg max-w-lg mx-auto">
              Start free, scale when you're ready. No hidden fees, no lock-in.
            </p>
          </div>

          <!-- Plans -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              *ngFor="let plan of plans"
              class="rounded-xl border p-7 flex flex-col transition-shadow duration-[220ms]"
              [class.border-accent]="plan.highlighted"
              [class.shadow-accent]="plan.highlighted"
              [class.shadow-lg]="plan.highlighted"
              [class.border-sf-border]="!plan.highlighted"
              [class.bg-sf-bg]="!plan.highlighted"
              [class.bg-white]="plan.highlighted"
            >
              <!-- Badge -->
              <div *ngIf="plan.highlighted"
                class="inline-flex self-start mb-4 px-2.5 py-0.5 rounded-full
                       bg-accent-dim text-accent-dim-txt text-xs font-medium">
                Most popular
              </div>

              <h2 class="font-display text-xl font-bold text-sf-text-1 mb-1">{{ plan.name }}</h2>
              <p class="text-sf-text-3 text-sm mb-5">{{ plan.description }}</p>

              <div class="mb-6">
                <span class="font-display text-4xl font-bold text-sf-text-1">{{ plan.price }}</span>
                <span class="text-sf-text-3 text-sm ml-1">{{ plan.period }}</span>
              </div>

              <ul class="flex flex-col gap-2.5 mb-8 flex-1">
                <li *ngFor="let f of plan.features"
                  class="flex items-start gap-2.5 text-sm text-sf-text-2">
                  <span class="text-accent mt-0.5 shrink-0">✓</span>
                  {{ f }}
                </li>
              </ul>

              <app-button
                [variant]="plan.highlighted ? 'primary' : 'secondary'"
                [fullWidth]="true"
                routerLink="/signup"
              >
                {{ plan.cta }}
              </app-button>
            </div>
          </div>
        </div>
      </main>

      <app-platform-footer></app-platform-footer>
    </div>
  `,
})
export class PricingComponent {
  readonly plans: PricingPlan[] = [
    {
      name: 'Free',
      price: '$0',
      period: '/ month',
      description: 'Perfect for getting started.',
      cta: 'Start free',
      highlighted: false,
      features: [
        '1 store',
        'Up to 10 products / services',
        'Basic analytics',
        'Launchly subdomain',
        'Community support',
      ],
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/ month',
      description: 'For businesses ready to grow.',
      cta: 'Get started',
      highlighted: true,
      features: [
        'Unlimited products / services',
        'Advanced analytics & charts',
        'Custom domain (coming soon)',
        'All 9 templates',
        'Priority support',
        'Remove Launchly branding',
      ],
    },
    {
      name: 'Business',
      price: '$49',
      period: '/ month',
      description: 'For high-volume stores.',
      cta: 'Contact us',
      highlighted: false,
      features: [
        'Everything in Pro',
        'Multiple staff accounts',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
      ],
    },
  ];
}
