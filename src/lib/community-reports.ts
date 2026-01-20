/**
 * Community Reports System
 * Manages reports for inappropriate ideas and comments
 */

export interface CommunityReport {
  id: string;
  type: 'idea' | 'comment';
  contentId: string;
  contentTitle: string;
  contentAuthor: string;
  reason: string;
  reasonCategory: 'spam' | 'inappropriate' | 'harassment' | 'other';
  reporterUsername: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
}

const STORAGE_KEY = 'community_reports';

export const getCommunityReports = (): CommunityReport[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const addCommunityReport = (report: Omit<CommunityReport, 'id' | 'createdAt' | 'status'>): CommunityReport => {
  const reports = getCommunityReports();
  
  // Check if already reported by this user
  const alreadyReported = reports.some(
    r => r.contentId === report.contentId && r.reporterUsername === report.reporterUsername
  );
  
  if (alreadyReported) {
    throw new Error('Você já denunciou este conteúdo');
  }
  
  const newReport: CommunityReport = {
    ...report,
    id: `report-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  
  reports.unshift(newReport);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  
  return newReport;
};

export const updateReportStatus = (reportId: string, status: CommunityReport['status']): void => {
  const reports = getCommunityReports();
  const updated = reports.map(r => r.id === reportId ? { ...r, status } : r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getPendingReportsCount = (): number => {
  const reports = getCommunityReports();
  return reports.filter(r => r.status === 'pending').length;
};

export const getReportedContentIds = (): string[] => {
  const reports = getCommunityReports();
  return [...new Set(reports.filter(r => r.status === 'action_taken').map(r => r.contentId))];
};

export const reasonCategories = [
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'inappropriate', label: 'Conteúdo impróprio' },
  { value: 'harassment', label: 'Assédio ou bullying' },
  { value: 'other', label: 'Outro motivo' },
] as const;
