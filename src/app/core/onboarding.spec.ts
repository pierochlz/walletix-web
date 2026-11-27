import { onboarding, onboardingHiddenKey } from './onboarding';

describe('onboarding (first steps of a new user)', () => {
  it('a new user has the 3 steps pending, in order: income, budget, challenge', () => {
    const state = onboarding(false, false, false);
    expect(state.steps.map((s) => s.key)).toEqual(['income', 'budget', 'challenge']);
    expect(state.steps.map((s) => s.link)).toEqual(['/incomes', '/budgets', '/challenges']);
    expect(state.done).toBe(0);
    expect(state.complete).toBe(false);
  });

  it('counts the steps already done', () => {
    const state = onboarding(true, false, true);
    expect(state.steps.filter((s) => s.done).map((s) => s.key)).toEqual(['income', 'challenge']);
    expect(state.done).toBe(2);
    expect(state.complete).toBe(false);
  });

  it('is complete with the 3 steps done (then the card is not shown)', () => {
    expect(onboarding(true, true, true).complete).toBe(true);
  });

  it('remembers "hide" per user', () => {
    expect(onboardingHiddenKey(7)).toBe('walletix_onboarding_hidden_7');
    expect(onboardingHiddenKey(7)).not.toBe(onboardingHiddenKey(8));
  });
});
