'use client';

import React from 'react';
import { SansaAnatomyExplorer } from '../../../components/custom/promo/sansa-anatomy-explorer';
import { PromoAnatomyContent } from '../../../components/custom/promo/promo-anatomy-content';

/**
 * PromoPage Component
 *
 * Interactive promo page showing an "anatomy of a call" comparison between
 * routed calls and baseline calls with SVG annotations. Hover over elements
 * to see detailed explanations at the bottom of the page.
 */
export default function PromoPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
        <div className="w-full max-w-7xl">
    <SansaAnatomyExplorer>
      <PromoAnatomyContent />
    </SansaAnatomyExplorer>
    </div>
    </div>
  );
}
