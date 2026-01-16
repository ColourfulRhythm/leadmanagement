# Comprehensive Deep Dive Analysis: AD-Promoter Frontend Application

## Executive Summary

**AD-Promoter** is a Next.js-based web application that serves as a digital advertising platform connecting two primary user types:
- **Placers**: Businesses/individuals who create and pay for advertisements
- **Promoters**: Content creators who promote ads and earn money

The application uses a hybrid authentication system combining Firebase Auth (for OAuth) with a NestJS backend (for JWT tokens), Firebase Firestore for real-time data, and Firebase Storage for media uploads.

---

## 1. Technology Stack & Architecture

### Core Technologies
- **Framework**: Next.js 12.3.0 (React 18.2.0)
- **Styling**: 
  - Styled Components
  - Chakra UI v2.6.1
  - Bootstrap 5.2.3
  - Custom CSS-in-JS
- **State Management**: React Context API (6 contexts)
- **Authentication**: 
  - Firebase Auth (OAuth: Google, Facebook)
  - Backend JWT tokens (NestJS)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **HTTP Client**: Axios with custom interceptors
- **Charts**: ApexCharts, Chart.js, react-apexcharts
- **Forms**: React Phone Number Input
- **Icons**: React Icons
- **Deployment**: Firebase Hosting (static export)

### Project Structure
```
/
├── components/          # Reusable UI components (86 files)
├── context/            # React Context providers (6 contexts)
├── hooks/              # Custom React hooks (15 hooks)
├── lib/                # Core libraries (Firebase, config)
├── pages/              # Next.js pages (routing)
│   ├── placers/       # Ad placer dashboard & features
│   ├── promoters/     # Promoter dashboard & features
│   ├── admin/         # Admin panel
│   ├── signup/        # Multi-step signup flow
│   └── auth/          # Authentication handlers
├── public/            # Static assets (234 files)
├── services/          # API & Firebase service layers
├── styles/            # Styled-components definitions
└── utils/             # Utility functions
```

---

## 2. Authentication System (Hybrid Architecture)

### Dual Authentication Flow

The app uses a **hybrid authentication system** that combines:
1. **Firebase Auth**: For OAuth (Google/Facebook) and email/password
2. **Backend JWT**: For API authentication with NestJS backend

### Authentication Context (`context/authContext.js`)

**Key Features:**
- Manages user state: `{ user, profile, token, loading }`
- Syncs Firebase Auth state with Firestore profiles
- Handles token management (Firebase tokens vs Backend JWT)
- Preserves backend JWT tokens for OAuth users
- Auto-syncs email verification status

**Token Management Strategy:**
```javascript
// Priority order:
1. Backend JWT token (for API calls) - stored in localStorage as 'user-token'
2. Firebase token (for Firestore) - stored as 'firebase-token'
3. Auth source tracking: 'backend-oauth', 'firebase-oauth', 'backend-email'
```

### Login Methods

#### 1. Email/Password Login (`hooks/useLogin.js`)
- Calls backend `/api/v1/auth/signin` for JWT token
- Also signs in with Firebase Auth for Firestore access
- Stores both tokens separately
- Redirects based on user role

#### 2. OAuth Login (Google/Facebook)
- Uses Firebase Auth popup (desktop) or redirect (mobile)
- Auto-detects mobile devices
- Syncs with backend via `completeBackendSocialLogin()`
- Creates/updates user profile in Firestore
- Handles redirect flow for mobile devices

**OAuth Flow:**
```
1. User clicks Google/Facebook button
2. Firebase Auth popup/redirect
3. getRedirectResult() handles callback
4. createOrUpdateOAuthUser() syncs to Firestore
5. completeBackendSocialLogin() gets backend JWT
6. Store tokens and redirect based on role
```

### Signup Flow (`hooks/useSignup.js`)

**Multi-step Process:**
1. **Basic Info** (`/signup`): Name, email, phone, password
2. **Preference** (`/signup/preference`): Role selection (placer/promoter)
3. **Visual Requirements** (`/signup/visualReq`): Optional visual ad preferences
4. **OTP Verification** (`/signup/verification`): Phone verification (optional)
5. **Success** (`/signup/success`): Confirmation page

**Features:**
- OTP verification via backend API (optional)
- Firebase Auth user creation
- Firestore profile creation
- Email verification sent automatically
- Phone verification status tracking

### Token Refresh (`hooks/useRefreshToken.js`)

- Attempts backend refresh first (`/api/v1/auth/refresh`)
- Falls back to Firebase token refresh
- Updates both localStorage and auth context
- Handles refresh token rotation

---

## 3. User Roles & Permissions

### Three User Types

1. **Placer** (`role: 'placer'`)
   - Creates and manages advertisements
   - Tracks ad performance
   - Manages budget and payments
   - Dashboard: `/placers`

2. **Promoter** (`role: 'promoter'`)
   - Views available ads in discovery
   - Promotes ads (shares, creates content)
   - Earns money from conversions
   - Dashboard: `/promoters`

3. **Admin** (`role: 'admin'`)
   - Manages users and accounts
   - Views system-wide analytics
   - Dashboard: `/admin`

### Role-Based Routing

- Layout component (`components/Layout.jsx`) renders different navbars based on path
- Protected routes check role in `useEffect`
- Redirects to `/signup/preference` if role not set

---

## 4. Core Features & Pages

### Placer Dashboard (`/placers`)

**Main Features:**
- Dashboard summary: Running ads, completed ads, conversion growth
- Recent jobs feed with filtering (Recent, Week ago, 2 weeks, 30 days)
- Ad creation flow (3 types)
- Ad management (view, pause, delete)
- Reporting system for inappropriate ads
- Charts and analytics

**Ad Types:**
1. **Direct-Link Ad**: Pay per visitor (₦25/visitor)
2. **Detail Ad**: Pay per conversion (₦50/conversion)
3. **Visual Ad**: Pay per video (₦5,000/video)

**Ad Creation Flow:**
```
/placers/adcreator
  ├── /directlink/     # Direct link ad creation
  ├── /detailsad/       # Detail ad creation
  └── /visualad/        # Visual ad creation
```

Each ad type has:
- Product information form
- Image upload (Firebase Storage)
- Budget and target setting
- Payment integration
- Summary and confirmation

### Promoter Dashboard (`/promoters`)

**Main Features:**
- Dashboard metrics: Balance, ads promoted, conversions, visitors
- Recent jobs tab: Available ads to promote
- Saved jobs tab: Bookmarked ads
- Discovery page: Browse all available ads
- Wallet: View earnings, withdraw funds
- Settings: Profile, payment, notifications

**Discovery System** (`/promoters/discovery`):
- Browse all active ads
- Filter by type, tags, date
- Save ads for later
- View ad details
- Report inappropriate content

**Wallet System** (`/promoters/wallet`):
- View total balance
- Transaction history
- Withdrawal requests
- Payment method management
- Bank account verification (Nigerian banks)

### Admin Panel (`/admin`)

**Features:**
- User management
- Account operations (change, delete, invite)
- System analytics
- Content moderation

---

## 5. State Management (Context API)

### Context Providers (6 total)

1. **AuthContext** (`context/authContext.js`)
   - User authentication state
   - Token management
   - Profile data

2. **SignupContext** (`context/signupContext.js`)
   - Signup form state
   - User preferences
   - OTP verification data

3. **AdPlacerContext** (`context/adPlacerContext.js`)
   - Ad creation form state
   - Images, tags, budget
   - Ad type selection

4. **JobsContext** (`context/jobsContext.js`)
   - Recent jobs list
   - Saved jobs list
   - Loading states

5. **NotificationContext** (`context/notificationContext.js`)
   - Notification click state
   - Notification visibility

6. **SingleAdContext** (`context/singleAdContext.js`)
   - Single ad detail data
   - Ad viewing state

---

## 6. API Integration

### Axios Configuration (`pages/api/axios.js`)

**Key Features:**
- Base URL from environment variable
- Firebase Functions routing support
- Automatic Authorization header injection
- Token refresh on 401 errors
- Request/response interceptors
- URL path normalization for Firebase Functions

**Firebase Functions Routing Logic:**
```javascript
// Firebase Function name: 'api'
// Base URL: .../cloudfunctions.net/api
// Path: /v1/ads/create
// Final URL: .../api/api/v1/ads/create
// Firebase strips first '/api' → passes '/api/v1/ads/create' to NestJS
```

### API Endpoints Used

**Authentication:**
- `POST /api/v1/auth/signin` - Email/password login
- `POST /api/v1/auth/signup` - OTP verification
- `GET /api/v1/auth/google-auth-signIn/:email` - OAuth signin
- `POST /api/v1/auth/google-auth-setup` - OAuth account setup
- `GET /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/send-otp` - Send OTP
- `POST /api/v1/auth/forgot-password-phone` - Password reset OTP
- `POST /api/v1/auth/verify-OTP-password` - Verify reset OTP
- `POST /api/v1/auth/change-password/:token` - Change password

**Ads:**
- `POST /v1/ads/create` - Create ad
- `GET /v1/ads/recent-ads` - Get recent ads (paginated)
- `GET /api/v1/ads/all/user-ads/:userId` - Get user's ads
- `GET /api/v1/ads/:id` - Get single ad
- `DELETE /api/v1/ads/:id` - Delete ad

**User:**
- `GET /v1/user/dashboard` - Dashboard metrics
- `GET /v1/user/profile` - User profile

**Reports:**
- `POST /v1/reports/create` - Report ad

**File Upload:**
- `POST /api/v1/fileUpload/image` - Upload image

---

## 7. Firebase Integration

### Firebase Services

**Firestore Collections:**
- `users` - User profiles
- `ads` - Advertisements
- `notifications` - User notifications
- `promoterDashboards` - Promoter metrics
- `walletRecipients` - Bank account details
- `walletTransactions` - Transaction history

**Firestore Security Rules:**
- Users can read/write their own profile
- Authenticated users can read all ads
- Only ad creators can write their ads
- Notifications are user-scoped
- Wallet data is user-private

**Storage:**
- Image uploads to `uploads/{userId}/{timestamp}-{filename}`
- Used for ad images, profile pictures

**Functions:**
- Backend API deployed as Firebase Function
- Function name: `api`
- Region: `us-central1`

---

## 8. Custom Hooks

### Authentication Hooks
- `useAuth()` - Access auth context
- `useLogin()` - Email/password login
- `useSignup()` - User registration
- `useLogout()` - Sign out
- `useRefreshToken()` - Refresh JWT token
- `useAxiosPrivate()` - Axios with auto token injection
- `requireAuth()` - Route protection

### Feature Hooks
- `useCreateAds()` - Create advertisement
- `useImageUpload()` - Upload images to backend
- `useFetchRecentAd()` - Fetch recent ads
- `useSendOtp()` - Send OTP
- `useSmsVerififcation()` - SMS verification
- `useVisualSubmit()` - Submit visual ad
- `useAddWallet()` - Add wallet recipient
- `addUserPref()` - Add user preferences

---

## 9. Component Architecture

### Layout Components
- `Layout.jsx` - Main layout wrapper (role-based navbars)
- `AdminLayout.jsx` - Admin panel layout
- Responsive design: Desktop, Tablet, Mobile variants

### Navigation Components
- `PlacersNavbar` - Placer navigation
- `PromoterNavbar` - Promoter navigation
- `MobilePlacersNavbar` - Mobile placer nav
- `MobilePromoterNavbar` - Mobile promoter nav
- `AdminNavbar` - Admin navigation

### Feature Components
- `PromoterHomeAdDetail` - Ad detail views
- `DiscoveryFolder` - Discovery feed components
- `promoterWallet` - Wallet management
- `promoterModal` - Modal dialogs
- `settings` - Settings pages
- `AdminModals` - Admin operation modals

### Empty States
- `adCreatorEmptyScreen` - No ads created
- `walletEmptyScreen` - No transactions
- `activitiesEmptyScreen` - No activities
- `notificationEmptyScreen` - No notifications
- `discoveryEmptyScreen` - No discovery results
- `accountEmptyScreen` - No account data

---

## 10. Styling System

### Styled Components
- Global styles (`styles/global.js`)
- Variable definitions (`styles/variables.js`)
- Sanitize CSS (`styles/sanitize.js`)
- Page-specific styles (e.g., `styles/placerHome.styles.js`)

### Chakra UI Theme
- Custom theme with Poppins font
- Global body styles
- Component overrides

### Responsive Design
- Mobile-first approach
- Breakpoints: Mobile, Tablet, Desktop
- Separate components for each breakpoint
- Touch-friendly interactions

---

## 11. Utilities

### Formatting
- `formatCurrency.js` - Nigerian Naira formatting
- `formatFilterDate.js` - Date range utilities
- `timeAgo.jsx` - Relative time display

### Device Detection
- `deviceDetection.js` - Mobile device detection
  - User agent checking
  - Screen width detection
  - Touch support detection

### Data
- `banks.js` - Nigerian bank list (285+ banks)
  - Bank codes, USSD codes, logos

---

## 12. Image Handling

### Upload Flow
1. User selects images
2. Images uploaded to Firebase Storage (`helper/imageUploader.js`)
3. Download URLs stored
4. URLs sent to backend API in ad creation

### Image Display
- Next.js Image component for optimization
- Carousel for multiple images
- Lazy loading
- Responsive sizing

---

## 13. Payment Integration

### Payment Flow
1. User creates ad with budget
2. Backend generates payment details
3. Redirect to payment gateway (if implemented)
4. Payment verification webhook: `/api/v1/ads/verify-payment-hook`
5. Ad activated upon successful payment

### Pricing Model
- **Direct-Link**: ₦25 per visitor
- **Detail Ad**: ₦50 per conversion
- **Visual Ad**: ₦5,000 per video

---

## 14. Notification System

### Notification Context
- Real-time notifications via Firestore
- Notification click tracking
- Badge indicators
- Mobile notification component

### Notification Types
- Ad status updates
- Payment confirmations
- Earnings notifications
- System announcements

---

## 15. Error Handling

### Error Management Strategy
- Toast notifications (Chakra UI)
- Console logging for debugging
- Graceful fallbacks
- User-friendly error messages
- Network error detection

### Common Error Scenarios
- Authentication failures → Redirect to login
- Token expiration → Auto-refresh
- Network errors → Retry with user notification
- API errors → Display backend error message
- OAuth errors → Fallback to redirect flow

---

## 16. Performance Optimizations

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (Next.js)
- Lazy loading of charts

### Image Optimization
- Next.js Image component
- Responsive images
- Lazy loading

### State Management
- Context API for global state
- Local state for component-specific data
- Memoization where needed

### API Optimization
- Request interceptors for token management
- Response caching (implicit via React state)
- Pagination for large datasets

---

## 17. Security Considerations

### Authentication Security
- JWT tokens stored in localStorage (consider httpOnly cookies)
- Token refresh mechanism
- Secure token transmission
- OAuth state management

### Firestore Security Rules
- User-scoped data access
- Write restrictions
- Admin-only collections

### Input Validation
- Phone number validation
- Email validation
- Password strength (regex defined but commented out)
- OTP verification

### XSS Protection
- React's built-in XSS protection
- Sanitized inputs
- Safe URL handling

---

## 18. Deployment Configuration

### Firebase Hosting
- Static export (`next export`)
- Rewrite rules for SPA routing
- Clean URLs
- Cache headers for assets

### Environment Variables
- `NEXT_PUBLIC_FIREBASE_*` - Firebase config
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `.env.local` for development
- `.env.production` for production

### Build Process
```bash
yarn export        # Build and export static files
yarn firebase:deploy  # Deploy to Firebase Hosting
```

---

## 19. Known Issues & Technical Debt

### Authentication Complexity
- Dual token system (Firebase + Backend JWT) adds complexity
- Token synchronization issues possible
- OAuth redirect handling is complex

### API Routing
- Firebase Functions routing requires URL manipulation
- Double `/api` prefix handling
- Path normalization logic is complex

### State Management
- Multiple contexts could be consolidated
- Some prop drilling still exists
- No global state management library

### Error Handling
- Inconsistent error handling patterns
- Some errors not caught properly
- Network error recovery could be improved

### Code Quality
- Some commented-out code
- Inconsistent naming conventions
- Large component files (1000+ lines)
- Mixed JS/JSX file extensions

---

## 20. Testing & Quality Assurance

### Current State
- No visible test files
- Manual testing likely
- No automated testing setup

### Recommendations
- Unit tests for hooks
- Integration tests for API calls
- E2E tests for critical flows
- Component testing with React Testing Library

---

## 21. Accessibility

### Current Implementation
- Semantic HTML in most places
- Form labels present
- Alt text for images
- Keyboard navigation partially supported

### Improvements Needed
- ARIA labels for interactive elements
- Focus management
- Screen reader optimization
- Color contrast verification

---

## 22. Mobile Optimization

### Mobile Features
- Responsive layouts
- Touch-friendly interactions
- Mobile-specific navigation
- OAuth redirect flow for mobile
- Mobile-optimized forms

### Mobile Detection
- User agent checking
- Screen width detection
- Touch support detection
- Automatic OAuth method selection

---

## 23. Internationalization

### Current State
- English only
- Nigerian Naira (NGN) currency
- Nigerian phone numbers (default country: NG)
- Nigerian banks list

### Localization Ready
- Currency formatting utility
- Phone number international format
- Date formatting utilities

---

## 24. Analytics & Tracking

### Current Implementation
- No visible analytics integration
- Console logging for debugging
- Error tracking via console

### Potential Additions
- Google Analytics
- User behavior tracking
- Performance monitoring
- Error tracking (Sentry, etc.)

---

## 25. File Structure Summary

### Total Files Analyzed
- **Components**: 86 JSX files
- **Pages**: 30+ route files
- **Hooks**: 15 custom hooks
- **Contexts**: 6 context providers
- **Services**: 10+ service files
- **Utils**: 4 utility files
- **Styles**: 25+ style files
- **Public Assets**: 234 files

### Key Files
1. `pages/_app.js` - App initialization, context providers
2. `pages/_document.js` - HTML document structure
3. `lib/firebase.js` - Firebase initialization
4. `lib/config.js` - API configuration
5. `context/authContext.js` - Authentication state
6. `hooks/useLogin.js` - Login logic
7. `hooks/useSignup.js` - Signup logic
8. `hooks/useCreateAds.js` - Ad creation
9. `pages/api/axios.js` - HTTP client configuration
10. `components/Layout.jsx` - Main layout

---

## 26. Data Flow Diagrams

### Authentication Flow
```
User Action
  ↓
Login/Signup Component
  ↓
Hook (useLogin/useSignup)
  ↓
Firebase Auth / Backend API
  ↓
AuthContext Update
  ↓
Token Storage (localStorage)
  ↓
Redirect to Dashboard
```

### Ad Creation Flow
```
Placer Dashboard
  ↓
Ad Creator Page
  ↓
Form Input (AdPlacerContext)
  ↓
Image Upload (Firebase Storage)
  ↓
API Call (useCreateAds)
  ↓
Backend Processing
  ↓
Payment Redirect / Success
```

### Promoter Discovery Flow
```
Promoter Dashboard
  ↓
Discovery Page
  ↓
Fetch Ads (API)
  ↓
Display Feed
  ↓
User Interaction (Save/Report)
  ↓
API Call
  ↓
State Update
```

---

## 27. Dependencies Analysis

### Critical Dependencies
- **next**: 12.3.0 - Core framework
- **react**: 18.2.0 - UI library
- **firebase**: 10.6.0 - Backend services
- **axios**: 1.3.4 - HTTP client
- **@chakra-ui/react**: 2.6.1 - UI components
- **styled-components**: 5.3.5 - Styling

### Chart Libraries
- **apexcharts**: 3.41.1
- **react-apexcharts**: 1.4.1
- **chart.js**: 4.0.1
- **react-chartjs-2**: 5.0.1

### Form Libraries
- **react-phone-number-input**: 3.2.12

### Utility Libraries
- **date-fns**: 2.30.0 - Date manipulation
- **framer-motion**: 10.12.16 - Animations
- **react-share**: 4.4.1 - Social sharing

---

## 28. Configuration Files

### `next.config.js`
- React strict mode
- SWC minification
- Image domains whitelist
- Trailing slash enabled
- Redirects: `/placer` → `/placers`

### `firebase.json`
- Firestore rules and indexes
- Hosting configuration
- Clean URLs
- Rewrite rules for SPA

### `jsconfig.json`
- Absolute imports (`@/*`)
- JSX preserve mode

### `package.json`
- Scripts: dev, build, export, start, lint
- Firebase deployment script
- Husky for git hooks
- Lint-staged for pre-commit

---

## 29. Build & Deployment

### Development
```bash
yarn dev          # Start dev server (localhost:3000)
```

### Production Build
```bash
yarn build        # Next.js build
yarn export       # Static export
```

### Deployment
```bash
yarn firebase:login    # Authenticate
yarn firebase:deploy   # Deploy to Firebase Hosting
```

### Build Output
- Static files in `out/` directory
- Optimized images
- Code splitting
- Minified JavaScript/CSS

---

## 30. Recommendations for Improvement

### Code Quality
1. **Add TypeScript** - Better type safety
2. **Consolidate Contexts** - Reduce context providers
3. **Extract Large Components** - Break down 1000+ line files
4. **Standardize Error Handling** - Consistent error patterns
5. **Add Unit Tests** - Test hooks and utilities

### Performance
1. **Implement Caching** - API response caching
2. **Optimize Images** - Further image optimization
3. **Code Splitting** - More aggressive splitting
4. **Lazy Loading** - Lazy load heavy components

### Security
1. **HttpOnly Cookies** - Move tokens to httpOnly cookies
2. **CSRF Protection** - Add CSRF tokens
3. **Input Sanitization** - Enhanced XSS protection
4. **Rate Limiting** - API rate limiting

### User Experience
1. **Loading States** - Better loading indicators
2. **Error Messages** - More user-friendly errors
3. **Offline Support** - Service worker for offline
4. **Progressive Web App** - PWA features

### Developer Experience
1. **Documentation** - API documentation
2. **Code Comments** - More inline documentation
3. **Error Logging** - Centralized error logging
4. **Development Tools** - Better dev tools

---

## Conclusion

The AD-Promoter frontend is a **sophisticated Next.js application** with:
- ✅ Complex authentication system (Firebase + Backend JWT)
- ✅ Multi-role user system (Placer, Promoter, Admin)
- ✅ Real-time data with Firestore
- ✅ Comprehensive ad management
- ✅ Payment integration ready
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Rich feature set

**Key Strengths:**
- Well-structured component architecture
- Comprehensive feature set
- Good separation of concerns
- Responsive design

**Areas for Improvement:**
- Code organization (some large files)
- Testing coverage (none visible)
- Error handling consistency
- Documentation

The application is **production-ready** but would benefit from the improvements listed above for better maintainability and scalability.

---

**Analysis Date**: 2024
**Total Files Analyzed**: 200+ files
**Lines of Code**: ~50,000+ LOC
**Components**: 86 JSX components
**Pages**: 30+ routes
**Hooks**: 15 custom hooks
**Contexts**: 6 providers

