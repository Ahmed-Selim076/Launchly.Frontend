import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { MagneticHoverDirective } from '../../../shared/directives/magnetic-hover.directive';

@Component({
  selector: 'app-cta-band',
  standalone: true,
  imports: [RouterLink, ButtonComponent, MagneticHoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-6 pb-24">
      <div class="max-w-5xl mx-auto rounded-3xl bg-sf-text-1 px-8 py-16 sm:py-20 text-center relative overflow-hidden">
        <div class="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20 bg-accent"></div>
        <div class="relative">
          <h2 class="font-display font-bold text-3xl sm:text-4xl text-sf-bg mb-4">
            Ready to launch your store?
          </h2>
          <p class="text-sf-bg/70 text-lg mb-9 max-w-md mx-auto">
            Join Launchly and have a real storefront live in minutes — free to start.
          </p>
          <span appMagneticHover [magnetStrength]="6" class="inline-block">
            <app-button variant="primary" size="lg" routerLink="/signup">
              Start for free
            </app-button>
          </span>
        </div>
      </div>
    </section>
  `,
})
export class CtaBandComponent {}
