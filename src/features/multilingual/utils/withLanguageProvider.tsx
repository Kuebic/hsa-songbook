import React from 'react';
import { LanguageProvider, type LanguageProviderProps } from '../contexts/LanguageContext';

/**
 * HOC to wrap components with LanguageProvider
 */
export function withLanguageProvider<P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Omit<LanguageProviderProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <LanguageProvider {...providerProps}>
        <Component {...props} />
      </LanguageProvider>
    );
  };
}