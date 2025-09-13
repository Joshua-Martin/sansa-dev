import {
  TrendingUp,
  Eye,
  Download,
  Calendar,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Target,
  Star,
} from 'lucide-react';
import React from 'react';

import { Badge } from './badge';

import { cn } from '../../lib/utils/utils';

/**
 * Intent signal types that can be displayed
 *
 * - 'website_visit': User visited the website
 * - 'content_download': User downloaded content
 * - 'demo_request': User requested a demo
 * - 'email_engagement': User engaged with an email
 * - 'pricing_page_view': User viewed the pricing page
 * - 'contact_form': User submitted a contact form
 * - 'phone_inquiry': User made a phone inquiry
 * - 'social_engagement': User engaged on social media
 * - 'competitor_research': User researched competitors
 * - 'hiring': User showed hiring intent (e.g., job posting)
 * - 'attended_event': User attended an event
 * - 'job_application': User applied for a job
 * - 'webinar_signup': User signed up for a webinar
 * - 'newsletter_signup': User signed up for a newsletter
 * - 'product_trial': User started a product trial
 * - 'feature_request': User submitted a feature request
 * - 'support_ticket': User submitted a support ticket
 * - 'account_upgrade': User upgraded their account
 * - 'account_cancellation': User cancelled their account
 * - 'referral': User referred another user
 * - 'partner_signup': User signed up as a partner
 */
export type IntentSignalType =
  | 'website_visit'
  | 'content_download'
  | 'demo_request'
  | 'email_engagement'
  | 'pricing_page_view'
  | 'contact_form'
  | 'phone_inquiry'
  | 'social_engagement'
  | 'competitor_research'
  | 'hiring'
  | 'attended_event'
  | 'attended_demo_call'
  | 'job_application'
  | 'webinar_signup'
  | 'newsletter_signup'
  | 'product_trial'
  | 'feature_request'
  | 'support_ticket'
  | 'account_upgrade'
  | 'account_cancellation'
  | 'referral'
  | 'partner_signup'
  | 'review_activity';

/**
 * Intent levels from lowest to highest
 */
export type IntentLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

interface IntentBadgeProps {
  /**
   * The type of intent signal
   */
  type: IntentSignalType;
  /**
   * The level of intent (determines color)
   */
  level: IntentLevel;
  /**
   * Optional custom label to display instead of the default type label
   */
  label?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get the appropriate icon for each intent signal type
 */
const getIntentIcon = (type: IntentSignalType) => {
  const iconMap: Record<
    IntentSignalType,
    React.ComponentType<{ className?: string }>
  > = {
    website_visit: Globe,
    content_download: Download,
    demo_request: Calendar,
    email_engagement: Mail,
    pricing_page_view: TrendingUp,
    contact_form: Target,
    phone_inquiry: Phone,
    social_engagement: MessageSquare,
    competitor_research: Eye,
    hiring: Target, // Could use a more specific icon if available
    attended_event: Calendar,
    attended_demo_call: Phone,
    job_application: Mail,
    webinar_signup: Calendar,
    newsletter_signup: Mail,
    product_trial: TrendingUp,
    feature_request: MessageSquare,
    support_ticket: MessageSquare,
    account_upgrade: TrendingUp,
    account_cancellation: Eye,
    referral: Globe,
    partner_signup: Globe,
    review_activity: Star,
  };

  return iconMap[type] || Target;
};

/**
 * Get the default label for each intent signal type
 */
const getIntentLabel = (type: IntentSignalType): string => {
  const labelMap: Record<IntentSignalType, string> = {
    website_visit: 'Website Visit',
    content_download: 'Content Download',
    demo_request: 'Demo Request',
    email_engagement: 'Email Engagement',
    pricing_page_view: 'Pricing View',
    contact_form: 'Contact Form',
    phone_inquiry: 'Phone Inquiry',
    social_engagement: 'Social Engagement',
    competitor_research: 'Research',
    hiring: 'Hiring',
    attended_event: 'Attended Event',
    attended_demo_call: 'Demo Call',
    job_application: 'Job Application',
    webinar_signup: 'Webinar Signup',
    newsletter_signup: 'Newsletter Signup',
    product_trial: 'Product Trial',
    feature_request: 'Feature Request',
    support_ticket: 'Support Ticket',
    account_upgrade: 'Account Upgrade',
    account_cancellation: 'Account Cancellation',
    referral: 'Referral',
    partner_signup: 'Partner Signup',
    review_activity: 'Review Activity',
  };

  return labelMap[type] || 'Intent Signal';
};

/**
 * Get the color variant and styling for each intent level
 */
const getIntentStyling = (level: IntentLevel) => {
  const stylingMap: Record<
    IntentLevel,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      className: string;
    }
  > = {
    very_low: {
      variant: 'outline',
      className: 'border-gray-300 text-gray-600 bg-gray-50',
    },
    low: {
      variant: 'outline',
      className: 'border-blue-300 text-blue-700 bg-blue-50',
    },
    medium: {
      variant: 'secondary',
      className: 'border-yellow-300 text-yellow-800 bg-yellow-100',
    },
    high: {
      variant: 'default',
      className: 'border-orange-300 text-orange-800 bg-orange-100',
    },
    very_high: {
      variant: 'destructive',
      className: 'border-red-300 text-red-800 bg-red-100',
    },
  };

  return stylingMap[level];
};

/**
 * IntentBadge Component
 *
 * Displays an intent signal badge with appropriate icon, color, and label
 * based on the intent type and level. Colors range from gray (very low)
 * to red (very high) intent.
 */
export const IntentBadge: React.FC<IntentBadgeProps> = ({
  type,
  level,
  label,
  className,
}) => {
  const Icon = getIntentIcon(type);
  const displayLabel = label || getIntentLabel(type);
  const styling = getIntentStyling(level);

  return (
    <Badge
      variant={styling.variant}
      className={cn(
        'flex items-center gap-1 text-xs px-2 py-1',
        styling.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{displayLabel}</span>
    </Badge>
  );
};

export default IntentBadge;
