// Hook that sets the browser tab title dynamically per page.
// Usage: usePageTitle('Vehicles') → tab shows "Vehicles | Garahe"
import { useEffect } from 'react';

const BASE_TITLE = 'Garahe – Vehicle Maintenance Log';

export function usePageTitle(pageTitle) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | Garahe` : BASE_TITLE;
    // Reset to base title when the component unmounts
    return () => { document.title = BASE_TITLE; };
  }, [pageTitle]);
}
