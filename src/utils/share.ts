import type { WizardAnswers } from '../types/wizard';

export function encodeAnswers(answers: WizardAnswers): string {
  try {
    const json = JSON.stringify(answers);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

export function decodeAnswers(encoded: string): WizardAnswers | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getShareUrl(answers: WizardAnswers): string {
  const encoded = encodeAnswers(answers);
  return `${window.location.origin}${window.location.pathname}?config=${encoded}`;
}
