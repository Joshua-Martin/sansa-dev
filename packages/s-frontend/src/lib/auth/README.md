# Authentication Flow - Best Practices Implementation

## Overview

This authentication system follows Next.js 13+ App Router best practices with a hybrid approach:

- **Server-side protection** via middleware for security and performance
- **Client-side verification** via React hooks for UX and error handling

## Architecture

### 1. Middleware Layer (`middleware.ts`)

**Purpose**: Server-side route protection and redirects

- ✅ Runs before any page components
- ✅ Handles authentication-based routing
- ✅ Provides instant redirects without loading states
- ✅ Secures against direct URL access

**Key Features**:

- Requires BOTH access AND refresh tokens (secure)
- Optimized matcher for specific routes only
- Proper cache control for redirects
- Handles dynamic routes (`/verify-email/[token]`)

### 2. Route Groups

**`(app)` - Authenticated Routes**:

- Dashboard, Profile, Builder pages
- Client-side auth verification as fallback
- Graceful error handling and loading states

**`(auth)` - Authentication Routes**:

- Signin, Signup, Password Reset pages
- Consistent styling via layout
- Automatically redirects authenticated users

### 3. Client-side Auth (`useAuth` hook)

**Purpose**: React Query-based state management

- ✅ Optimistic updates
- ✅ Automatic token refresh
- ✅ Error boundaries and recovery
- ✅ Loading states and user feedback

## Security Features

### Token Requirements

- **Requires both tokens**: Access + Refresh (not OR logic)
- **Secure cookies**: `httpOnly=false` for client access, `secure` in production
- **Automatic refresh**: Handles token expiration gracefully

### Route Protection Layers

1. **Middleware** (Server) - Primary protection
2. **Layout** (Client) - Fallback verification
3. **Components** (Client) - UI-based restrictions

## Performance Optimizations

### Loading States

- **Global loading**: `app/loading.tsx` for page transitions
- **Route-specific loading**: Group-level loading components
- **Auth loading**: Consistent spinner during auth checks

### Caching Strategy

- **React Query**: Smart caching with stale-while-revalidate
- **Optimistic updates**: Immediate UI feedback
- **Background refresh**: Seamless token renewal

## User Experience

### Seamless Navigation

- **Instant redirects**: Middleware handles routing server-side
- **Return URLs**: Users return to intended page after signin
- **Loading feedback**: Clear indicators during transitions

### Error Handling

- **Graceful failures**: Fallbacks for auth errors
- **User feedback**: Clear error messages and recovery options
- **Automatic recovery**: Token refresh and re-authentication

## Best Practices Implemented

### ✅ Separation of Concerns

- Server-side routing vs client-side state
- Authentication logic vs UI components
- Security vs user experience

### ✅ Progressive Enhancement

- Works without JavaScript (middleware)
- Enhanced with React (hooks and state)
- Degrades gracefully on errors

### ✅ Performance First

- Server-side redirects are instant
- Optimized middleware matcher
- Efficient React Query caching

### ✅ Security First

- Multiple protection layers
- Secure token handling
- Proper error boundaries

## Usage Examples

### Protected Route Access

```typescript
// User visits /dashboard
// 1. Middleware checks tokens → allows access
// 2. Layout verifies auth → fallback check
// 3. Page renders with user data
```

### Authentication Flow

```typescript
// User signs in
// 1. Tokens stored in secure cookies
// 2. React Query cache updated
// 3. Automatic redirect to dashboard
// 4. User lands on intended page
```

### Error Recovery

```typescript
// Token expires during use
// 1. API request fails (401)
// 2. Automatic token refresh attempted
// 3. On failure: redirect to signin
// 4. User can re-authenticate
```

## Migration Notes

If upgrading from pages router:

- ✅ Middleware replaces `getServerSideProps` auth logic
- ✅ Route groups replace custom `_app.tsx` routing
- ✅ Client-side hooks remain similar
- ✅ Better performance and security

This implementation provides production-ready authentication with excellent DX and UX! 🚀
