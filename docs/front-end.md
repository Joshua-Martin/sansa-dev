# Frontend Overview - AI Landing Page Studio

## Core Philosophy and Approach

The frontend serves as a streamlined interface that prioritizes the conversational experience with AI while providing immediate visual feedback through live preview capabilities. Following MVP principles, the interface focuses on two primary elements: an intuitive chat interface for natural language interactions and a responsive preview area that displays real-time changes to the user's landing page.

The architecture embraces simplicity and performance, utilizing Next.js App Router for server-side rendering benefits while maintaining rich client-side interactivity through React components and Zustand state management. The design philosophy centers on progressive disclosure, showing users exactly what they need when they need it, without overwhelming them with technical complexity.

## User Interface Architecture

### Layout and Visual Hierarchy

The frontend employs a clean two-panel layout that maximizes both conversation flow and preview visibility. The chat interface occupies 25% of the screen width, positioned as a sidebar that maintains consistent visibility throughout the user's session. This positioning allows for continuous conversation flow while keeping the primary focus on the visual output in the preview area.

The preview area consumes the remaining 75% of screen real estate, providing ample space for users to see their landing page at realistic sizes across different device breakpoints. This allocation reflects the visual-first nature of the application, where users need to immediately see the results of their natural language requests.

The interface maintains a consistent header area for project identification, settings access, and primary navigation. Footer space is minimized to maximize the working area, with essential controls integrated contextually within the main panels.

### Responsive Preview System

The preview system offers multiple device simulation modes, allowing users to see how their landing page will appear across desktop, tablet, and mobile viewports. Rather than complex device emulation, the system uses CSS media query simulation combined with iframe resizing to provide accurate responsive previews.

Users can switch between preview modes using intuitive device icons, with the iframe smoothly transitioning between different viewport sizes. Each mode maintains proper aspect ratios and realistic screen dimensions, giving users confidence in how their pages will appear to actual visitors.

The preview iframe supports full interactivity, allowing users to click buttons, fill forms, and navigate through their landing page as end users would. This interactive capability helps users understand user experience flows and identify areas that need improvement through natural conversation with the AI.

## Chat Interface Design

### Conversation Flow and User Experience

The chat interface provides a familiar messaging experience that encourages natural language communication. Messages appear in a chronological feed with clear visual distinction between user inputs and AI responses. The interface supports rich text formatting in AI responses, allowing the AI to provide structured explanations, bullet points, and emphasis where helpful.

User messages appear with immediate confirmation, while AI responses stream in character by character, creating a natural conversational rhythm. Loading states appear instantly when users send messages, with typing indicators providing feedback during AI processing time.

The input area features a comfortable text area that expands with longer messages, along with a prominent send button. The interface supports keyboard shortcuts for power users while remaining approachable for casual interaction.

### Message Types and Formatting

The chat system handles various message types to support different interaction patterns. User messages are primarily text-based natural language requests, ranging from high-level design directions to specific content changes and styling adjustments.

AI responses include explanatory text about changes being made, confirmations of completed actions, and helpful suggestions for further improvements. When errors occur during patch application or build processes, these appear as conversational responses that explain the issue in user-friendly terms and suggest potential solutions.

The interface supports message threading conceptually, where related exchanges about specific features or sections can be followed easily within the chronological flow. Users can reference earlier messages naturally in conversation, and the AI maintains context throughout the session.

## State Management Architecture

### Zustand Store Structure

The frontend uses Zustand for client-side state management, organized around key functional areas that reflect the user's workflow. The chat store manages conversation history, message streaming state, loading indicators, and WebSocket connection status. This centralized chat state ensures consistent behavior across all chat-related components.

Project state handling focuses on basic project metadata, current preview URL, active device mode, and connection status with the backend preview infrastructure. The state management avoids complex file system representations, instead relying on simple identifiers and URLs for preview coordination.

UI state management covers modal visibility, notification states, settings panel toggles, and other ephemeral interface concerns. This separation allows for clean component architecture where each component can access relevant state without unnecessary coupling.

### Real-time State Synchronization

The frontend maintains WebSocket connections for real-time chat streaming, receiving AI responses character by character and updating the chat interface smoothly. The connection management includes automatic reconnection logic, connection status indicators, and graceful degradation when connectivity issues occur.

Preview updates happen automatically through Hot Module Replacement without requiring explicit state management. When the AI applies changes to the user's project, the backend handles file updates and the preview iframe refreshes automatically, maintaining the user's current scroll position and interaction state where possible.

Error states flow through the chat system as conversational responses rather than separate error handling mechanisms, keeping the user experience consistent and approachable.

## Component Architecture

### Core Component Hierarchy

The application structure follows a clear component hierarchy that separates concerns and enables maintainable development. The root layout component handles authentication state, WebSocket initialization, and global providers, ensuring consistent setup across all pages.

The main dashboard component orchestrates the primary user interface, managing the layout between chat and preview panels, coordinating state updates, and handling responsive behavior for different screen sizes.

Chat components include the conversation feed, message rendering, input handling, and streaming response display. These components focus purely on conversational interface concerns without coupling to project or preview logic.

Preview components manage the iframe integration, device mode switching, loading states during preview updates, and interaction forwarding where needed.

### Reusable UI Components

The frontend leverages a consistent design system built with Tailwind CSS and selective shadcn/ui components for common interface patterns. Button components, form inputs, loading spinners, and modal dialogs maintain consistent styling and behavior throughout the application.

Toast notifications provide subtle feedback for background operations, successful actions, and non-critical status updates. These notifications appear contextually without interrupting the user's primary workflow.

Icon usage follows a consistent system with Lucide React icons providing clear, recognizable symbols for common actions and states.

## Integration Patterns

### Backend Communication

The frontend communicates with the NestJS backend through multiple channels optimized for different types of interactions. RESTful API endpoints handle project management operations, initial preview session setup, and configuration management through standard HTTP requests.

WebSocket connections manage real-time chat communication, providing bi-directional channels for message streaming and status updates. The WebSocket implementation includes proper error handling, connection management, and message queuing for reliability.

Preview integration happens through iframe embedding of the user's live development server. The frontend coordinates with the backend to establish preview sessions and manages iframe source URL updates as needed.

### Security and Performance Considerations

The iframe preview implementation includes appropriate sandbox attributes and Content Security Policy configurations to ensure user safety while maintaining functionality. Cross-origin communication between the main application and preview iframe follows secure patterns with proper origin validation.

Performance optimizations include efficient re-rendering patterns for chat messages, lazy loading of non-critical components, and optimized bundle splitting to minimize initial load times. The streaming chat interface uses efficient DOM updates to handle high-frequency character updates without performance degradation.

Memory management considers the long-lived nature of chat sessions, implementing cleanup patterns for message history and preventing memory leaks in WebSocket connections and chat state.

## Development and Testing Strategy

### Development Workflow

The frontend development environment integrates seamlessly with the Docker development container setup, providing hot module replacement for rapid iteration on user interface components. The development workflow supports component-driven development with clear separation between chat interface, preview management, and shared UI components.

Local development includes mock WebSocket servers for chat testing, preview iframe mocking for UI development without full backend dependency, and comprehensive error state simulation to ensure robust error handling.

### Quality Assurance

The frontend implements accessibility considerations from the ground up, ensuring proper semantic markup, keyboard navigation support, and screen reader compatibility throughout the chat interface and preview controls.

User experience testing focuses on the conversational flow, preview responsiveness, and error handling scenarios that users commonly encounter. The interface design prioritizes clarity and ease of use, with particular attention to helping users understand system state and available actions.

Performance monitoring includes chat responsiveness metrics, preview loading times, and WebSocket connection reliability to ensure consistent user experience across different network conditions and device capabilities.
