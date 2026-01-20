/**
 * Content Moderation System
 * Automatic moderation with blocked words and patterns
 */

const STORAGE_KEY = 'blocked_words';

// Default blocked words (will be stored/managed via localStorage for admin customization)
const DEFAULT_BLOCKED_WORDS = [
  // Portuguese offensive words
  'idiota', 'burro', 'imbecil', 'otário', 'babaca', 'cretino', 'estúpido',
  // Spam patterns
  'compre agora', 'clique aqui', 'ganhe dinheiro', 'trabalhe em casa',
  // Common insults
  'lixo', 'inútil', 'merda', 'bosta',
];

export interface ModerationResult {
  isBlocked: boolean;
  blockedWords: string[];
  sanitizedContent: string;
}

export const getBlockedWords = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_BLOCKED_WORDS;
    }
  }
  // Initialize with defaults if not set
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BLOCKED_WORDS));
  return DEFAULT_BLOCKED_WORDS;
};

export const setBlockedWords = (words: string[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
};

export const addBlockedWord = (word: string): void => {
  const words = getBlockedWords();
  const normalizedWord = word.toLowerCase().trim();
  if (!words.includes(normalizedWord)) {
    words.push(normalizedWord);
    setBlockedWords(words);
  }
};

export interface ImportResult {
  added: number;
  duplicates: number;
  invalid: number;
  total: number;
}

/**
 * Import multiple blocked words from a text (one word per line or comma-separated)
 */
export const importBlockedWords = (text: string, mode: 'merge' | 'replace' = 'merge'): ImportResult => {
  // Split by newlines and commas, then clean up
  const inputWords = text
    .split(/[\n,]+/)
    .map(word => word.toLowerCase().trim())
    .filter(word => word.length > 0);

  const existingWords = mode === 'replace' ? [] : getBlockedWords();
  const existingSet = new Set(existingWords);
  
  let added = 0;
  let duplicates = 0;
  let invalid = 0;

  const newWords = [...existingWords];

  for (const word of inputWords) {
    // Basic validation: at least 2 characters
    if (word.length < 2) {
      invalid++;
      continue;
    }

    if (existingSet.has(word)) {
      duplicates++;
    } else {
      newWords.push(word);
      existingSet.add(word);
      added++;
    }
  }

  setBlockedWords(newWords);

  return {
    added,
    duplicates,
    invalid,
    total: inputWords.length,
  };
};

/**
 * Export blocked words as a text file content
 */
export const exportBlockedWords = (): string => {
  return getBlockedWords().join('\n');
};

export const removeBlockedWord = (word: string): void => {
  const words = getBlockedWords();
  const normalizedWord = word.toLowerCase().trim();
  const filtered = words.filter(w => w !== normalizedWord);
  setBlockedWords(filtered);
};

export const resetToDefaultBlockedWords = (): void => {
  setBlockedWords(DEFAULT_BLOCKED_WORDS);
};

/**
 * Checks content for blocked words and returns moderation result
 */
export const moderateContent = (content: string): ModerationResult => {
  const blockedWords = getBlockedWords();
  const contentLower = content.toLowerCase();
  const foundBlockedWords: string[] = [];
  
  // Check for exact word matches and phrases
  for (const word of blockedWords) {
    const wordPattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    if (wordPattern.test(contentLower)) {
      foundBlockedWords.push(word);
    }
  }

  // Create sanitized content by replacing blocked words with asterisks
  let sanitizedContent = content;
  for (const word of foundBlockedWords) {
    const wordPattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    sanitizedContent = sanitizedContent.replace(wordPattern, '*'.repeat(word.length));
  }

  return {
    isBlocked: foundBlockedWords.length > 0,
    blockedWords: foundBlockedWords,
    sanitizedContent,
  };
};

/**
 * Quick check if content contains any blocked words
 */
export const containsBlockedContent = (content: string): boolean => {
  return moderateContent(content).isBlocked;
};

/**
 * Escape special regex characters in a string
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Get suggestions for similar blocked words (for admin use)
 */
export const getSimilarBlockedWords = (input: string): string[] => {
  const blockedWords = getBlockedWords();
  const inputLower = input.toLowerCase().trim();
  
  return blockedWords.filter(word => 
    word.includes(inputLower) || inputLower.includes(word)
  );
};
