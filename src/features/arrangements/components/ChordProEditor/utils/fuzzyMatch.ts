/**
 * Fuzzy matching utilities for ChordPro editor autocomplete
 * Provides intelligent searching including:
 * - Exact matching
 * - Prefix matching
 * - CamelCase matching
 * - Fuzzy substring matching
 */

import React from 'react';

export interface FuzzyMatchOptions {
  caseSensitive?: boolean;
  prioritizePrefix?: boolean;
  prioritizeCamelCase?: boolean;
  threshold?: number; // 0-1, higher means more strict
}

export interface FuzzyMatchResult {
  score: number;
  matches: number[]; // Character positions that matched
}

/**
 * Match CamelCase abbreviations
 * e.g., "soc" matches "start_of_chorus"
 */
function matchCamelCase(query: string, target: string): FuzzyMatchResult | null {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Extract word boundaries (after underscore, or capital letters)
  const wordStarts: number[] = [0];
  for (let i = 1; i < target.length; i++) {
    if (target[i - 1] === '_' || 
        (target[i] === target[i].toUpperCase() && target[i] !== target[i].toLowerCase())) {
      wordStarts.push(i);
    }
  }
  
  // Try to match query against word starts
  let queryIdx = 0;
  const matches: number[] = [];
  
  for (const startIdx of wordStarts) {
    if (queryIdx >= queryLower.length) break;
    
    if (targetLower[startIdx] === queryLower[queryIdx]) {
      matches.push(startIdx);
      queryIdx++;
    }
  }
  
  if (queryIdx === queryLower.length) {
    // All query characters matched at word boundaries
    return {
      score: 800 - (target.length - query.length) * 2,
      matches
    };
  }
  
  return null;
}

/**
 * Calculate bonus score based on match position and context
 */
function calculateBonus(
  text: string,
  position: number,
  prevMatched: boolean
): number {
  let bonus = 0;
  
  // Bonus for matching at start
  if (position === 0) {
    bonus += 15;
  }
  
  // Bonus for matching after separator
  if (position > 0) {
    const prevChar = text[position - 1];
    if (prevChar === '_' || prevChar === '-' || prevChar === ' ') {
      bonus += 10;
    }
  }
  
  // Bonus for consecutive matches
  if (prevMatched) {
    bonus += 5;
  }
  
  return bonus;
}

/**
 * Fuzzy substring matching with scoring
 */
function fuzzyMatchWithDistance(
  query: string,
  target: string
): FuzzyMatchResult | null {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  let queryIdx = 0;
  let targetIdx = 0;
  let score = 0;
  const matches: number[] = [];
  let prevMatched = false;
  let firstMatchIdx = -1;
  
  while (queryIdx < queryLower.length && targetIdx < targetLower.length) {
    if (queryLower[queryIdx] === targetLower[targetIdx]) {
      if (firstMatchIdx === -1) {
        firstMatchIdx = targetIdx;
      }
      
      matches.push(targetIdx);
      score += 10 + calculateBonus(target, targetIdx, prevMatched);
      queryIdx++;
      prevMatched = true;
    } else {
      prevMatched = false;
      // Penalty for gaps
      if (matches.length > 0) {
        score -= 1;
      }
    }
    targetIdx++;
  }
  
  // Check if all query characters were matched
  if (queryIdx === queryLower.length) {
    // Additional scoring factors
    const coverage = matches.length / target.length;
    const spread = matches[matches.length - 1] - matches[0];
    
    // Bonus for compact matches (less spread)
    score += Math.max(0, 20 - spread);
    
    // Bonus for higher coverage
    score += coverage * 10;
    
    // Penalty for starting late
    if (firstMatchIdx > 0) {
      score -= firstMatchIdx * 2;
    }
    
    return { score, matches };
  }
  
  return null;
}

/**
 * Main fuzzy matching function
 * Returns match result with score and matched positions
 */
export function fuzzyMatch(
  query: string,
  target: string,
  options: FuzzyMatchOptions = {}
): FuzzyMatchResult | null {
  const {
    caseSensitive = false,
    prioritizePrefix = true,
    prioritizeCamelCase = true,
    threshold = 0
  } = options;
  
  if (!query || !target) {
    return null;
  }
  
  // Normalize for comparison
  const q = caseSensitive ? query : query.toLowerCase();
  const t = caseSensitive ? target : target.toLowerCase();
  
  // Fast path: exact match
  if (q === t) {
    return {
      score: 1000,
      matches: Array.from({ length: q.length }, (_, i) => i)
    };
  }
  
  // Fast path: prefix match (high priority for ChordPro)
  if (prioritizePrefix && t.startsWith(q)) {
    return {
      score: 900 - (t.length - q.length),
      matches: Array.from({ length: q.length }, (_, i) => i)
    };
  }
  
  // CamelCase matching for abbreviations
  if (prioritizeCamelCase) {
    const camelCaseResult = matchCamelCase(query, target);
    if (camelCaseResult) {
      return camelCaseResult;
    }
  }
  
  // Fuzzy matching
  const fuzzyResult = fuzzyMatchWithDistance(query, target);
  
  // Apply threshold
  if (fuzzyResult && fuzzyResult.score >= threshold) {
    return fuzzyResult;
  }
  
  return null;
}

/**
 * Sort items by fuzzy match score
 */
export function sortByFuzzyScore<T>(
  items: T[],
  query: string,
  getValue: (item: T) => string,
  options: FuzzyMatchOptions = {}
): Array<T & { fuzzyScore: number; fuzzyMatches: number[] }> {
  if (!query) {
    return items.map(item => ({
      ...item,
      fuzzyScore: 0,
      fuzzyMatches: []
    }));
  }
  
  const scored = items
    .map(item => {
      const value = getValue(item);
      const result = fuzzyMatch(query, value, options);
      return {
        ...item,
        fuzzyScore: result?.score || 0,
        fuzzyMatches: result?.matches || []
      };
    })
    .filter(item => item.fuzzyScore > 0);
  
  return scored.sort((a, b) => b.fuzzyScore - a.fuzzyScore);
}

/**
 * Highlight matched characters in text
 */
export function highlightMatches(
  text: string,
  matches: number[]
): React.ReactElement {
  if (!matches || matches.length === 0) {
    return React.createElement(React.Fragment, null, text);
  }
  
  const parts: React.ReactElement[] = [];
  let lastIdx = 0;
  
  matches.forEach((matchIdx, i) => {
    // Add unmatched part
    if (matchIdx > lastIdx) {
      parts.push(
        React.createElement('span', {
          key: `unmatch-${i}`
        }, text.substring(lastIdx, matchIdx))
      );
    }
    
    // Add matched character with highlight
    parts.push(
      React.createElement('strong', {
        key: `match-${i}`,
        className: 'fuzzy-match-highlight'
      }, text[matchIdx])
    );
    
    lastIdx = matchIdx + 1;
  });
  
  // Add remaining unmatched part
  if (lastIdx < text.length) {
    parts.push(
      React.createElement('span', {
        key: 'unmatch-last'
      }, text.substring(lastIdx))
    );
  }
  
  return React.createElement(React.Fragment, null, ...parts);
}