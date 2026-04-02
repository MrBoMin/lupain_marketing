# Luu Pain Marketing - Learning Management System

A modern, full-featured Learning Management System built with Next.js, Supabase, and Vimeo for video hosting. This platform enables instructors to create and manage video courses while students can enroll, track progress, and learn at their own pace.

## Features

### For Students
- **User Authentication** - Secure signup/login with email and password
- **Course Catalog** - Browse all available published courses
- **Course Enrollment** - Enroll in courses (free or paid with payment verification)
- **Video Learning** - Watch Vimeo-hosted videos with progress tracking
- **Progress Tracking** - Automatic tracking of video position and lesson completion
- **Student Dashboard** - View enrolled courses and overall progress
- **Continue Learning** - Resume from where you left off
- **Lesson Comments** - Discuss lessons with threaded comments
- **User Profile** - Manage personal information
- **Dark Mode** - Full dark/light mode support

### For Admins
- **Admin Dashboard** - Overview of platform statistics
- **Course Management** - Create, edit, and delete courses with chapters
- **Lesson Management** - Add lessons with Vimeo video IDs
- **Enrollment Workflow** - Approve/reject enrollments with payment screenshot review
- **User Management** - View all registered users and students
- **Free Videos** - Manage standalone tutorial videos
- **Email Notifications** - Automatic emails on enrollment approval/rejection
- **Payment Settings** - Configure payment information
- **Course Publishing** - Control course visibility (draft/published)
- **Pricing & Promotions** - Set prices, discounts, and promo deadlines

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Video Hosting:** Vimeo
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Email:** Nodemailer (Gmail)
- **Deployment:** Vercel

## Prerequisites

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- A Vimeo account for video hosting
- Git installed

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MrBoMin/luupaingmarketing.git
cd luupaingmarketing
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon/public key
4. Go to SQL Editor and run the SQL files from `supabase/` in this order:
   - `schema.sql` (core tables)
   - `chapters.sql` (chapter support)
   - `pricing.sql` (course pricing)
   - `promotion_deadline.sql` (promo deadlines)
   - `enrollment_workflow.sql` (enrollment approval flow)
   - `free_videos.sql` (free tutorial videos)
   - `storage_buckets.sql` (file storage)

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VIMEO_ACCESS_TOKEN=your_vimeo_access_token
NEXT_PUBLIC_SITE_URL=https://your-domain.com
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Creating Your First Admin User

1. Sign up for an account at `/signup`
2. Go to your Supabase dashboard > Table Editor > users table
3. Find your user and change the `role` column from `user` to `admin`
4. Refresh the page and you'll see the Admin Panel link

## Project Structure

```
luupaingmarketing/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── actions/         # Server actions
│   ├── admin/           # Admin panel pages
│   ├── api/             # API routes (Vimeo proxy)
│   ├── auth/            # OAuth callback + email confirm
│   ├── courses/         # Public course pages
│   ├── dashboard/       # Student dashboard + lesson player
│   ├── profile/         # User profile
│   └── videos/          # Free tutorial videos
├── components/
│   ├── ui/              # Reusable UI components (shadcn)
│   ├── navbar.tsx       # Navigation
│   ├── lesson-player.tsx # Video player with progress
│   └── ...
├── lib/
│   ├── supabase/        # Supabase client configurations
│   ├── email.ts         # Email service
│   └── utils.ts         # Utility functions
├── supabase/
│   └── *.sql            # Database schema files
└── types/
    └── database.types.ts # TypeScript types
```

## Deployment to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add all environment variables from `.env.local`
4. Deploy
5. Add your Vercel domain to Supabase > Authentication > URL Configuration

## License

This project is proprietary. All rights reserved.
