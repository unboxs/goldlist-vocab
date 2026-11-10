import { get, set, clear } from 'idb-keyval';
import { WordItem, GoldListPage, AppSettings, RawWord, DistillationStage, AppStats } from '../types/goldlist';

const STORAGE_KEYS = {
  WORDS: 'goldlist_words_v1',
  PAGES: 'goldlist_pages_v1',
  SETTINGS: 'goldlist_settings_v1',
  INITIALIZED: 'goldlist_initialized_v1',
};

const MAX_D3_FAILURES = 3;

// A headlist word on a page never opened has no cooldown yet, so it is not due
export const isDue = (word: WordItem, page: GoldListPage | undefined, now: number): boolean =>
  word.nextEligibleAt <= now &&
  !(word.stage === 'headlist' && word.reviewCount === 0 && !page?.headlistStartedAt);

export const DEFAULT_SETTINGS: AppSettings = {
  wordsPerPage: 20,
  cooldownDays: 14, // Uncle Davey's canonical 14-day rule
  autoPlayAudio: true,
  targetWeeks: 4,
  dailyPagesGoal: 2,
  notebookTheme: 'vintage',
};

class DBService {
  private wordsCache: WordItem[] | null = null;
  private pagesCache: GoldListPage[] | null = null;
  private settingsCache: AppSettings | null = null;

  // Initialize DB from /data/English.json
  public async init(forceReload = false): Promise<void> {
    const isInit = await get<boolean>(STORAGE_KEYS.INITIALIZED);
    if (isInit && !forceReload) {
      await this.loadCache();
      return;
    }

    try {
      const response = await fetch('/data/English.json');
      if (!response.ok) {
        throw new Error(`Failed to load English.json: ${response.statusText}`);
      }
      const rawWords: RawWord[] = await response.json();
      await this.importRawWords(rawWords, DEFAULT_SETTINGS.wordsPerPage, DEFAULT_SETTINGS.cooldownDays);
      await set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      await set(STORAGE_KEYS.INITIALIZED, true);
      this.settingsCache = DEFAULT_SETTINGS;
    } catch (err) {
      console.error('Initialization error:', err);
      throw err;
    }
  }

  // Split raw words into Goldlist pages
  public async importRawWords(rawWords: RawWord[], wordsPerPage = 20, cooldownDays = 14): Promise<void> {
    const pages: GoldListPage[] = [];
    const words: WordItem[] = [];
    const now = Date.now();

    const totalPages = Math.ceil(rawWords.length / wordsPerPage);

    for (let p = 1; p <= totalPages; p++) {
      const pageWords = rawWords.slice((p - 1) * wordsPerPage, p * wordsPerPage);
      
      pages.push({
        id: p,
        title: `第 ${p} 页 (Page ${p})`,
        createdAt: now,
        cooldownDays,
        totalWords: pageWords.length,
      });

      pageWords.forEach((rw, idx) => {
        words.push({
          id: `w_${p}_${idx + 1}`,
          text: rw.text.trim(),
          translations: rw.translations || [],
          audioURL: rw.audioURL,
          pageId: p,
          stage: 'headlist',
          addedAt: now,
          nextEligibleAt: now, // Initially available
          reviewCount: 0,
        });
      });
    }

    this.wordsCache = words;
    this.pagesCache = pages;

    await set(STORAGE_KEYS.WORDS, words);
    await set(STORAGE_KEYS.PAGES, pages);
  }

  private async loadCache(): Promise<void> {
    if (!this.wordsCache) {
      this.wordsCache = (await get<WordItem[]>(STORAGE_KEYS.WORDS)) || [];
    }
    if (!this.pagesCache) {
      this.pagesCache = (await get<GoldListPage[]>(STORAGE_KEYS.PAGES)) || [];
    }
    if (!this.settingsCache) {
      this.settingsCache = (await get<AppSettings>(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
    }
  }

  public async getAllWords(): Promise<WordItem[]> {
    await this.loadCache();
    return this.wordsCache || [];
  }

  public async getAllPages(): Promise<GoldListPage[]> {
    await this.loadCache();
    return this.pagesCache || [];
  }

  public async getSettings(): Promise<AppSettings> {
    await this.loadCache();
    return this.settingsCache || DEFAULT_SETTINGS;
  }

  public async updateSettings(settings: AppSettings): Promise<void> {
    this.settingsCache = settings;
    await set(STORAGE_KEYS.SETTINGS, settings);
  }

  // Get words for a specific page grouped by stage
  public async getPageData(pageId: number): Promise<{
    page: GoldListPage | undefined;
    headlist: WordItem[];
    d1: WordItem[];
    d2: WordItem[];
    d3: WordItem[];
    mastered: WordItem[];
  }> {
    await this.loadCache();
    const page = this.pagesCache?.find(p => p.id === pageId);
    const pageWords = (this.wordsCache || []).filter(w => w.pageId === pageId);

    return {
      page,
      headlist: pageWords.filter(w => w.stage === 'headlist'),
      d1: pageWords.filter(w => w.stage === 'd1'),
      d2: pageWords.filter(w => w.stage === 'd2'),
      d3: pageWords.filter(w => w.stage === 'd3'),
      mastered: pageWords.filter(w => w.stage === 'mastered'),
    };
  }

  // Distill a word in the Gold List Method:
  // - If remembered = true: natural acquisition -> goes to 'mastered' (Long-term memory vault)
  // - If remembered = false: needs further distillation -> moves to next stage (headlist -> d1 -> d2 -> d3 -> mastered)
  public async distillWord(
    wordId: string,
    remembered: boolean,
    customCooldownDays?: number
  ): Promise<WordItem> {
    await this.loadCache();
    const word = this.wordsCache?.find(w => w.id === wordId);
    if (!word) throw new Error(`Word not found: ${wordId}`);

    const settings = await this.getSettings();
    const cooldownDays = customCooldownDays ?? settings.cooldownDays;
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let nextStage: DistillationStage = word.stage;

    if (remembered) {
      // Direct mastery into permanent long term memory
      nextStage = 'mastered';
    } else {
      // Moves to next distillation tier
      switch (word.stage) {
        case 'headlist':
          nextStage = 'd1';
          break;
        case 'd1':
          nextStage = 'd2';
          break;
        case 'd2':
          nextStage = 'd3';
          break;
        case 'd3':
          // Not remembered at D3: retry after cooldown, until the cap marks it stubborn
          word.d3Failures = (word.d3Failures ?? 0) + 1;
          if (word.d3Failures >= MAX_D3_FAILURES) {
            nextStage = 'mastered';
            word.isStubborn = true;
          } else {
            nextStage = 'd3';
          }
          break;
        default:
          nextStage = 'mastered';
      }
    }

    word.stage = nextStage;
    word.lastReviewedAt = now;
    word.reviewCount += 1;
    word.nextEligibleAt = now + cooldownMs;

    await set(STORAGE_KEYS.WORDS, this.wordsCache);
    return word;
  }

  // Batch update words
  public async saveWords(updatedWords: WordItem[]): Promise<void> {
    await this.loadCache();
    const map = new Map(updatedWords.map(w => [w.id, w]));
    this.wordsCache = (this.wordsCache || []).map(w => map.get(w.id) || w);
    await set(STORAGE_KEYS.WORDS, this.wordsCache);
  }

  // Update a page
  public async updatePage(page: GoldListPage): Promise<void> {
    await this.loadCache();
    if (this.pagesCache) {
      const idx = this.pagesCache.findIndex(p => p.id === page.id);
      if (idx !== -1) {
        this.pagesCache[idx] = page;
        await set(STORAGE_KEYS.PAGES, this.pagesCache);
      }
    }
  }

  // First visit to a page starts the cooldown for its untested headlist words
  public async startPageCooldown(pageId: number): Promise<void> {
    await this.loadCache();
    const page = this.pagesCache?.find((p) => p.id === pageId);
    if (!page || page.headlistStartedAt) return;
    const now = Date.now();
    const cooldownMs = (await this.getSettings()).cooldownDays * 24 * 60 * 60 * 1000;
    page.headlistStartedAt = now;
    (this.wordsCache || [])
      .filter((w) => w.pageId === pageId && w.stage === 'headlist' && w.reviewCount === 0)
      .forEach((w) => {
        w.nextEligibleAt = now + cooldownMs;
      });
    await set(STORAGE_KEYS.PAGES, this.pagesCache);
    await set(STORAGE_KEYS.WORDS, this.wordsCache);
  }

  // Toggle word starred
  public async toggleWordStar(wordId: string): Promise<boolean> {
    await this.loadCache();
    const word = this.wordsCache?.find((w) => w.id === wordId);
    if (!word) return false;
    word.isStarred = !word.isStarred;
    await set(STORAGE_KEYS.WORDS, this.wordsCache);
    return word.isStarred;
  }

  // Update notes for a word
  public async updateWordNotes(wordId: string, notes: string): Promise<void> {
    await this.loadCache();
    const word = this.wordsCache?.find((w) => w.id === wordId);
    if (!word) return;
    word.notes = notes;
    await set(STORAGE_KEYS.WORDS, this.wordsCache);
  }

  // Record practice result for targeted practice
  public async setPracticePassed(wordId: string, passed: boolean): Promise<void> {
    await this.loadCache();
    const word = this.wordsCache?.find((w) => w.id === wordId);
    if (!word) return;
    word.practicePassed = passed;
    await set(STORAGE_KEYS.WORDS, this.wordsCache);
  }

  public async resetPracticeProgress(wordIds: string[]): Promise<void> {
    await this.loadCache();
    const ids = new Set(wordIds);
    this.wordsCache?.forEach((w) => {
      if (ids.has(w.id)) w.practicePassed = false;
    });
    await set(STORAGE_KEYS.WORDS, this.wordsCache);
  }

  // Save last visited page bookmark
  public async setLastVisitedPage(pageId: number): Promise<void> {
    await this.loadCache();
    if (this.settingsCache) {
      this.settingsCache.lastVisitedPageId = pageId;
      await set(STORAGE_KEYS.SETTINGS, this.settingsCache);
    }
  }

  // Statistics
  public async getStats(): Promise<AppStats> {
    await this.loadCache();
    const words = this.wordsCache || [];
    const pages = this.pagesCache || [];

    let headlistCount = 0;
    let d1Count = 0;
    let d2Count = 0;
    let d3Count = 0;
    let masteredCount = 0;
    let starredCount = 0;

    for (const w of words) {
      if (w.stage === 'headlist') headlistCount++;
      else if (w.stage === 'd1') d1Count++;
      else if (w.stage === 'd2') d2Count++;
      else if (w.stage === 'd3') d3Count++;
      else if (w.stage === 'mastered') masteredCount++;

      if (w.isStarred) starredCount++;
    }

    const completedDistillations = words.reduce((acc, w) => acc + w.reviewCount, 0);

    return {
      totalWords: words.length,
      headlistCount,
      d1Count,
      d2Count,
      d3Count,
      masteredCount,
      pagesCount: pages.length,
      completedDistillations,
      starredCount,
    };
  }

  // Export all data as JSON
  public async exportBackup(): Promise<string> {
    await this.loadCache();
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: this.settingsCache,
      pages: this.pagesCache,
      words: this.wordsCache,
    };
    return JSON.stringify(backup, null, 2);
  }

  // Import backup data
  public async importBackup(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.words || !data.pages) {
        throw new Error('无效的备份文件结构');
      }
      this.wordsCache = data.words;
      this.pagesCache = data.pages;
      this.settingsCache = data.settings || DEFAULT_SETTINGS;

      await set(STORAGE_KEYS.WORDS, this.wordsCache);
      await set(STORAGE_KEYS.PAGES, this.pagesCache);
      await set(STORAGE_KEYS.SETTINGS, this.settingsCache);
      await set(STORAGE_KEYS.INITIALIZED, true);
    } catch (err) {
      console.error('Import failed:', err);
      throw err;
    }
  }

  // Reset to initial English.json
  public async resetToDefault(): Promise<void> {
    await clear();
    this.wordsCache = null;
    this.pagesCache = null;
    this.settingsCache = null;
    await this.init(true);
  }
}

export const db = new DBService();
