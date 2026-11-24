import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { LoginPage } from './pages/auth/login';
import { RegisterPage } from './pages/auth/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Layout } from './pages/layout/layout';
import { Profile } from './pages/profile/profile';
import { BudgetsPage } from './pages/budgets/budgets';
import {
  CategoriesPage,
  ExpensesPage,
  GoalsPage,
  IncomesPage,
  MerchantsPage,
} from './pages/resources';
import { TermsPage } from './pages/terms';

export const routes: Routes = [
  // Public pages
  { path: 'login', component: LoginPage, canActivate: [guestGuard], title: 'Walletix | Login' },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard], title: 'Walletix | Register' },
  { path: 'terms', component: TermsPage, title: 'Walletix | Terms' },

  // Private pages: they need a session (authGuard) and share the Layout (toolbar + menu)
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, title: 'Walletix | Dashboard' },
      { path: 'expenses', component: ExpensesPage, title: 'Walletix | Expenses' },
      { path: 'incomes', component: IncomesPage, title: 'Walletix | Incomes' },
      { path: 'budgets', component: BudgetsPage, title: 'Walletix | Budgets' },
      { path: 'goals', component: GoalsPage, title: 'Walletix | Savings goals' },
      { path: 'categories', component: CategoriesPage, title: 'Walletix | Categories' },
      { path: 'merchants', component: MerchantsPage, title: 'Walletix | Merchants' },
      { path: 'profile', component: Profile, title: 'Walletix | Profile' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
