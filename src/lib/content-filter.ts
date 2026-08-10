/**
 * Content filter — blocks personal data (links, emails, phones, social handles)
 * in any free-text field a user can submit.
 * Mirrors public.text_has_personal_data() in the database.
 */

export type PersonalDataViolation = 'url' | 'email' | 'phone' | 'handle';

const EMAIL_RE = /[a-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i;
const URL_RE = /(https?:\/\/|www\.)/i;
const DOMAIN_RE =
  /[a-z0-9-]+\.(com|net|org|br|io|co|me|app|xyz|link|gg|tv|shop|store|info|biz|ru|es|us)(\/|\s|$)/i;
const HANDLE_RE = /(^|\s)@[a-z0-9._]{3,}/i;
const PHONE_RE = /[0-9][0-9 ().+-]{6,}[0-9]/;

/** Returns the first violation found, or null when the text is clean. */
export const findPersonalData = (text: string | null | undefined): PersonalDataViolation | null => {
  if (!text || !text.trim()) return null;
  const value = text.toLowerCase();

  if (EMAIL_RE.test(value)) return 'email';
  if (URL_RE.test(value) || DOMAIN_RE.test(value)) return 'url';
  if (HANDLE_RE.test(value)) return 'handle';

  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length >= 8 && PHONE_RE.test(value)) return 'phone';

  return null;
};

export const hasPersonalData = (text: string | null | undefined) => findPersonalData(text) !== null;

/**
 * Validates several fields at once.
 * `t` is the i18n translate function so the message is localized.
 */
export type Translate = (key: string, fallback: string) => string;

export const validateUserText = (
  values: Array<string | null | undefined>,
  t: Translate,
): { ok: boolean; violation: PersonalDataViolation | null; message: string } => {
  for (const value of values) {
    const violation = findPersonalData(value);
    if (violation) {
      return {
        ok: false,
        violation,
        message: t(`filter.${violation}`, personalDataFallback[violation]),
      };
    }
  }
  return { ok: true, violation: null, message: '' };
};

const personalDataFallback: Record<PersonalDataViolation, string> = {
  url: 'Links are not allowed in this field.',
  email: 'Email addresses are not allowed in this field.',
  phone: 'Phone numbers are not allowed in this field.',
  handle: 'Social media handles are not allowed in this field.',
};

/** True when the database rejected the write because of the personal-data trigger. */
export const isPersonalDataDbError = (error: unknown) =>
  typeof (error as { message?: string })?.message === 'string' &&
  (error as { message: string }).message.includes('personal_data_blocked');
