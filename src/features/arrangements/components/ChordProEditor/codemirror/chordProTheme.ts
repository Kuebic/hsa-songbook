/**
 * @file chordProTheme.ts
 * @description Custom themes for ChordPro editor
 */

import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Define colors for different themes
const colors = {
  light: {
    background: '#ffffff',
    foreground: '#111827',
    caret: '#111827',
    selection: '#3b82f620',
    selectionMatch: '#3b82f610',
    lineHighlight: '#f3f4f6',
    gutterBackground: '#f9fafb',
    gutterForeground: '#6b7280',
    gutterBorder: '#e5e7eb',
    chord: '#2563eb',
    chordBg: 'rgba(37, 99, 235, 0.1)',
    directive: '#16a34a',
    section: '#9333ea',
    comment: '#6b7280',
    string: '#dc2626',
    bracket: '#6b7280',
  },
  dark: {
    background: '#1f2937',
    foreground: '#e5e7eb',
    caret: '#ffffff',
    selection: '#3b82f640',
    selectionMatch: '#3b82f620',
    lineHighlight: '#374151',
    gutterBackground: '#111827',
    gutterForeground: '#9ca3af',
    gutterBorder: '#374151',
    chord: '#60a5fa',
    chordBg: 'rgba(96, 165, 250, 0.1)',
    directive: '#4ade80',
    section: '#c084fc',
    comment: '#9ca3af',
    string: '#f87171',
    bracket: '#9ca3af',
  },
  stage: {
    background: '#000000',
    foreground: '#fef3c7',
    caret: '#fde047',
    selection: '#fde04740',
    selectionMatch: '#fde04720',
    lineHighlight: '#1a1a1a',
    gutterBackground: '#0a0a0a',
    gutterForeground: '#fde047',
    gutterBorder: '#333333',
    chord: '#fde047',
    chordBg: 'rgba(253, 224, 71, 0.1)',
    directive: '#86efac',
    section: '#d8b4fe',
    comment: '#d1d5db',
    string: '#fbbf24',
    bracket: '#fde047',
  }
};

// Create theme extension for each variant
export function createChordProTheme(variant: 'light' | 'dark' | 'stage' = 'light'): Extension {
  const c = colors[variant];
  
  // Editor theme styles
  const theme = EditorView.theme({
    '&': {
      color: c.foreground,
      backgroundColor: c.background,
      fontSize: '16px',
    },
    '.cm-content': {
      caretColor: c.caret,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      lineHeight: '1.5',
      padding: '16px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: c.caret,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: c.selection,
    },
    '.cm-activeLine': {
      backgroundColor: c.lineHighlight,
    },
    '.cm-activeLineGutter': {
      backgroundColor: c.lineHighlight,
    },
    '.cm-selectionMatch': {
      backgroundColor: c.selectionMatch,
    },
    '.cm-gutters': {
      backgroundColor: c.gutterBackground,
      color: c.gutterForeground,
      borderRight: `1px solid ${c.gutterBorder}`,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px',
      minWidth: '30px',
    },
    '.cm-foldGutter .cm-gutterElement': {
      padding: '0 4px',
    },
    '.cm-line': {
      padding: '0',
    },
    '.cm-tooltip': {
      backgroundColor: c.background,
      border: `1px solid ${c.gutterBorder}`,
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '14px',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: c.selection,
      },
    },
    '.cm-completionIcon': {
      marginRight: '0.5em',
    },
    '.cm-completionDetail': {
      marginLeft: '0.5em',
      fontStyle: 'italic',
      color: c.comment,
    },
    '.cm-diagnosticError': {
      borderLeft: `3px solid #ef4444`,
    },
    '.cm-diagnosticWarning': {
      borderLeft: `3px solid #f59e0b`,
    },
    '.cm-searchMatch': {
      backgroundColor: '#fbbf2440',
      outline: '1px solid #fbbf24',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#fb923c60',
    },
    // Custom styles for chord highlights
    '.cm-chord': {
      color: c.chord,
      backgroundColor: c.chordBg,
      padding: '0 4px',
      borderRadius: '3px',
      fontWeight: '600',
    },
    '.cm-directive': {
      color: c.directive,
      fontWeight: '500',
    },
    '.cm-section': {
      color: c.section,
      fontWeight: '500',
      fontStyle: 'italic',
    },
  }, variant === 'dark' ? { dark: true } : {});

  // Syntax highlighting styles
  const highlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: c.directive, fontWeight: '500' },
    { tag: t.atom, color: c.chord, fontWeight: '600' },
    { tag: t.comment, color: c.comment, fontStyle: 'italic' },
    { tag: t.string, color: c.string },
    { tag: t.tagName, color: c.section, fontWeight: '500', fontStyle: 'italic' },
    { tag: [t.bracket, t.punctuation], color: c.bracket },
    { tag: t.variableName, color: c.foreground },
  ]);

  return [theme, syntaxHighlighting(highlightStyle)];
}