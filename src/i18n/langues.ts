export const langues = ['fr', 'wo', 'ar'] as const;
export type Langue = (typeof langues)[number];

export function estLangue(code: string | null | undefined): code is Langue {
  return langues.some((l) => l === code);
}
