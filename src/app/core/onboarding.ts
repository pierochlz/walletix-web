// "First steps" card of the dashboard for new users (pure logic, without Angular, so it can be unit tested).
// Instead of a dashboard full of empty cards, a new user sees 3 steps that lead to the main features.

export interface OnboardingStep {
  key: 'income' | 'budget' | 'challenge';
  label: string; // i18n key
  link: string; // page where the step is done
  icon: string;
  done: boolean;
}

export interface OnboardingState {
  steps: OnboardingStep[];
  done: number; // completed steps
  complete: boolean;
}

export function onboarding(hasIncome: boolean, hasBudget: boolean, hasChallenge: boolean): OnboardingState {
  const steps: OnboardingStep[] = [
    { key: 'income', label: 'onboarding.income', link: '/incomes', icon: 'payments', done: hasIncome },
    { key: 'budget', label: 'onboarding.budget', link: '/budgets', icon: 'account_balance_wallet', done: hasBudget },
    { key: 'challenge', label: 'onboarding.challenge', link: '/challenges', icon: 'emoji_events', done: hasChallenge },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, done, complete: done === steps.length };
}

// The user can hide the card; it is remembered in this browser (one key per user)
export function onboardingHiddenKey(idUsuario: number | undefined): string {
  return `walletix_onboarding_hidden_${idUsuario ?? 0}`;
}
