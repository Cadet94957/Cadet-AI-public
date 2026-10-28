# Cadet - Employee Onboarding Platform

## Overview

Cadet is a comprehensive employee onboarding platform designed to streamline the new employee experience. The platform combines an AI-powered chatbot, study material generation, and a document repository to provide a complete onboarding solution. Built with modern web technologies, it offers an intuitive interface for HR teams and new employees to manage and access onboarding resources effectively.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **File Handling**: Multer for file uploads with local storage

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **File Storage**: Local file system with organized upload directory
- **Session Storage**: PostgreSQL-based session management using connect-pg-simple

## Key Components

### AI Chatbot System
- **Purpose**: Provides instant support for new employees with company policy and onboarding questions
- **Implementation**: OpenAI GPT-4o integration with conversation history tracking
- **Features**: Multi-conversation support, persistent chat history, contextual responses

### Study Materials Generator (Presenton-Enhanced)
- **Purpose**: Creates customized learning materials based on employee needs using advanced AI capabilities
- **Types**: Professional presentations (PowerPoint/PDF) and comprehensive study notes
- **Presenton Features**: Advanced theme selection, slide count control (5-20 slides), enhanced visual design
- **Themes**: Five professional options - General, Modern, Professional, Classic, and Creative
- **Content Generation**: AI-powered content optimized for specific slide counts and visual presentation
- **Styling**: Enhanced PowerPoint generation with gradient effects, professional layouts, and theme-based color schemes
- **PDF Enhancement**: Advanced PDF generation with visual elements, progress indicators, and improved typography
- **Intelligence**: Integrates content from document repository for company-specific, contextually accurate materials
- **Formats**: PowerPoint (.pptx) and PDF presentation files with Presenton visual enhancements

### Document Repository
- **Purpose**: Centralized storage and organization of onboarding documents
- **Features**: Category-based filtering, file type filtering, view tracking
- **Support**: Multiple file formats with thumbnail generation capability

### User Management
- **Authentication**: Session-based authentication system
- **User Profiles**: Display name, avatar, and role-based access
- **Mock Implementation**: Currently uses hardcoded user for development

## Data Flow

1. **User Authentication**: Session validation on protected routes
2. **Chat Interactions**: Message → OpenAI API → Database storage → Real-time updates
3. **Document Management**: Upload → File processing → Metadata storage → Searchable repository
4. **Study Material Generation**: User input → AI processing → Structured content creation → Storage

## External Dependencies

### Core Technologies
- **OpenAI API**: GPT-4o model for AI-powered responses and content generation
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Google Drive API**: OAuth2 integration for document import from Google Drive
- **Microsoft Graph API**: OAuth2 integration for document import from OneDrive
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework

### Development Tools
- **Vite**: Build tool with HMR and optimization
- **TypeScript**: Type safety across the entire stack
- **ESLint/Prettier**: Code quality and formatting
- **Drizzle Kit**: Database schema management and migrations

## Deployment Strategy

### Development Environment
- **Platform**: Replit with integrated PostgreSQL
- **Hot Reload**: Vite dev server with Express backend
- **File Watching**: Automatic restart on server changes

### Production Build
- **Frontend**: Vite build with optimized assets
- **Backend**: ESBuild compilation to ESM format
- **Static Assets**: Served from Express with proper caching headers
- **Environment**: NODE_ENV=production with optimized configurations

### Database Management
- **Migrations**: Drizzle Kit for schema changes
- **Connection**: Neon serverless with connection pooling

## Recent Changes
- October 4, 2025: Implemented comprehensive 10-step Day 1 onboarding flow
  - Extended onboarding from 3 steps to 10 steps with complete Day 1 employee journey
  - Created Step 4: Transition page ("Let's Get Started with Day 1!")
  - Created Step 5: App Verification - Ninite-style app access checking with status tracking
  - Created Step 6: Company Orientation - Mission, values, leadership overview, and culture quiz
  - Created Step 7: HR & Compliance - Benefits, payroll, PTO, and compliance module checklists
  - Created Step 8: Team Introductions - Meet teammates and schedule coffee chats
  - Created Step 9: Role-Specific Deep Dive - Responsibilities, tools, workflows, KPIs, and sandbox tasks
  - Created Step 10: End-of-Day Reflection - Open-ended reflection prompts for continuous improvement
  - Added onboardingData jsonb column to users table for flexible Day 1 progress storage
  - Updated backend API routes to save/load onboarding progress data including Day 1 artifacts
  - Enhanced progress tracking system to handle all 10 steps with automatic "welcome back" routing
  - Maintained consistent centered, animated design aesthetic across all new pages
  - All pages feature staggered fade-in animations and clean #F8F8F0 background
- August 6, 2025: Enhanced study materials generator with Presenton AI capabilities
  - Integrated advanced presentation generation with theme selection and slide count control
  - Added five professional themes: General, Modern, Professional, Classic, and Creative
  - Implemented slide count slider (5-20 slides) for precise content control
  - Enhanced PowerPoint generation with advanced layouts, theme colors, and improved visual design
  - Upgraded PDF generation with gradient effects, enhanced typography, and progress indicators
  - Updated AI prompts to generate content optimized for specific slide counts and themes
  - Enhanced both frontend form controls and backend generation with Presenton features
  - Maintained existing document repository RAG integration for company-specific content
- August 2, 2025: Implemented automatic Microsoft Teams integration with OAuth authentication
  - Created Microsoft Graph API integration for direct Teams messaging to employees
  - Added OAuth authentication flow with Microsoft account connection
  - Built "Connect Microsoft Account" button in settings for seamless setup
  - Fixed messaging service status detection and HTTP method errors
  - Enabled manager-to-employee messaging through MessageEmployeeDialog component
  - Teams integration now prioritized over Slack for employee communications
- July 31, 2025: Implemented cloud storage integration with Google Drive and Microsoft OneDrive
  - Added external token storage table for OAuth authentication
  - Created Google Drive and Microsoft OneDrive connector modules with OAuth2 flows
  - Built comprehensive external integration API routes for authorization, file listing, and import
  - Developed cloud integrations frontend with file browser and import interface
  - Added cloud storage navigation to both employee and manager sidebars
  - Integrated imported documents with existing RAG-enabled AI assistants
  - Added file size formatting, thumbnails, and category selection for imports
  - Implemented connection status monitoring and token management
- July 30, 2025: Implemented role-based routing system
  - Removed dashboard from employee navigation (employees now start at onboarding)
  - Added automatic redirection: employees → onboarding, managers → manager dashboard
  - Created RoleBasedRedirect component for seamless user experience
  - Maintained manager dashboard functionality while streamlining employee workflow
- July 30, 2025: Implemented document categorization infrastructure with RAG-enabled chatbots
  - Created "Onboarding Documents" and "Cadet Documents" sections in manager repository
  - Enhanced onboarding chatbot with RAG functionality using onboarding documents for responses
  - Enhanced main AI Assistant with RAG functionality using cadet documents for responses
  - Added document category management with ability to move documents between sections
  - Updated database schema to support document categorization
- July 30, 2025: Created comprehensive "Onboarding" feature
  - Added new navigation item and dedicated pages for both employees and managers
  - Built clean, centered chatbot interface with oval input fields
  - Implemented role-specific AI assistance and welcome messages
  - Added onboarding feature to dashboard "Get Started" section
  - Created separate API endpoint for onboarding chat functionality
- July 30, 2025: Completed full rebrand from "SkillVault" to "Cadet"
  - Updated all user-facing text, branding, and documentation
  - Fixed theme storage keys and presentation generator references
  - Added missing generateConversationTitle function
- June 25, 2025: Enhanced AI study material generator to use document repository content
  - Modified AI prompts to incorporate content from uploaded company documents
  - Added document context extraction to provide company-specific materials
  - Improved presentation and study notes generation with authentic company information
  - Fixed PowerPoint generator format selection to properly create .pptx files
- June 25, 2025: Implemented document protection system for manager-uploaded files
  - Added shield icons to protected documents uploaded by managers
  - Prevented employee users from deleting manager-uploaded documents
  - Enhanced backend validation and frontend UI for document protection
- June 25, 2025: Added employee management functionality for managers
  - Created dedicated employee management page with employee cards
  - Added employee progress tracking and status indicators
  - Implemented employee statistics dashboard with onboarding metrics
  - Added "Manage Employees" navigation item for manager users
  - Created sample employee data for demonstration
- June 25, 2025: Implemented dual-user system with employee and manager views
  - Added user role system with employee/manager differentiation
  - Created user switching functionality with dropdown menu in left sidebar top section
  - Implemented separate manager dashboard and navigation
  - Added manager-specific routes and pages
  - Role-based navigation and interface customization
  - Complete system architecture documentation with file locations
  - Detailed modification guides for all major components
  - Step-by-step instructions for customizing AI, UI, and database
  - Troubleshooting guide and deployment instructions
- June 24, 2025: Enhanced AI presentation generator with document repository integration
  - AI now incorporates content from uploaded documents to create company-specific materials
  - Fixed PowerPoint and PDF file download functionality with proper file serving
  - Implemented actual file generation with corporate styling and branding
  - Added intelligent content creation based on available company documents
- June 24, 2025: Enhanced AI presentation generator with format training
  - Analyzed sample presentation materials to extract format and style patterns
  - Updated AI prompts to match professional corporate presentation structure
  - Implemented solution-oriented messaging with business metrics and ROI focus
  - Added industry-specific terminology and professional formatting guidelines
- June 24, 2025: Enhanced file upload and document management functionality
  - Multi-file upload capability with drag-and-drop support and progress indicators
  - Automatic filename-based document titles for streamlined uploading
  - Document description editing through dedicated dialog interface
  - PDF thumbnail generation using pdftoppm and Sharp image processing
  - Comprehensive document management with rename, duplicate, delete, and edit options
- June 24, 2025: Removed flashcards functionality from material generator
- June 24, 2025: Initial platform setup with AI assistant conversation history

## User Preferences

Preferred communication style: Simple, everyday language.