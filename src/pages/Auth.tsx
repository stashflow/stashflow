import { useEffect } from 'react';

export default function Auth() {
  useEffect(() => {
    // Always redirect to the preview domain's auth page
    window.location.href = 'https://stashflow-github-m8iu5a7u8-sickleedges-projects.vercel.app/auth';
  }, []);

  return null;
}
