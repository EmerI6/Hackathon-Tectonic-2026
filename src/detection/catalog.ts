/**
 * The LLM picks a product CATEGORY; the actual customer-facing offer always comes
 * from this bank-controlled catalogue, so the model can never invent a product.
 */
import type { LifeMoment, ProductCategory, Recommendation } from '../types.ts';
import type { MomentCandidate } from './guardrails.ts';

type CatalogEntry = Recommendation & { channel: string };

export const productCatalog: Record<ProductCategory, CatalogEntry> = {
  'savings-plan': {
    title: 'Save automatically every month',
    description: 'A monthly transfer to your savings account on payday. You choose the amount and can pause it anytime.',
    ctaLabel: 'Set up automatic savings',
    confirmation: 'Done! Your savings plan starts on your next payday.',
    product: 'Automatic savings plan',
    channel: 'Push notification · KBC Mobile',
  },
  mortgage: {
    title: 'Get your personal mortgage offer',
    description: 'A pre-calculated home loan based on your profile, with the home insurance you need at signing.',
    ctaLabel: 'View my mortgage offer',
    confirmation: 'Your offer is saved. A home-loan expert will confirm it within 24 hours.',
    product: 'Home loan + home insurance',
    channel: 'Push notification + advisor follow-up',
  },
  'home-insurance': {
    title: 'Insure your new home',
    description: 'Fire and home insurance adapted to your new address, active from day one.',
    ctaLabel: 'Get a quote',
    confirmation: 'Your quote is ready under Insurance.',
    product: 'Home insurance',
    channel: 'Push notification · KBC Mobile',
  },
  'rental-guarantee': {
    title: 'Your rental guarantee, handled by KBC',
    description: 'A bank rental guarantee so you do not have to block months of rent in cash.',
    ctaLabel: 'Open a rental guarantee',
    confirmation: 'Your rental guarantee request has been sent.',
    product: 'Bank rental guarantee',
    channel: 'Push notification · KBC Mobile',
  },
  'car-loan': {
    title: 'A car loan at a fair rate',
    description: 'Finance your car in a few taps, with an optional car insurance quote.',
    ctaLabel: 'Simulate my car loan',
    confirmation: 'Your car loan simulation is saved.',
    product: 'Car loan',
    channel: 'In-app message',
  },
  'retirement-planning': {
    title: 'Start your retirement income plan',
    description: 'Turn part of your savings into a low-risk portfolio that pays you a monthly income once you retire.',
    ctaLabel: 'Start my retirement plan',
    confirmation: 'Your plan is set up. You will find your projected monthly income under Investments.',
    product: 'Retirement income portfolio',
    channel: 'In-app message + advisor call',
  },
  investment: {
    title: 'Make a large amount work for you',
    description: 'A free session with an advisor to split it between safety, projects and long-term investing.',
    ctaLabel: 'Book a free session',
    confirmation: 'Your session request is sent. An advisor will contact you.',
    product: 'Investment advice',
    channel: 'Advisor call',
  },
  'professional-account': {
    title: 'Your KBC starter pack for self-employed',
    description:
      'A separate professional account and card, invoice tracking and a pension plan for self-employed (VAPZ) — free for the first year.',
    ctaLabel: 'Open my pro account',
    confirmation: 'Your professional account is being opened. You will receive your card within 5 days.',
    product: 'Professional account + VAPZ',
    channel: 'Push notification + advisor for self-employed',
  },
  'child-savings': {
    title: 'Start a savings account for your child',
    description: 'A small monthly amount now grows into a real head start for later studies.',
    ctaLabel: 'Open a child savings account',
    confirmation: 'The child savings account is open.',
    product: 'Child savings account',
    channel: 'In-app message',
  },
  'budget-coaching': {
    title: 'Get a clear view on your budget',
    description: 'A personal budget overview and, if you want, a confidential talk with an advisor.',
    ctaLabel: 'See my budget overview',
    confirmation: 'Your budget overview is ready under Insights.',
    product: 'Budget coaching',
    channel: 'In-app message (discreet)',
  },
};

export function toLifeMoment(c: MomentCandidate, firstName: string, demoKey: string): LifeMoment {
  const { channel, ...recommendation } = productCatalog[c.productCategory];
  return {
    id: `${demoKey}/${c.category}`,
    type: c.category,
    title: c.moment,
    headline: c.headline || c.moment,
    message: c.customerMessage,
    notification: `${c.headline || c.moment} We have a small tip for you, ${firstName}.`,
    signals: c.signals,
    recommendation,
    channel,
  };
}
