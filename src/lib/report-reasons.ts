/** Quick-pick reasons for content reports (no free typing required). */
export const REPORT_REASONS = [
  { code: 'spam', labelKey: 'reportReasons.spam', fallback: 'Spam or advertising' },
  { code: 'inappropriate', labelKey: 'reportReasons.inappropriate', fallback: 'Inappropriate or sexual content' },
  { code: 'harassment', labelKey: 'reportReasons.harassment', fallback: 'Harassment or hate speech' },
  { code: 'personal_data', labelKey: 'reportReasons.personalData', fallback: 'Sharing personal data' },
  { code: 'misleading', labelKey: 'reportReasons.misleading', fallback: 'Misleading content' },
  { code: 'other', labelKey: 'reportReasons.other', fallback: 'Other' },
] as const;

export type ReportReasonCode = (typeof REPORT_REASONS)[number]['code'];

export const reportReasonLabel = (
  code: string,
  t: (key: string, fallback?: string) => string,
) => {
  const found = REPORT_REASONS.find((r) => r.code === code);
  return found ? t(found.labelKey, found.fallback) : code;
};

/** Quick-pick categories for bug reports. */
export const BUG_CATEGORIES = [
  { code: 'page_load', labelKey: 'bugs.cat.pageLoad', fallback: 'Page does not load' },
  { code: 'payment', labelKey: 'bugs.cat.payment', fallback: 'Payment error' },
  { code: 'media', labelKey: 'bugs.cat.media', fallback: 'Video or audio problem' },
  { code: 'account', labelKey: 'bugs.cat.account', fallback: 'Login or account' },
  { code: 'layout', labelKey: 'bugs.cat.layout', fallback: 'Broken layout' },
  { code: 'other', labelKey: 'bugs.cat.other', fallback: 'Other' },
] as const;

export const bugCategoryLabel = (
  code: string,
  t: (key: string, fallback?: string) => string,
) => {
  const found = BUG_CATEGORIES.find((c) => c.code === code);
  return found ? t(found.labelKey, found.fallback) : code;
};

export const BUG_SEVERITIES = [
  { code: 'low', labelKey: 'bugs.sev.low', fallback: 'Low' },
  { code: 'medium', labelKey: 'bugs.sev.medium', fallback: 'Medium' },
  { code: 'high', labelKey: 'bugs.sev.high', fallback: 'High' },
] as const;
