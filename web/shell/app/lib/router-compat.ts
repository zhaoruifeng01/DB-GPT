import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams as useRRSearchParams } from 'react-router';

export interface AppRouter {
  push: (to: string) => void;
  replace: (to: string) => void;
  back: () => void;
  reload: () => void;
  pathname: string;
  asPath: string;
  query: Record<string, string | string[] | undefined>;
  isFallback: boolean;
}

export function useRouter(): AppRouter {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useRRSearchParams();

  const query = useMemo<Record<string, string | string[] | undefined>>(() => {
    const merged: Record<string, string | string[] | undefined> = { ...params };
    searchParams.forEach((value: string, key: string) => {
      const existing = merged[key];
      if (existing === undefined) {
        merged[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        merged[key] = [existing, value];
      }
    });
    return merged;
  }, [params, searchParams]);

  return {
    push: useCallback((to: string) => navigate(to), [navigate]),
    replace: useCallback((to: string) => navigate(to, { replace: true }), [navigate]),
    back: useCallback(() => navigate(-1), [navigate]),
    reload: useCallback(() => window.location.reload(), []),
    pathname: location.pathname,
    asPath: `${location.pathname}${location.search}${location.hash}`,
    query,
    isFallback: false,
  };
}

export function useSearchParams(): URLSearchParams {
  const [params] = useRRSearchParams();
  return params;
}

const Router = {
  events: {
    on: () => {},
    off: () => {},
  },
  push: (to: string) => {
    window.history.pushState(null, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
  replace: (to: string) => {
    window.history.replaceState(null, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
};

export default Router;
