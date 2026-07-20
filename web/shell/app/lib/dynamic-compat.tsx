import type { ComponentType, ReactNode } from 'react';
import { Suspense, createElement, isValidElement, lazy } from 'react';

export interface DynamicOptions {
  loading?: ReactNode | ComponentType<DynamicLoadingProps>;
  ssr?: boolean;
}

export interface DynamicLoadingProps {
  error?: Error | null;
  isLoading?: boolean;
  pastDelay?: boolean;
  retry?: () => void;
  timedOut?: boolean;
}

export interface LoadableGeneratedOptions {
  loadableGenerated?: {
    test?: RegExp;
    modules?: string[];
  };
}

type DynamicImport<T> = () => Promise<{ default: ComponentType<T> }>;

export function dynamic<T extends object = Record<string, never>>(
  loader: DynamicImport<T>,
  options: DynamicOptions & LoadableGeneratedOptions = {},
): ComponentType<T> {
  void options.ssr;
  void options.loadableGenerated;

  const LazyComponent = lazy(loader);

  function DynamicComponent(props: T) {
    const Loading = options.loading;
    const LazyComponentForRender = LazyComponent as unknown as ComponentType<Record<string, unknown>>;
    const fallback =
      typeof Loading === 'function'
        ? createElement(Loading, { isLoading: true })
        : isValidElement(Loading)
          ? Loading
          : null;

    return (
      <Suspense fallback={fallback}>
        {createElement(LazyComponentForRender, props as Record<string, unknown>)}
      </Suspense>
    );
  }

  DynamicComponent.displayName = 'DynamicCompat';
  return DynamicComponent;
}

export default dynamic;
