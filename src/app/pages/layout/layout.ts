import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
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
    TranslatePipe,
    LanguageMenu,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  readonly auth = inject(AuthService);
  private lookups = inject(LookupStore);

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
    { path: '/categories', icon: 'category', label: 'nav.categories' },
    { path: '/merchants', icon: 'storefront', label: 'nav.merchants' },
  ];

  ngOnInit(): void {
    // Once logged in: who am I (GET /usuarios/yo) + categories and merchants for the selects
    this.auth.loadCurrentUser().subscribe({ error: () => {} });
    this.lookups.refresh();
  }
}
