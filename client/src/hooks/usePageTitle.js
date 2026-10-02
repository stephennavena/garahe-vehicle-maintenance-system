import { useEffect } from 'react';

const BASE_TITLE = 'Garahe – Vehicle Maintenance Log';

export function usePageTitle(pageTitle) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | Garahe` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [pageTitle]);
}
