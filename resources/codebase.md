# CinX Codebase Analysis

## 1. Project Overview
CinX is a modern movie ticket booking platform integrated with AI (Ollama-powered) for personalized recommendations, automated content generation, and smart system management.

## 2. Technical Stack
- **Frontend:** React 18, Redux (State Management), React Router 6 (Routing).
- **Backend-as-a-Service:** Supabase (Authentication, Real-time Database, Storage, Edge Functions).
- **AI Integration:** Ollama (Llama 3.2, Gemini Flash) via local API proxy.
- **External APIs:** TMDB (Movie Metadata), VNPAY (Payment Gateway).
- **Styling:** Vanilla CSS with a focus on dark-themed cinematic UI.

## 3. Directory Structure & Key Files

### `/main` - Core Application
*   `package.json`: Defines dependencies like `@supabase/supabase-js`, `react-redux`, `swiper`, and `react-markdown`.
*   `App.js`: Root component defining all application routes and global providers.
*   `dockerfile` & `docker-compose.yml`: Containerization configuration.

### `/main/src/services` - Logic & Integrations
*   `ai.js`: **Central AI Orchestrator**. Handles:
    *   Natural Language Understanding (NLU) for booking requests.
    *   Context-aware recommendations.
    *   Sentiment analysis for user comments.
    *   AI-generated news articles and promotions.
    *   Weekend pricing logic adjustment.
*   `api.js`: Comprehensive Supabase wrapper for:
    *   CRUD operations for Movies, Showtimes, Rooms, and Bookings.
    *   `showtimeManagementAPI`: Logic for automatic weekly schedule generation.
    *   `bookingAPI`: Transactional booking logic and seat reservation.
*   `tmdb.js`: Integration with The Movie Database for fetching high-quality posters, trailers, and metadata.
*   `supabaseClient.js`: Initialized Supabase client with auth and realtime options.

### `/main/src/components` - UI Building Blocks
*   `admin/`: Specialized management components:
    *   `AdminOverview.jsx`: Revenue charts and system status.
    *   `MovieManagement.jsx`: Automated movie imports via TMDB.
    *   `CommentModeration.jsx`: AI-assisted comment approval workflow.
    *   `SeatingPricingManagement.jsx`: Global configuration for seat types and prices.
*   `GenericSkeleton.jsx` & `MovieCardSkeleton.jsx`: Loading states for better UX.
*   `ProtectedRoute.jsx`: Role-based access control (Admin, Mod, User).

### `/main/src/pages` - Main Views
*   `HomePage.jsx`: Featured carousel and movie listings.
*   `MovieDetails.jsx`: Deep dive into movie info, showtimes, and reviews.
*   `BookingPage.jsx`: The core ticket purchase flow.
*   `CheckinScanner.jsx`: QR-based ticket validation tool for cinema staff.
*   `MyTicketsPage.jsx`: Personal digital ticket wallet.

### `/main/src/redux` & `/main/src/contexts`
*   `datVeReducer.js`: Manages real-time seat selection state.
*   `AuthContext.jsx`: Bridges Supabase Auth with React component tree.
*   `ContentContext.jsx`: Global data cache for movies and promotions to reduce API calls.

### `/resources` - Documentation & Assets
*   `db-schema.md`: Detailed Supabase table structures.
*   `vnpay-integration.md`: Technical guide for payment flow.
*   `ai-integration.md`: Strategy for AI-enhanced features.
*   `cinex_dataset_1000.jsonl`: Training/Fine-tuning data for the AI model.

## 4. Key Workflows
1.  **AI-Assisted Booking:** User chats with "CinX AI" -> AI extracts date/movie/time -> Suggests specific showtime links -> User clicks to book.
2.  **Automated Scheduling:** Admin triggers "Weekly Schedule" -> System checks movie status, room types (IMAX/4DX), and applies pricing multipliers -> Generates thousands of seats via Database RPC.
3.  **Check-in Process:** Staff uses `/checkin` -> Scans QR code from user's `MyTicketsPage` -> Real-time validation via Supabase and logs action.
