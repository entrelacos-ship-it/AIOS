import type { OpenSlideConfig } from '@open-slide/core';

// Mounted under /open-slide/ inside ai-business-os (see server.ts proxy) so
// asset URLs resolve correctly instead of leaking to the host app's root.
const openSlideConfig: OpenSlideConfig = {
  base: '/open-slide/',
};

export default openSlideConfig;
