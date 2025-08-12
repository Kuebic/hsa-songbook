/**
 * @file ChordEditorSettings.tsx
 * @description Settings panel for the ChordPro editor
 */

import React from 'react';
import { cn } from '../../../../lib/utils';
import type { SettingsProps, EditorSettings } from '../../types/editor.types';

export const ChordEditorSettings: React.FC<SettingsProps> = ({
  settings,
  onChange,
  className,
}) => {
  const handleChange = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };
  
  return (
    <div className={cn('p-4 space-y-6 bg-white rounded-lg', className)}>
      <h3 className="text-lg font-semibold text-gray-900">Editor Settings</h3>
      
      {/* Theme Selection */}
      <div className="space-y-2">
        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
          Theme
        </label>
        <select
          id="theme"
          value={settings.theme}
          onChange={(e) => handleChange('theme', e.target.value as EditorSettings['theme'])}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="stage">Stage (High Contrast)</option>
        </select>
        <p className="text-xs text-gray-500">
          Choose the editor color scheme
        </p>
      </div>
      
      {/* Font Size */}
      <div className="space-y-2">
        <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">
          Font Size: {settings.fontSize}px
        </label>
        <input
          id="fontSize"
          type="range"
          min="12"
          max="24"
          step="1"
          value={settings.fontSize}
          onChange={(e) => handleChange('fontSize', Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>12px</span>
          <span>18px</span>
          <span>24px</span>
        </div>
      </div>
      
      {/* Tab Size */}
      <div className="space-y-2">
        <label htmlFor="tabSize" className="block text-sm font-medium text-gray-700">
          Tab Size
        </label>
        <select
          id="tabSize"
          value={settings.tabSize}
          onChange={(e) => handleChange('tabSize', Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={8}>8 spaces</option>
        </select>
      </div>
      
      {/* Toggle Options */}
      <div className="space-y-3">
        {/* Show Line Numbers */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showLineNumbers}
            onChange={(e) => handleChange('showLineNumbers', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Show Line Numbers</span>
            <p className="text-xs text-gray-500">Display line numbers in the editor</p>
          </div>
        </label>
        
        {/* Word Wrap */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.wordWrap}
            onChange={(e) => handleChange('wordWrap', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Word Wrap</span>
            <p className="text-xs text-gray-500">Wrap long lines to fit the editor width</p>
          </div>
        </label>
        
        {/* Enable Autocomplete */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableAutocomplete}
            onChange={(e) => handleChange('enableAutocomplete', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Enable Autocomplete</span>
            <p className="text-xs text-gray-500">Show suggestions for chords and directives</p>
          </div>
        </label>
        
        {/* Validate Syntax */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.validateSyntax}
            onChange={(e) => handleChange('validateSyntax', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Validate Syntax</span>
            <p className="text-xs text-gray-500">Check ChordPro syntax in real-time</p>
          </div>
        </label>
        
        {/* Auto-save */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => handleChange('autoSave', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Auto-save</span>
            <p className="text-xs text-gray-500">
              Automatically save changes every {settings.autoSaveInterval / 1000} seconds
            </p>
          </div>
        </label>
      </div>
      
      {/* Auto-save Interval */}
      {settings.autoSave && (
        <div className="space-y-2">
          <label htmlFor="autoSaveInterval" className="block text-sm font-medium text-gray-700">
            Auto-save Interval
          </label>
          <select
            id="autoSaveInterval"
            value={settings.autoSaveInterval}
            onChange={(e) => handleChange('autoSaveInterval', Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
            <option value={60000}>1 minute</option>
            <option value={120000}>2 minutes</option>
            <option value={300000}>5 minutes</option>
          </select>
        </div>
      )}
      
      {/* Reset to Defaults */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            onChange({
              theme: 'light',
              fontSize: 16,
              showLineNumbers: false,
              enableAutocomplete: true,
              validateSyntax: true,
              autoSave: false,
              autoSaveInterval: 30000,
              wordWrap: true,
              tabSize: 2,
            });
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};