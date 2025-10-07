'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../../lib/utils/utils';

/**
 * Available sections that can be highlighted in the anatomy explorer
 */
export type AnatomySection =
  | 'routed-call'
  | 'baseline-call'
  | 'cost-savings'
  | 'unrouted-call'
  | 'semantic-similarity'
  | null;

/**
 * Explanation data for each anatomy section
 */
interface SectionExplanation {
  title: string;
  description: string;
  details?: string[];
}

/**
 * Context for managing hover states across the anatomy explorer
 */
interface AnatomyExplorerContextType {
  activeSection: AnatomySection;
  setActiveSection: (section: AnatomySection) => void;
}

const AnatomyExplorerContext = createContext<AnatomyExplorerContextType | undefined>(undefined);

/**
 * Hook to access the anatomy explorer context
 *
 * @returns The anatomy explorer context
 * @throws Error if used outside of AnatomyExplorerProvider
 */
export const useAnatomyExplorer = (): AnatomyExplorerContextType => {
  const context = useContext(AnatomyExplorerContext);
  if (!context) {
    throw new Error('useAnatomyExplorer must be used within AnatomyExplorerProvider');
  }
  return context;
};

/**
 * Explanations for each anatomy section
 */
const SECTION_EXPLANATIONS: Record<Exclude<AnatomySection, null>, SectionExplanation> = {
  'routed-call': {
    title: 'Routed Call',
    description: 'Smart routing automatically selects the most cost-effective model (GPT-4o-mini) that can handle this simple response.',
    details: [
      'Analyzes query complexity in real-time',
      'Routes to cheaper models when appropriate',
      'Maintains quality while reducing costs',
    ],
  },
  'baseline-call': {
    title: 'Baseline Call',
    description: 'Without routing, every call goes to your default model (Claude Opus 4), regardless of complexity.',
    details: [
      'Uses premium model for all requests',
      'No cost optimization',
      'Higher costs for simple queries',
    ],
  },
  'cost-savings': {
    title: 'Cost Savings',
    description: 'Direct comparison showing how routing reduces costs while maintaining response quality.',
    details: [
      'Compare costs between models',
      'See savings per request',
      'Significant savings at scale',
    ],
  },
  'unrouted-call': {
    title: 'Unrouted Call',
    description: 'A previous call without smart routing used Claude Opus 4 directly.',
    details: [
      'Fixed model selection',
      'No dynamic optimization',
      'Standard pricing applies',
    ],
  },
  'semantic-similarity': {
    title: 'Semantic Similarity',
    description: 'Both routed and baseline calls produce semantically identical responses, ensuring quality is maintained.',
    details: [
      'Validates response quality',
      'Ensures consistency',
      'Quality-first routing decisions',
    ],
  },
};

/**
 * Props for the AnatomyExplorer component
 */
interface AnatomyExplorerProps {
  /**
   * The content to display in the explorer
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes for the container
   */
}

/**
 * SansaAnatomyExplorer Component
 *
 * A wrapper component that provides interactive hover states and explanations
 * for the anatomy of AI routing calls. Displays hoverable elements with
 * contextual information in a bottom panel.
 *
 * @param props - Component props
 * @returns The anatomy explorer with interactive features
 */
export function SansaAnatomyExplorer({ children }: AnatomyExplorerProps) {
  const [activeSection, setActiveSection] = useState<AnatomySection>('routed-call');

  const explanation = activeSection ? SECTION_EXPLANATIONS[activeSection] : null;

  return (
    <AnatomyExplorerContext.Provider value={{ activeSection, setActiveSection }}>
      <div className="flex flex-col border-border border rounded-lg">
        {/* Main content area */}
        <div className="flex-1">{children}</div>

        {/* Explanation panel at the bottom - always visible */}
        <div className="bg-background border-t border-border">
          {explanation && (
            <div className="max-w-5xl mx-auto px-8 py-6">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{explanation.title}</h3>
                <p className="text-base text-muted-foreground">{explanation.description}</p>
                {explanation.details && explanation.details.length > 0 && (
                  <ul className="space-y-1 mt-3">
                    {explanation.details.map((detail, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <span className="mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnatomyExplorerContext.Provider>
  );
}

/**
 * Props for the HoverableSection component
 */
interface HoverableSectionProps {
  /**
   * The section identifier
   */
  section: Exclude<AnatomySection, null>;
  /**
   * The content to wrap
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * HoverableSection Component
 *
 * A wrapper for content sections that should trigger explanations on hover.
 *
 * @param props - Component props
 * @returns A hoverable section that updates the active explanation
 */
export function HoverableSection({ section, children, className }: HoverableSectionProps) {
  const { activeSection, setActiveSection } = useAnatomyExplorer();
  const isActive = activeSection === section;

  return (
    <div
      className={cn(
        'transition-all duration-200',
        isActive && 'ring-2 ring-primary ring-offset-2 rounded-lg',
        className
      )}
      onMouseEnter={() => setActiveSection(section)}
      onMouseLeave={() => setActiveSection('routed-call')}
    >
      {children}
    </div>
  );
}

