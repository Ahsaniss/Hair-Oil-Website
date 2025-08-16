# Overview

This is a full-stack e-commerce application for selling hair care products, built with React/TypeScript frontend and Express.js backend. The application features user authentication, product management, shopping cart functionality, order processing, and admin panels. It's designed as a modern web application with a clean, professional interface using shadcn/ui components and Tailwind CSS styling.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: React Router DOM for client-side navigation
- **State Management**: React Context API for authentication and cart state
- **Data Fetching**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **API Design**: RESTful API endpoints with proper error handling
- **File Structure**: Organized into routes, storage layer, and database connection modules

## Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: Users, profiles, products, categories, orders, order_items, cart_items, reviews
- **Relationships**: Proper foreign key relationships between entities
- **Data Types**: Uses UUID for primary keys, timestamps for audit trails

## Authentication & Authorization
- **Strategy**: JWT tokens stored in localStorage
- **Password Security**: bcrypt hashing for password storage
- **Role-based Access**: Admin and user roles with protected routes
- **Session Management**: Token-based authentication with automatic logout on expiration

## State Management Pattern
- **Global State**: React Context for user authentication and shopping cart
- **Server State**: TanStack Query for API data caching and synchronization
- **Local State**: React useState for component-specific state
- **Form State**: React Hook Form with Zod validation schemas

## Component Architecture
- **Design System**: Consistent component library using shadcn/ui
- **Layout Structure**: Nested layouts for different sections (public, admin)
- **Reusable Components**: Modular components for products, cart, forms
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database operations and migrations
- **Environment Variables**: DATABASE_URL for database connection

## UI & Styling Dependencies
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Sonner**: Toast notification system

## Development & Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production
- **PostCSS**: CSS processing with Tailwind

## Authentication & Validation
- **JWT (jsonwebtoken)**: Token-based authentication
- **bcrypt**: Password hashing
- **Zod**: Schema validation for forms and API requests
- **React Hook Form**: Form state management and validation

## API & Data Management
- **Axios**: HTTP client for API requests
- **TanStack Query**: Server state management and caching
- **React Router**: Client-side routing with protected routes

## Development Dependencies
- **Replit Integration**: Special configuration for Replit environment
- **WebSocket Support**: For real-time features (ws package for Neon)
- **CORS Handling**: Cross-origin request support