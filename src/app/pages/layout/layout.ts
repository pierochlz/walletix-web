import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { NotificationStore } from '../../core/notification.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LookupStore } from '../../core/lookup.store';
import { LanguageMenu } from '../../shared/language-menu';

// Frame of the private pages: toolbar, side menu (drawer on phones) and footer
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    TranslatePipe,
    LanguageMenu,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationStore);
  private lookups = inject(LookupStore);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // true on phones and small tablets: the menu becomes a drawer that opens with the ☰ button
  readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly year = new Date().getFullYear();

  readonly links = [
    { path: '/dashboard', icon: 'dashboard', label: 'nav.dashboard' },
    { path: '/expenses', icon: 'shopping_cart', label: 'nav.expenses' },
    { path: '/incomes', icon: 'payments', label: 'nav.incomes' },
    { path: '/budgets', icon: 'account_balance_wallet', label: 'nav.budgets' },
    { path: '/goals', icon: 'savings', label: 'nav.goals' },
    { path: '/challenges', icon: 'emoji_events', label: 'nav.challenges' },
    { path: '/learn', icon: 'school', label: 'nav.learn' },
    { path: '/categories', icon: 'category', label: 'nav.categories' },
    { path: '/merchants', icon: 'storefront', label: 'nav.merchants' },
    { path: '/notifications', icon: 'notifications', label: 'nav.notifications' },
  ];

  ngOnInit(): void {
    // Once logged in: who am I (GET /usuarios/yo) + categories and merchants for the selects
    this.auth.loadCurrentUser().subscribe({ error: () => {} });
    this.lookups.refresh();
    // Bell counter: loaded now and again on every page change (new alerts appear without reloading)
    this.notifications.refresh();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.notifications.refresh());
  }
}
