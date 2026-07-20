import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { usePreferences } from '~/store/preferences';

export default function FlowLibroPage() {
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const theme = usePreferences(state => state.theme);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [libroOrigin, setLibroOrigin] = useState('');
  const id = searchParams.get('id') || '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLibroOrigin(`${window.location.protocol}//${window.location.hostname}:5671`);
  }, []);

  useEffect(() => {
    if (!libroOrigin) return;
    const handleLanguageChange = (lng: string) => {
      iframeRef.current?.contentWindow?.postMessage(`lang:${lng}`, libroOrigin);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, libroOrigin]);

  useEffect(() => {
    if (!libroOrigin) return;
    iframeRef.current?.contentWindow?.postMessage(`theme:${theme}`, libroOrigin);
  }, [libroOrigin, theme]);

  const src = useMemo(() => {
    if (!libroOrigin) return 'about:blank';
    return `${libroOrigin}/dbgpt?flow_uid=${encodeURIComponent(id)}`;
  }, [id, libroOrigin]);

  return <iframe title='DB-GPT Libro Flow' src={src} className='h-full w-full' ref={iframeRef} />;
}
