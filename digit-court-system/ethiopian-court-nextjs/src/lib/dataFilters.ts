import { type Role } from './rbac';

export interface Case {
  id: string;
  title: string;
  type: string;
  status: string;
  plaintiff?: string;
  plaintiffId?: string;
  defendant?: string;
  defendantId?: string;
  assignedJudge?: string;
  assignedJudgeId?: string;
  lawyerId?: string;
  filedDate?: string;
  // Extended fields used in cases/page.tsx
  caseNumber?: string;
  judge?: string;
  filingDate?: string;
  lastUpdate?: string;
  priority?: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  title: string;
  date: string;
  time?: string;
  judgeId?: string;
  participants?: string[];
}

export interface Activity {
  id: string | number;
  type: string;
  title: string;
  desc: string;
  time: string;
  user: string;
  userId?: string;
  caseId?: string;
}

/**
 * Filter cases based on user role and ID
 */
export function filterCasesByRole(cases: Case[], userRole: Role, userId: string): Case[] {
  switch (userRole) {
    case 'SYSTEM_ADMIN':
    case 'COURT_ADMIN':
      // Admins see all cases
      return cases;
      
    case 'JUDGE':
      // Judges see their assigned cases
      return cases.filter(c => c.assignedJudgeId === userId || c.assignedJudge === userId);
      
    case 'CLERK':
      // Clerks see all cases (for processing)
      return cases;
      
    case 'LAWYER':
      // Lawyers see their client cases
      return cases.filter(c => c.lawyerId === userId);
      
    case 'PLAINTIFF':
      // Plaintiffs see cases where they are the plaintiff
      return cases.filter(c => c.plaintiffId === userId || c.plaintiff === userId);
      
    case 'DEFENDANT':
      // Defendants see cases where they are the defendant
      return cases.filter(c => c.defendantId === userId || c.defendant === userId);
      
    default:
      return [];
  }
}

/**
 * Filter hearings based on user role and ID
 */
export function filterHearingsByRole(hearings: Hearing[], userRole: Role, userId: string, userCases?: Case[]): Hearing[] {
  switch (userRole) {
    case 'SYSTEM_ADMIN':
    case 'COURT_ADMIN':
      // Admins see all hearings
      return hearings;
      
    case 'JUDGE':
      // Judges see hearings they're presiding over
      return hearings.filter(h => h.judgeId === userId);
      
    case 'CLERK':
      // Clerks see all hearings
      return hearings;
      
    case 'LAWYER':
    case 'PLAINTIFF':
    case 'DEFENDANT':
      // Filter hearings for cases the user is involved in
      if (!userCases) return [];
      const caseIds = userCases.map(c => c.id);
      return hearings.filter(h => caseIds.includes(h.caseId));
      
    default:
      return [];
  }
}

/**
 * Filter activities based on user role and ID
 */
export function filterActivitiesByRole(activities: Activity[], userRole: Role, userId: string, userCases?: Case[]): Activity[] {
  switch (userRole) {
    case 'SYSTEM_ADMIN':
    case 'COURT_ADMIN':
    case 'JUDGE':
    case 'CLERK':
      // Staff see all activities
      return activities;
      
    case 'LAWYER':
    case 'PLAINTIFF':
    case 'DEFENDANT':
      // Filter activities for cases the user is involved in
      if (!userCases) return [];
      const caseIds = userCases.map(c => c.id);
      return activities.filter(a => 
        a.userId === userId || 
        (a.caseId && caseIds.includes(a.caseId))
      );
      
    default:
      return [];
  }
}

/**
 * Get role-specific stats labels
 */
export function getRoleSpecificStats(userRole: Role): { label: string; key: string }[] {
  switch (userRole) {
    case 'JUDGE':
      return [
        { label: 'Assigned Cases', key: 'assignedCases' },
        { label: 'Pending Judgments', key: 'pendingJudgments' },
        { label: 'Hearings This Week', key: 'upcomingHearings' },
        { label: 'Resolution Rate', key: 'resolutionRate' }
      ];
      
    case 'LAWYER':
      return [
        { label: 'Active Cases', key: 'activeCases' },
        { label: 'Upcoming Hearings', key: 'upcomingHearings' },
        { label: 'Documents Pending', key: 'pendingDocuments' },
        { label: 'Win Rate', key: 'winRate' }
      ];
      
    case 'CLERK':
      return [
        { label: 'Cases to Process', key: 'casesToProcess' },
        { label: 'Documents Filed', key: 'documentsFiled' },
        { label: 'Hearings Scheduled', key: 'hearingsScheduled' },
        { label: 'Processing Time', key: 'processingTime' }
      ];
      
    case 'PLAINTIFF':
    case 'DEFENDANT':
      return [
        { label: 'My Cases', key: 'myCases' },
        { label: 'Next Hearing', key: 'nextHearing' },
        { label: 'Documents Required', key: 'documentsRequired' },
        { label: 'Case Status', key: 'caseStatus' }
      ];
      
    default:
      return [
        { label: 'Total Cases', key: 'totalCases' },
        { label: 'Clearance Rate', key: 'clearanceRate' },
        { label: 'Efficiency', key: 'efficiency' },
        { label: 'Digital Adoption', key: 'digitalAdoption' }
      ];
  }
}
