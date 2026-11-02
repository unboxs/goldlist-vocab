export type DistillationStage = 'headlist' | 'd1' | 'd2' | 'd3' | 'mastered';

export interface RawWord {
  text: string;
  translations: string[];
  audioURL?: string;
  isNew?: boolean;
}

export interface WordItem {
  id: string; // Unique word ID, e.g. "w_1"
  text: string;
  translations: string[];
  audioURL?: string;
  pageId: number; // Belongs to Page 1, Page 2, etc.
  stage: DistillationStage;
  addedAt: number; // Timestamp
  lastReviewedAt?: number;
  nextEligibleAt: number; // Distillation cooldown target timestamp
  reviewCount: number;
  notes?: string; // Custom sentence / mnemonic note
  isStarred?: boolean; // Star / difficulty marker
}

export interface GoldListPage {
  id: number; // 1, 2, 3...
  title: string;
  createdAt: number;
  cooldownDays: number;
  // Stage completion timestamps
  headlistCompletedAt?: number;
  d1CompletedAt?: number;
  d2CompletedAt?: number;
  d3CompletedAt?: number;
  totalWords: number;
}

export interface AppSettings {
  wordsPerPage: number; // Default 20
  cooldownDays: number; // Default 14 (or 7 for accelerated)
  autoPlayAudio: boolean;
  targetWeeks: number; // Default 4
  dailyPagesGoal: number; // Default 2
  notebookTheme: 'vintage' | 'midnight';
  lastVisitedPageId?: number; // Bookmark
}

export interface AppStats {
  totalWords: number;
  headlistCount: number;
  d1Count: number;
  d2Count: number;
  d3Count: number;
  masteredCount: number;
  pagesCount: number;
  completedDistillations: number;
  starredCount?: number;
}
