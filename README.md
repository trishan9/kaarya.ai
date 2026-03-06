# Kaarya.ai

**AI-Powered Career and Talent Management System for Colleges and Universities in Nepal**

---

## Table of Contents

1. [The Idea](#the-idea)
2. [Problem Statement](#problem-statement)
3. [Target Users](#target-users)
4. [Platform Features](#platform-features)
5. [Tech Stack Overview](#tech-stack-overview)
6. [Backend Architecture (NestJS)](#backend-architecture-nestjs)
7. [Frontend Architecture (Next.js)](#frontend-architecture-nextjs)
8. [REST API Design](#rest-api-design)
9. [Design Patterns and Architecture](#design-patterns-and-architecture)
10. [AI and Machine Learning](#ai-and-machine-learning)
11. [Real-Time Communication](#real-time-communication)
12. [Observability and Monitoring](#observability-and-monitoring)
13. [Testing Strategy](#testing-strategy)
14. [DevOps and Deployment](#devops-and-deployment)
15. [Future Improvements](#future-improvements)

---

## The Idea

Kaarya.ai is a one-stop, AI-powered career and recruitment ecosystem built specifically for colleges and universities like Softwarica across Nepal. It brings students, job seekers, recruiters, and institutions together on a single, fair, and transparent platform.

Instead of scattered career tools, manual placement processes, and biased hiring, Kaarya.ai offers an all-in-one experience: students build AI-graded resumes, practice with AI mock interviews, earn gamified scores, climb leaderboards, and explore AI-generated learning resources. Recruiters post jobs, match candidates, and create skill assessments. Colleges manage placements, track student readiness, and ensure hiring decisions are based on real ability rather than bias.

The name "Kaarya" comes from the Nepali/Sanskrit word meaning "work" or "task" reflecting the platform's purpose of connecting talent with meaningful work opportunities.

---

## Problem Statement

Nepal's higher education institutions face several challenges in their career services:

- **Fragmented Tools**: Students use separate platforms for resume building, interview practice, job searching, and learning. Nothing is unified.
- **Manual Placement Processes**: Colleges rely on spreadsheets, notice boards, and manual coordination for placement drives, with no data-driven insights.
- **Lack of Interview Preparation**: Students enter job markets unprepared because there is no accessible, affordable way to practice real interview scenarios with feedback.
- **Hiring Bias**: Without standardized skill assessments, hiring decisions often rely on institutional reputation or personal networks rather than actual candidate ability.
- **No Feedback Loop**: Students have no way to know how ready they are for the job market, what skills to improve, or how they compare to peers.
- **Recruiter Inefficiency**: Recruiters must juggle multiple platforms to post jobs, screen resumes, and coordinate with colleges.

Kaarya.ai solves all of these by providing a unified, AI-powered platform where every stakeholder benefits from transparency, automation, and data-driven decisions.

---

## Target Users

### Students and Job Seekers
Fresh graduates and job seekers who need to build professional resumes, practice interviews, discover job opportunities, and track their career readiness all in one place.

### Recruiters and Companies
Hiring teams that want to post job openings, match candidates based on skills, create custom skill assessments, and communicate with applicants directly on the platform.

### Colleges and Institutions
Placement cells and career services departments that need to manage placement drives, monitor student preparedness, track employment outcomes, and ensure fair, transparent hiring processes.

### Faculty and Administrators
College faculty involved in student mentorship and career guidance, who benefit from seeing student progress, leaderboard standings, and interview performance data.

---

## Platform Features

### For Students and Job Seekers
- **AI Resume Builder**: Create professional, ATS-optimized resumes with AI-generated summaries, experience bullets, and real-time ATS scoring across five categories (ATS compatibility, tone, content, structure, skills).
- **AI Mock Interviews**: Practice interviews with an AI interviewer that supports both text and voice modes (via VAPI), covering technical, HR, behavioral, and case study formats. Get detailed feedback with scoring.
- **Job Discovery and Applications**: Browse job listings, apply with uploaded resumes, track application status (applied, shortlisted, interview scheduled, accepted, rejected), and withdraw applications.
- **Interview Hub**: Discover and take published interviews, view recommendations based on performance, and track your overall interview rating.
- **Gamification and Leaderboard**: Earn XP for every platform activity (applying to jobs, completing interviews, updating profiles). Level up, climb the global and college leaderboards, and see where you stand.
- **AI Learning Resources**: Access AI-generated interview preparation courses with structured chapters, core concepts, practice prompts, and recommended YouTube videos.
- **Public Portfolio**: Generate a public portfolio page accessible via a unique slug URL. Showcase skills, experience, education, and resume data without requiring the viewer to log in.
- **Saved Items**: Bookmark jobs and interviews for later.
- **In-App Messaging**: Chat directly with recruiters via real-time messaging, with video huddle support for live conversations.

### For Recruiters and Companies
- **Company Workspace**: Create and manage a company workspace. Invite recruiters to join using invitation codes.
- **Job Posting Management**: Create, publish, close, and archive job postings with detailed fields (salary, location, work mode, required skills, deadline).
- **Candidate Matching**: AI-powered job-candidate matching based on skills, experience, and profile data.
- **Application Management**: Review applications, update statuses, shortlist candidates, and communicate decisions.
- **Custom Interviews**: Create interview question sets for candidates, supporting multiple formats and difficulty levels.
- **Dashboard Analytics**: View metrics like open jobs, total applicants, job views, work mode distribution, top skills in demand, and upcoming deadlines.

### For Colleges
- **College Workspace**: Manage a college-level workspace for students and faculty.
- **Placement Tracking**: Monitor student applications, interview performance, and employment outcomes.
- **College Leaderboard**: Scoped leaderboards for comparing student readiness within the institution.
- **Student and Faculty Management**: Onboard students and faculty into the college workspace with role-based access.

### Platform-Wide
- **OAuth Authentication**: Sign up and log in with Google or GitHub in addition to email/password.
- **Role-Based Access**: Six roles (User, Student, Faculty, Recruiter, College, Admin) with tailored dashboards and permissions.
- **Stripe Payments**: Free and Pro plans with Stripe-powered checkout and billing management. Pro users get unlimited interviews.
- **Dark Mode**: Full dark mode support across the entire interface.
- **PDF Resume Export**: Download built resumes as professionally formatted PDFs generated server-side with Puppeteer.
- **Email Notifications**: Transactional emails for onboarding, password reset, application status updates, company invitations, and job matches.

---

## Tech Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router), React 19 | Server-rendered UI with server actions |
| **UI Library** | shadcn/ui, Radix UI, Tailwind CSS v4 | Component system and styling |
| **Backend** | NestJS 11 | Modular, enterprise-grade REST API |
| **Database** | MongoDB, Mongoose 9 | Document store with schema validation |
| **Cache/State** | Redis | Rate limiting, OTP storage, OAuth state |
| **AI** | Google Gemini, OpenAI GPT-4o | Resume analysis, interview generation, course creation |
| **Voice AI** | VAPI SDK | Real-time voice-based AI interviews |
| **Real-Time** | Stream Chat SDK, Stream Video SDK | In-app messaging and video calls |
| **Payments** | Stripe | Subscription checkout and billing |
| **File Storage** | Cloudinary | Image and document uploads via CDN |
| **Email** | Nodemailer | SMTP-based transactional emails |
| **Monitoring** | Sentry, OpenTelemetry, Prometheus, Grafana, Jaeger | Error tracking, metrics, tracing |
| **Logging** | Pino | Structured JSON logging |
| **API Docs** | Swagger (OpenAPI) | Interactive API documentation |
| **Testing** | Jest, Supertest, Mocha, Vitest, Cypress, Storybook, RTL | Full-spectrum testing |
| **Containerization** | Docker | Multi-stage production builds |
| **Reverse Proxy** | Nginx | SSL termination, security headers, request forwarding |
| **Cloud** | Azure VM | Production hosting |
| **CI/CD** | GitHub Actions | Automated build, push, and deploy |

---

## Backend Architecture (NestJS)

The backend is built with **NestJS 11**, a progressive Node.js framework that provides a modular, dependency-injected architecture inspired by Angular. It enforces structure and separation of concerns at every level.

### Why NestJS

NestJS was chosen because it provides:
- **Module System**: Each feature domain (auth, jobs, interviews, payments) lives in its own module with clearly defined boundaries, making the codebase navigable even as it grows.
- **Dependency Injection**: Services, repositories, and providers are injected via constructors, making the code testable and loosely coupled. Swapping an implementation (e.g., changing the AI provider) means changing a single module binding.
- **Decorator-Based Architecture**: Guards (`@UseGuards`), interceptors (`@UseInterceptors`), pipes (`@UsePipes`), and custom decorators (`@Roles`, `@CurrentUser`) eliminate boilerplate and keep controllers thin.
- **Built-In Swagger Integration**: The `@nestjs/swagger` package auto-generates interactive API documentation from controller decorators and DTOs.
- **TypeScript-First**: Every entity, DTO, service, and controller is fully typed, catching errors at compile time.

### Module Structure

The application is composed of **14 feature modules**, each encapsulating its own controller, service, repository, DTOs, and schemas:

```
src/
├── main.ts                          # Bootstrap: CORS, Swagger, global pipes/filters/interceptors, OpenTelemetry init
├── app.module.ts                    # Root module importing all feature modules
├── config/                          # Typed configuration (app, auth, database, redis, email, cloudinary, gemini, stream)
├── constants/                       # Route paths, messages, gamification rules, plan/billing config
├── entities/                        # 16+ Mongoose schemas (User, Resume, JobPosting, Interview, Application, etc.)
├── repositories/                    # Abstract + concrete repository implementations
├── services/                        # Business logic (auth, user, job, interview, AI, payment, email, etc.)
├── controllers/                     # REST endpoints grouped by domain
├── strategies/                      # Passport strategies (JWT, Google OAuth, GitHub OAuth)
├── guards/                          # RolesGuard for role-based access control
├── interceptors/                    # HTTP observability, promise resolution, class serialization
├── filters/                         # Global exception filter with consistent error format
├── types/                           # TypeScript type definitions
├── templates/email/                 # HTML email templates (onboarding, password reset, job match, etc.)
├── monitoring/                      # OpenTelemetry setup
└── logger/                          # Pino structured logging service
```

### Entry Point and Global Configuration

`main.ts` bootstraps the application with:
- **OpenTelemetry** initialization for distributed tracing and metrics
- **Global ValidationPipe** for automatic request validation via class-validator
- **Global ExceptionFilter** that catches all errors and returns a consistent `{ success, message, errors, path, timestamp }` response
- **Global Interceptors**: `HttpObservabilityInterceptor` (metrics), `ResolvePromisesInterceptor` (async resolution), `ClassSerializerInterceptor` (response shaping)
- **CORS** configured for the frontend domain
- **URI-Based API Versioning** (all routes prefixed with `/api/v1`)
- **Swagger** docs served at `/docs`

### Database Layer (MongoDB + Mongoose)

**MongoDB** was chosen as the database because:
- The data model is naturally document-oriented. User profiles contain nested arrays of skills, education, experience, and certifications that map cleanly to embedded documents.
- Schema flexibility allows different user roles (candidate, recruiter, college) to store different profile structures without complex joins.
- Mongoose provides schema validation, middleware hooks, and TypeScript type safety on top of MongoDB's flexibility.

**16+ Mongoose schemas** define the data model, including:
- `User` (profile, role, plan, billing, linked OAuth accounts)
- `AuthIdentity` (OAuth provider linkage)
- `Resume`, `ResumeBuilder` (uploaded and built resumes)
- `Company`, `RecruiterProfile`, `CompanyInvite` (company workspaces)
- `College`, `Student` (college workspaces)
- `JobPosting`, `Application` (job lifecycle)
- `Interview`, `InterviewSession`, `MockInterview`, `AIEvaluation` (interview system)
- `GamificationEvent`, `GamificationProfile` (XP and leveling)
- `ResourceCourse` (AI-generated learning content)
- `Bookmark` (saved items)

### Authentication System

Authentication is handled through multiple layers:

1. **Local Auth**: Email/password signup with **Argon2** password hashing (chosen over bcrypt for its memory-hard resistance to GPU attacks).
2. **JWT Tokens**: Signed with configurable secrets and expiry. Tokens are validated on every protected request via the `JwtStrategy` (Passport).
3. **OAuth 2.0**: Google and GitHub OAuth flows managed by dedicated strategies. OAuth state is stored temporarily in Redis (10-minute expiry) to prevent CSRF attacks. Users can link/unlink OAuth accounts to existing profiles.
4. **Password Reset**: OTP-based flow with Redis-backed rate limiting. Users receive an OTP via email, verify it, and set a new password. Maximum attempts and time windows are configurable.
5. **Role-Based Access Control**: The `RolesGuard` checks the `@Roles()` decorator on controller methods to enforce that only users with the correct role (USER, STUDENT, FACULTY, RECRUITER, COLLEGE, ADMIN) can access specific endpoints.

### Redis Integration

**Redis** serves as the fast, in-memory store for:
- **Rate Limiting**: Password reset requests are rate-limited per user with configurable windows and max attempts.
- **OTP Storage**: One-time passwords for password reset are stored with TTL, automatically expiring after use or timeout.
- **OAuth State**: The OAuth authorization state parameter is stored in Redis with a 10-minute TTL to validate callbacks and prevent CSRF.

Redis was chosen over alternatives because it provides sub-millisecond reads for these ephemeral, high-frequency operations without burdening MongoDB.

### Stripe Payment Integration

The payment system supports **Free** and **Pro** subscription plans:
- **Free Plan**: 5 monthly interviews.
- **Pro Plan**: Unlimited interviews (NPR 1499/month).
- **Checkout**: Creates Stripe hosted checkout sessions for plan upgrades.
- **Billing Portal**: Redirects users to Stripe's self-service portal for subscription management.
- **Verification**: Validates checkout completion and updates user plan/billing records.
- **Invoice Tracking**: Stores transaction history with unique IDs, amounts, status, and plan transitions.

### Email System

**Nodemailer** handles all transactional email with SMTP transport:
- **HTML Templates**: Seven branded email templates covering onboarding welcome, password reset (OTP), password change confirmation, application status updates, company invitations, and job match notifications.
- **Resilient Delivery**: Email failures are logged but do not crash the requesting operation, ensuring a failed email doesn't break the user flow.

### File Upload (Cloudinary)

**Cloudinary** was chosen as the CDN-backed file storage because it provides:
- Automatic image optimization and transformation
- Folder-based organization for profile photos, company logos, and documents
- Direct URL generation for serving assets globally
- Multipart FormData uploads handled via Multer on the NestJS side

### PDF Generation

Resume PDF export uses **Puppeteer** running headless Chromium to render HTML/CSS resume templates into pixel-perfect PDFs. The service generates the HTML from resume data, launches a browser instance, and returns the PDF as a downloadable buffer.

---

## Frontend Architecture (Next.js)

The frontend is built with **Next.js 16** using the **App Router**, **React 19**, and **TypeScript**. It follows a server-first architecture where data fetching, authentication, and mutations happen on the server whenever possible.

### Why Next.js App Router

The App Router was chosen because:
- **Server Components by Default**: Pages render on the server, sending minimal JavaScript to the browser. This gives fast initial loads and good SEO.
- **Server Actions**: Mutations (form submissions, API calls) run as `"use server"` functions, eliminating the need for separate API routes on the frontend.
- **Route Groups**: Logical grouping of routes `(public)`, `(auth)`, `(protected)` without affecting URL structure, enabling layout nesting and per-group authentication checks.
- **Streaming and Suspense**: Partial page rendering with loading states, so users see content as it becomes available.
- **Built-In Middleware**: Route-level middleware for authentication redirects.

### Route Structure

```
app/
├── layout.tsx                           # Root layout: fonts, ThemeProvider, ToastProvider
├── (public)/                            # No auth required
│   ├── page.tsx                         # Landing page
│   └── payment/                         # Payment information
├── (auth)/                              # Auth pages (sign-in, sign-up, forgot-password, OAuth callback)
│   ├── sign-in/
│   ├── sign-up/
│   ├── forgot-password/
│   └── oauth/callback, finalize
├── (protected)/                         # Requires authentication (layout checks getCurrentUser)
│   ├── admin/                           # Admin dashboard
│   ├── company-invites/                 # Join company workspace
│   ├── college-invites/                 # Join college workspace
│   └── (dashboard)/                     # Main app with sidebar
│       ├── layout.tsx                   # Dashboard shell: sidebar, workspace selector
│       ├── overview/                    # Dashboard home with analytics
│       ├── jobs/                        # Job browsing and creation
│       ├── resume/                      # AI Resume Builder
│       ├── interview-hub/               # Interview discovery
│       ├── interviews/                  # Interview management, creation (voice), taking, feedback
│       ├── applications/                # Application tracking
│       ├── saved/                       # Bookmarked items
│       ├── inbox/                       # Stream Chat messaging + video huddles
│       ├── resources/                   # AI learning resources
│       ├── leaderboard/                 # XP leaderboard
│       ├── settings/                    # Profile management
│       ├── company-settings/            # Company workspace settings
│       ├── college-settings/            # College workspace settings
│       ├── blogs/                       # Blog articles
│       ├── companies/[companyId]/       # Company detail
│       ├── portfolio-builder/           # Portfolio page builder
│       └── payment/checkout/            # Stripe checkout
└── portfolio/[slug]/                    # Public portfolio (no auth)
```

### Server Actions

All data mutations live in `lib/actions/` as `"use server"` files. This pattern was chosen because:
- Actions run on the server, so API tokens and secrets never reach the browser.
- They can be called directly from React components using `useTransition()` for pending states.
- No need to build and maintain a separate BFF (Backend for Frontend) layer.

**12 action modules** cover the entire application:
- `auth-action.ts` - Signup, login, logout, OAuth linking, profile updates, password reset
- `job-actions.ts` - Job CRUD, applications, resume management, bookmarks
- `interview-actions.ts` - Interview CRUD, sessions, saving
- `resume-builder-actions.ts` - Resume creation, AI suggestions, ATS scanning, PDF generation
- `company-actions.ts` - Company workspace management
- `college-actions.ts` - College workspace management
- `bookmark-actions.ts` - Bookmark toggling
- `resource-actions.ts` - Learning resource access
- `payment-actions.ts` - Stripe checkout and billing
- `inbox-actions.ts` - Stream Chat token and channel management
- `portfolio-actions.ts` - Public portfolio data
- `admin/` - Admin user management

### Data Access Layer (DAL)

The frontend uses a **cached data access layer** for authentication:

```typescript
// lib/dal.ts
export const getCurrentUser = cache(async (): Promise<TUser | null> => {
  const session = await verifySession();
  if (!session) return null;
  const user = await getMe();
  return user ?? null;
});
```

`React.cache()` deduplicates calls within a single server request, so calling `getCurrentUser()` in a layout and a page component results in only one API call.

### Session Management

Sessions use **httpOnly cookies** storing the JWT token:
- `createSession(token)` sets a secure, httpOnly cookie with 7-day expiry and lax SameSite policy.
- `verifySession()` checks for the `access_token` cookie on every protected request.
- The cookie is automatically included in all API calls via an Axios request interceptor.

This approach was chosen over localStorage because httpOnly cookies are immune to XSS attacks the token cannot be read or exfiltrated by client-side JavaScript.

### UI System (shadcn/ui + Tailwind CSS v4)

**shadcn/ui** was chosen because:
- Components are copied into the project (not installed as a package), giving full control over customization.
- Built on **Radix UI** primitives, which handle accessibility (keyboard navigation, screen readers, focus management) correctly out of the box.
- Styled with **Tailwind CSS v4**, which uses CSS-native features (CSS variables for theming, `@theme inline` for design tokens) instead of JavaScript-based configuration.

The design system includes 30+ components: Button, Card, Dialog, Dropdown Menu, Select, Tabs, Accordion, Alert Dialog, Avatar, Calendar, Popover, Progress, Slider, Tooltip, Separator, and more.

**Dark mode** is handled by `next-themes` with a `ThemeProvider` wrapping the root layout. Theme tokens (colors, radii, shadows) are defined as CSS custom properties that switch between light and dark variants.

**Typography**: Space Grotesk (primary) and Geist Mono (code) loaded via `next/font/google` for zero-layout-shift font loading.

**Utility**: The `cn()` function combines `clsx` (conditional classes) with `tailwind-merge` (deduplication of conflicting Tailwind classes).

### Forms (React Hook Form + Zod)

Every form uses **React Hook Form** with **Zod** validation:
- Zod schemas define validation rules (e.g., passwords must be 12+ characters with uppercase, lowercase, number, and symbol).
- `zodResolver` connects Zod schemas to React Hook Form, providing real-time validation feedback.
- Forms use `useTransition()` for non-blocking submissions with loading states.

### Additional Frontend Libraries

- **Recharts**: Dashboard analytics charts (work mode distribution, application trends).
- **Leaflet + React Leaflet**: Interactive map for location selection in job postings and profiles.
- **React Quill**: Rich text editor for job descriptions and blog content, with dark mode support.
- **Framer Motion**: Animations for page transitions and UI interactions.
- **date-fns**: Lightweight date formatting without the bloat of Moment.js.
- **DOMPurify (isomorphic)**: Sanitizes HTML content to prevent XSS when rendering user-generated content.
- **Sonner**: Toast notifications for success/error feedback.
- **Lucide React**: Consistent icon system across the interface.
- **Zustand**: Lightweight client-side state management for global UI state.
- **TanStack React Query**: Server state management and caching for client components.

---

## REST API Design

The backend exposes a **versioned REST API** at `/api/v1` with Swagger documentation at `/docs`.

### Endpoint Overview

| Domain | Base Path | Key Endpoints |
|--------|-----------|--------------|
| **Auth** | `/auth` | `POST /signup`, `POST /login`, `GET /me`, `PATCH /me/update`, `POST /change-password`, `POST /forgot-password`, `POST /reset-password`, `GET /oauth/:provider/authorize`, `GET /oauth/:provider/callback` |
| **Companies** | `/companies` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `GET /:id/recruiters`, `POST /join`, `POST /:id/invite-recruiter` |
| **Colleges** | `/colleges` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id` |
| **Jobs** | `/jobs` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `GET /metrics`, `POST /:id/apply`, `POST /:id/withdraw` |
| **Interviews** | `/interviews` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `POST /:id/start`, `GET /:id/sessions` |
| **Interview Voice** | `/interviews/vapi` | `GET /config`, `POST /generate` (webhook) |
| **Resume Builder** | `/resume-builder` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `POST /:id/ai-summary`, `POST /:id/ats-scan`, `GET /:id/pdf` |
| **Bookmarks** | `/bookmarks` | `GET /`, `POST /`, `DELETE /:id` |
| **Resources** | `/resources` | `GET /`, `POST /`, `GET /:id` |
| **Stream** | `/stream` | `GET /chat-token`, `GET /video-token`, `POST /ensure-channels` |
| **Payments** | `/payments/stripe` | `POST /checkout`, `GET /portal`, `POST /verify` |
| **Portfolio** | `/portfolio` | `GET /:slug` (public, no auth) |
| **Admin** | `/admin/users` | `GET /` (analytics, pagination) |

### Request/Response Pattern

Every response follows a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["field: error description"],
  "path": "/api/v1/auth/signup",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### Authentication Flow

1. `POST /auth/signup` creates user, returns JWT
2. `POST /auth/login` validates credentials, returns JWT
3. All protected endpoints require `Authorization: Bearer <token>` header
4. `GET /auth/me` returns current user profile
5. OAuth: `GET /auth/oauth/google/authorize` redirects to Google, callback returns JWT

---

## Design Patterns and Architecture

### Layered Architecture

The backend follows a **Layered (N-Tier) Architecture** with clear separation:

```
┌─────────────────────────────────────┐
│           Controllers               │  ← HTTP handling, request validation, response shaping
├─────────────────────────────────────┤
│             Services                │  ← Business logic, orchestration, AI calls
├─────────────────────────────────────┤
│           Repositories              │  ← Data access, database queries
├─────────────────────────────────────┤
│         Entities/Schemas            │  ← Data model definitions
├─────────────────────────────────────┤
│        MongoDB (Mongoose)           │  ← Persistence layer
└─────────────────────────────────────┘
```

Each layer only talks to the layer directly below it. Controllers never access the database directly. Services never handle HTTP concerns. This makes each layer independently testable and replaceable.

### Abstract Repository Pattern

Every data access operation goes through an **abstract repository class** that defines the contract, with a concrete implementation bound via NestJS dependency injection:

```
ACUserRepository (abstract)       →   UserRepository (concrete, Mongoose)
ACResumeRepository (abstract)     →   ResumeRepository (concrete, Mongoose)
ACJobPostingRepository (abstract) →   JobPostingRepository (concrete, Mongoose)
ACInterviewRepository (abstract)  →   InterviewRepository (concrete, Mongoose)
ACApplicationRepository (abstract)→   ApplicationRepository (concrete, Mongoose)
ACCompanyRepository (abstract)    →   CompanyRepository (concrete, Mongoose)
... (18+ repository pairs)
```

This pattern means:
- **Testability**: Unit tests inject mock repositories, testing business logic without a real database.
- **Flexibility**: Switching from MongoDB to PostgreSQL would only require new concrete implementations nothing in the service layer changes.
- **Contract Enforcement**: The abstract class guarantees that every repository implements required methods.

### Dependency Injection

NestJS's DI container manages object creation and lifetime. Services declare dependencies in their constructors, and NestJS resolves them automatically:

```typescript
@Injectable()
export class JobPostingService {
  constructor(
    private readonly jobRepo: ACJobPostingRepository,
    private readonly userService: UserService,
    private readonly geminiService: GeminiService,
  ) {}
}
```

This eliminates tight coupling and makes the system modular services can be composed, replaced, or mocked independently.

### Guard and Interceptor Pattern

Cross-cutting concerns are handled declaratively:

- **Guards** (`RolesGuard`, `AuthGuard('jwt')`) run before the controller method, checking authentication and authorization. The `@Roles('RECRUITER')` decorator on a method means only recruiters can access it.
- **Interceptors** (`HttpObservabilityInterceptor`) wrap the request lifecycle, measuring duration and recording metrics without any code changes in controllers.
- **Filters** (`GlobalExceptionFilter`) catch all unhandled exceptions and format them consistently.
- **Pipes** (`ValidationPipe`) validate and transform incoming data before it reaches the controller.

### Strategy Pattern (Authentication)

Authentication uses the **Strategy Pattern** via Passport.js:
- `JwtStrategy` validates bearer tokens
- `GoogleOAuthStrategy` handles Google OAuth2 flow
- `GithubOAuthStrategy` handles GitHub OAuth2 flow

Each strategy is a pluggable module. Adding a new OAuth provider (e.g., LinkedIn) means creating a new strategy class and registering it no changes to existing code.

### Strategy Pattern (AI Providers)

AI features use a **fallback strategy**:
- Gemini service tries the primary model (`gemini-2.5-flash`), then falls back to alternative models if the primary fails.
- Interview AI can prefer either OpenAI or Gemini based on configuration.
- Both providers implement structured output generation using Zod schemas for type-safe AI responses.

### Server Action Pattern (Frontend)

The frontend uses the **Server Action pattern** unique to Next.js App Router:
- All mutations are `"use server"` functions that run on the Node.js server.
- Components call actions directly no REST endpoints, no fetch calls, no API client code on the client side.
- Actions handle cookie management, API calls, error formatting, and cache revalidation.

---

## AI and Machine Learning

### Google Gemini

**Primary AI provider** for content generation tasks:

- **Resume ATS Scanning**: Analyzes resume content against ATS requirements, returning scores (0-100) across five categories with specific improvement tips. Uses JSON schema validation to ensure structured responses.
- **Interview Question Generation**: Generates interview questions tailored to job descriptions, difficulty levels, and interview types (technical, HR, behavioral, case study).
- **Course Generation**: Creates structured learning resources with chapters, sections, core concepts, interview questions, practice prompts, and curated YouTube video recommendations.
- **Interview Feedback**: Analyzes interview transcripts and generates scored evaluations with strengths and areas for improvement.

**Model**: `gemini-2.5-flash` with automatic fallback to alternative models on failure.

### OpenAI GPT-4o

**Secondary AI provider** for structured output tasks:

- **Interview Question Generation**: Uses OpenAI's structured outputs with Zod schemas for type-safe question generation.
- **Session Feedback**: Generates detailed interview feedback with category-based scoring using `gpt-4o` for higher quality analysis.

**Models**: `gpt-4o-mini` (general tasks), `gpt-4o` (complex analysis).

### VAPI (Voice AI)

**Voice interview engine** providing real-time conversational AI:

- **Frontend**: The `@vapi-ai/web` SDK initializes a voice session where the AI interviewer asks questions and the candidate responds verbally.
- **Backend**: A webhook endpoint (`/interviews/vapi/generate`) receives transcripts and session data from VAPI's servers.
- **Flow**: The frontend requests a VAPI configuration (web token, workflow ID) from the backend, starts a voice session, tracks real-time transcripts (speaker identification, timestamps), and sends the completed session data back for evaluation.

---

## Real-Time Communication

### Stream Chat SDK

**In-app messaging** between candidates and recruiters:

- **Backend**: Generates authenticated tokens via `StreamService`. Creates and manages conversation channels between users, scoped to job applications.
- **Frontend**: The `StreamChatProvider` initializes the Stream Chat client, connects the user, and ensures channels exist. The inbox view provides a full messaging interface with channel list, conversation panel, and message composition.
- **Channel Creation**: When a candidate applies to a job or a recruiter initiates contact, a dedicated 1-on-1 channel is created via `ensureStreamChannelWith(targetUserId, jobId)`.

### Stream Video SDK

**Video huddles** for live conversations:

- **Backend**: Generates video tokens via the same `StreamService`.
- **Frontend**: The `StreamHuddleProvider` manages video call state (participants, audio/video modes, minimize/restore). A video call button in the chat interface starts a huddle within the conversation context.

---

## Observability and Monitoring

The platform implements a full observability stack following the **three pillars**: traces, metrics, and logs.

### Sentry (Frontend Error Tracking)

**Sentry** is integrated into the Next.js frontend via `@sentry/nextjs`:
- Captures unhandled exceptions and request errors on both server and edge runtimes.
- `instrumentation.ts` registers Sentry for Node.js and Edge environments.
- `Sentry.captureRequestError` hooks into Next.js request lifecycle for automatic error reporting.
- Trace sampling at 100% during development (adjust for production).
- PII collection enabled for debugging user-specific issues.

### OpenTelemetry (Distributed Tracing and Metrics)

The backend initializes the **OpenTelemetry Node SDK** at startup:
- **Auto-Instrumentation**: Automatically instruments HTTP requests, MongoDB queries, and NestJS framework internals.
- **OTLP Exporters**: Sends traces and metrics to the OpenTelemetry Collector via gRPC (port 4317) and HTTP (port 4318).
- **Custom Metrics** via `HttpObservabilityInterceptor`:
  - `http_server_requests` (counter) total requests by method, route, status
  - `http_server_errors` (counter) error requests
  - `http_server_request_duration_ms` (histogram) response time distribution

### Jaeger (Distributed Tracing UI)

**Jaeger** receives traces from the OpenTelemetry Collector and provides:
- Visual request flow across services
- Span-level latency breakdown
- Error identification in distributed request chains
- Accessible at port 16686

### Prometheus (Metrics Storage)

**Prometheus** scrapes metrics from the OpenTelemetry Collector every 15 seconds:
- Stores time-series data for request rates, error rates, and latencies.
- **Alert Rules** (3 configured):
  - `KaaryaApiHigh5xxRate`: Fires when 5xx errors exceed 5% over 10 minutes (warning)
  - `KaaryaApiHighLatencyP95`: Fires when p95 latency exceeds 1000ms over 10 minutes (warning)
  - `KaaryaApiNoTraffic`: Fires when request rate drops below 0.01 req/s over 15 minutes (info)

### Grafana (Visualization)

**Grafana** is auto-provisioned with:
- **Prometheus datasource**: For querying metrics
- **Jaeger datasource**: For querying traces
- **Pre-built dashboard** (`kaarya-observability-overview.json`): Visualizes request rates, error rates, latency percentiles, and system health
- Accessible at port 3003

### Pino (Structured Logging)

**Pino** handles application logging:
- JSON-formatted structured logs for machine parsing
- Configurable log level via `APP_LOG_LEVEL` environment variable
- Integrated with NestJS as a custom logger service
- Correlates with OpenTelemetry trace IDs and span IDs for log-trace linking

### Observability Architecture

```
┌──────────────┐     gRPC/HTTP      ┌─────────────────────┐
│  NestJS App  │ ──────────────────→ │  OTel Collector     │
│  (OTel SDK)  │                     │  (receives, batches) │
└──────────────┘                     └─────────┬───────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                                 ▼
                     ┌──────────────┐                  ┌──────────────┐
                     │    Jaeger    │                  │  Prometheus  │
                     │   (traces)   │                  │  (metrics)   │
                     └──────────────┘                  └──────────────┘
                              │                                 │
                              └────────────────┬────────────────┘
                                               ▼
                                      ┌──────────────┐
                                      │   Grafana    │
                                      │ (dashboards)  │
                                      └──────────────┘
```

---

## Testing Strategy

The project implements a **comprehensive testing pyramid** across both frontend and backend, covering unit, integration, end-to-end, and visual regression testing.

### Backend Testing

| Layer | Framework | Config | Coverage |
|-------|-----------|--------|----------|
| **Unit Tests** | Jest | `jest.unit.json` | **100% threshold** (statements, branches, functions, lines) |
| **Integration Tests** | Jest + Supertest | `jest.integration.json` | 120s timeout, sequential execution |
| **E2E Tests** | Jest + Supertest | `jest-e2e.json` | 30s timeout, single worker |
| **Additional** | Mocha + Chai | `.mocharc.json` | 30s timeout |

**Key details**:
- Unit tests achieve **100% code coverage** with thresholds enforced in CI. Tests that fall below 100% on any metric will fail the build.
- Integration tests run sequentially (`maxWorkers: 1`) to avoid database conflicts.
- Supertest makes real HTTP requests against the NestJS application, testing the full request lifecycle.
- Mocha provides an alternative test runner for specific test suites, with Chai for BDD-style assertions.
- `mongodb-memory-server` provides in-memory MongoDB for tests, ensuring test isolation without external database dependencies.

**Scripts**:
```bash
npm run test:unit          # Unit tests with 100% coverage enforcement
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end API tests
npm run test:cov           # Coverage report
```

### Frontend Testing

| Layer | Framework | Config | Coverage |
|-------|-----------|--------|----------|
| **Unit Tests** | Vitest + RTL | `vitest.config.ts` | **95% threshold** |
| **Integration Tests** | Vitest + RTL | `vitest.config.ts` | **95% threshold** |
| **Component Tests** | Storybook + Vitest | `vitest.storybook.config.ts` | Browser (Playwright) |
| **Snapshot Tests** | Storybook | `vitest.storybook-snapshots.config.ts` | Visual regression |
| **E2E Tests** | Cypress | `cypress.config.ts` | Full user flows |

**Key details**:
- **Vitest** (chosen over Jest for the frontend) provides native ESM support, faster execution via Vite's transformation pipeline, and built-in TypeScript support.
- **React Testing Library (RTL)** enforces testing from the user's perspective (query by role, text, label) rather than implementation details.
- **Storybook v10** documents UI components with 8+ stories and enables isolated component testing via Playwright browser runner.
- **Snapshot testing** catches unintended visual regressions by comparing rendered component output against stored snapshots.
- **Cypress** runs full E2E tests against the running application at `localhost:3001`, simulating real user interactions (login, navigation, form submission) in a real browser.
- Coverage threshold of **95%** across statements, branches, functions, and lines, measured via the v8 provider.

**Scripts**:
```bash
npm run test               # All unit + integration tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:storybook     # Storybook component + snapshot tests
npm run cypress            # Cypress E2E tests
npm run storybook          # Launch Storybook dev server (port 6006)
```

---

## DevOps and Deployment

### Docker (Containerization)

The backend uses a **multi-stage Docker build** for minimal production images:

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
COPY package*.json ./
RUN npm ci

# Stage 2: Build application
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production    # Remove dev dependencies

# Stage 3: Production image
FROM node:20-alpine AS runner
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

This produces a lean image with only production dependencies and compiled JavaScript no TypeScript source, no dev tools, no test files.

### Docker Compose

**Production** (`docker-compose.yml`):
```yaml
services:
  api:
    image: ghcr.io/trishan9/kaarya-backend:latest
    ports: ["3000:3000"]
    env_file: .env
    restart: unless-stopped
```

**Observability Stack** (`docker-compose.observability.yml`):
Extends the base with Jaeger, OpenTelemetry Collector, Prometheus, and Grafana, all on a shared `backend` network.

### Nginx (Reverse Proxy)

Nginx sits in front of the NestJS application on the Azure VM:

- **Proxies** all requests to `http://localhost:3000`
- **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`
- **WebSocket Support**: Forwards `Upgrade` and `Connection` headers for real-time features
- **Hidden File Protection**: Returns 404 for requests to dotfiles (`/.env`, `/.git`, etc.)
- **Logging**: Separate access and error logs per domain

### GitHub Actions CI/CD

The deployment pipeline is fully automated via GitHub Actions:

**Trigger**: Push to `main` branch affecting `kaarya_backend/**` files, or manual workflow dispatch.

**Pipeline**:
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Code Push   │────→│  Build & Push    │────→│  Deploy to VM   │
│  to main     │     │  Docker Image    │     │  via SSH        │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

1. **Build**: Checks out code, sets up Docker Buildx, builds the image from `kaarya_backend/` context.
2. **Push**: Tags the image as `ghcr.io/trishan9/kaarya-backend:latest` and `ghcr.io/trishan9/kaarya-backend:<git-sha>`, pushes to GitHub Container Registry.
3. **Deploy**: Copies `docker-compose.yml` to the Azure VM via SCP, SSHs in, pulls the latest image, runs `docker compose up -d --remove-orphans`.
4. **Health Check**: Waits 10 seconds, then curls `http://localhost:3000/api/health` to verify the deployment.
5. **Cleanup**: Prunes dangling Docker images to free disk space.

**Concurrency**: Only one deployment runs at a time. New pushes cancel in-progress deployments.

### Azure VM (Production Hosting)

The production environment runs on an **Azure Virtual Machine**:
- Nginx handles incoming HTTPS traffic and reverse-proxies to the Docker container.
- The Docker container runs the NestJS application on port 3000.
- Environment variables are stored in a `.env` file on the VM (verified during deployment).
- The observability stack (Jaeger, Prometheus, Grafana) runs as additional Docker containers on the same VM.

### Swagger (API Documentation)

**Swagger UI** is auto-generated from NestJS controller decorators and served at `/docs`:
- Every endpoint is documented with request/response schemas.
- DTOs provide automatic schema generation.
- Interactive "Try it out" functionality for testing endpoints directly.
- Authentication support (JWT bearer token input).

---

## Future Improvements

### AI-Proctored Teacher Recruitment

Extend the platform for **faculty hiring** at colleges:
- AI-proctored mock teaching sessions where candidates deliver lectures on assigned topics.
- AI evaluation of teaching quality covering clarity, engagement, subject knowledge, and pedagogy.
- Graded mock lecture evaluations that colleges can use to make fair, data-driven hiring decisions.
- Rubric-based scoring that eliminates subjective bias in faculty recruitment.

### Full SaaS Multi-Tenancy

Transform Kaarya.ai into a **white-label SaaS platform**:
- Multi-tenant architecture where each college or organization gets an isolated workspace with custom branding.
- Self-service onboarding with Stripe-powered tiered pricing (Basic, Professional, Enterprise).
- Custom domain mapping so institutions can serve the platform under their own domain.
- Admin analytics dashboard with cross-tenant metrics for platform operators.

### Vector Database-Backed Semantic Search

Integrate a **vector database** (Pinecone, Weaviate, or pgvector) for intelligent recommendations:
- Embed resumes, job descriptions, and interview transcripts as vectors.
- **Semantic Job Matching**: Match candidates to jobs based on meaning, not just keyword overlap. A candidate with "built REST APIs with Express" would match a job requiring "backend development experience" even without exact keyword match.
- **Similar Candidate Discovery**: Recruiters find candidates similar to their best hires.
- **Course Recommendations**: Suggest learning resources based on skill gaps identified in interview performance.
- **Smart Search**: Users search with natural language queries like "remote frontend jobs for beginners in Kathmandu" instead of rigid filters.

### AI Career Path Advisor

Build an **AI career counselor** that:
- Analyzes a student's skills, interview performance, and job market trends.
- Suggests personalized career paths with skill development roadmaps.
- Recommends specific courses, certifications, and interview practice areas.
- Tracks progress over time and adjusts recommendations dynamically.

### Advanced Analytics and Reporting

- **College Placement Reports**: Automated placement statistics (percentage placed, average salary, top hiring companies) for institutional reporting.
- **Skill Gap Analysis**: Aggregate data across all candidates to identify skill gaps in the market, helping colleges update their curriculum.
- **Recruiter Insights**: Funnel analytics (views to applications to hires), time-to-hire metrics, and candidate quality scoring.

### Mobile Application

- React Native or Flutter mobile app for on-the-go access.
- Push notifications for application status updates, interview invitations, and messages.
- Voice interview practice directly from mobile devices.

### Microservices Migration

As the platform scales:
- Extract AI services (resume scanning, interview generation, course creation) into dedicated microservices with independent scaling.
- Event-driven architecture with message queues (RabbitMQ or Kafka) for asynchronous processing.
- Separate read and write models (CQRS) for high-traffic endpoints like job search and leaderboard.

### Additional Integrations

- **LinkedIn Import**: One-click profile import from LinkedIn.
- **Calendar Integration**: Sync interview schedules with Google Calendar and Outlook.
- **Slack/Teams Notifications**: Workspace notifications for recruiter teams.
- **LMS Integration**: Connect with college learning management systems for unified student data.

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Redis
- Docker (for containerized deployment)

### Backend Setup

```bash
cd kaarya_backend
cp .env.example .env          # Configure environment variables
npm install
npm run start:dev             # Development server on port 3000
```

### Frontend Setup

```bash
cd kaarya_frontend
cp .env.example .env.local    # Configure environment variables
npm install
npm run dev                   # Development server on port 3001
```

### Running Tests

```bash
# Backend
cd kaarya_backend
npm run test:unit             # Unit tests (100% coverage)
npm run test:integration      # Integration tests
npm run test:e2e              # End-to-end tests

# Frontend
cd kaarya_frontend
npm run test                  # Unit + integration tests
npm run test:storybook        # Storybook component tests
npm run cypress               # E2E tests
```

### Docker Deployment

```bash
cd kaarya_backend
docker compose up -d                                    # API server
docker compose -f docker-compose.observability.yml up -d # Monitoring stack
```

---

## License

This project is developed as part of an academic initiative for colleges and universities in Nepal.

---

*Built with passion for Nepal's future workforce.*
