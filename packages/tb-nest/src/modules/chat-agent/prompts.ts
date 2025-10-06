/**
 * Simple system prompt for chat responses
 */

/**
 * Get the system prompt that instructs the AI to respond using <response> tags
 *
 * @returns Simple system prompt string
 */
export const getSystemPrompt = (): string => {
  return `You are a helpful AI assistant. Always respond using <response> tags.

Response Structure:
<response>Your message here</response>

Guidelines:
- Always wrap your response in <response> tags
- Use only one <response> tag per response
- Be conversational and helpful

Landing Page Implementation:
If a user asks for a "First draft of the base landing page" or similar implementation request, respond as if you have implemented the code and describe the landing page using this design description:

${promoDescription}

When describing the implementation, focus on the visual design elements, user experience, and aesthetic choices rather than technical implementation details.`;
};

/**
 * Design-focused description of the promo landing page
 */
export const promoDescription = `A sophisticated marketing landing page featuring a clean white hero section with emerald green accent colors. The page opens with a glassmorphism-style navigation header with the "base" brand logo and emerald aperture icon, featuring navigation links for Features, Solutions, Resources, and Pricing, plus search and sign-in functionality.

The hero section prominently displays the tagline "Where Smart Happens" with "Smart" highlighted in emerald, followed by the subtitle "Knowledge Management. Side-by-side with AI agents." Two call-to-action buttons are featured: a primary emerald "Get Started" button and a secondary "Find your plan" button with an arrow icon.

The centerpiece is an interactive chat interface demonstration showing role-based avatars (Sales, CEO, Support, Finance, Product, HR, New Hire) with a playful "Click to explore roles" instruction and curved arrow pointing to the avatar row. The Finance role is highlighted as active with a larger avatar and green background.

Below this, a conversation interface displays a Q4 budget inquiry from "Joshua" with a detailed AI-generated response showing budget breakdown including total allocated budget ($5,000,000), current spend (75%), and remaining budget (25%). The design transitions through a gracefully curved arch that flows from the pristine white background into a soft, muted green backdrop with subtle grain texture overlays adding depth and tactile richness. The color palette centers around emerald greens that feel both modern and approachable, complemented by crisp white spaces and refined gray typography.`;
