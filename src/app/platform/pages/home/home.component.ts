import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PlatformNavComponent } from '../../components/nav/platform-nav.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { StatsBarComponent } from '../../components/stats-bar/stats-bar.component';
import { StoreTypesComponent } from '../../components/store-types/store-types.component';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works.component';
import { FeatureGridComponent } from '../../components/feature-grid/feature-grid.component';
import { PlatformFaqComponent } from '../../components/faq/faq.component';
import { CtaBandComponent } from '../../components/cta-band/cta-band.component';
import { PlatformFooterComponent } from '../../components/footer/platform-footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    PlatformNavComponent,
    HeroComponent,
    StatsBarComponent,
    StoreTypesComponent,
    HowItWorksComponent,
    FeatureGridComponent,
    PlatformFaqComponent,
    CtaBandComponent,
    PlatformFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-sf-bg">
      <app-platform-nav></app-platform-nav>
      <main class="flex-1">
        <app-hero></app-hero>
        <app-stats-bar></app-stats-bar>
        <app-store-types></app-store-types>
        <app-how-it-works></app-how-it-works>
        <app-feature-grid></app-feature-grid>
        <app-platform-faq></app-platform-faq>
        <app-cta-band></app-cta-band>
      </main>
      <app-platform-footer></app-platform-footer>
    </div>
  `,
})
export class HomeComponent {}
