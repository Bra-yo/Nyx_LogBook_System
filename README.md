# BG HUB Consulting LTD WorkLog System

A premium SaaS-grade WorkLog management system built for BG HUB Consulting LTD.

## Features

### Core System

- **Role-Based Access Control (RBAC)** with 4 distinct roles
- **Modern UI/UX** with dark theme and glassmorphism effects
- **Responsive Design** optimized for mobile and desktop
- **Real-time Notifications** and activity tracking
- **Advanced Analytics** and reporting capabilities

### Student Module

- ✅ Create and manage work records
- ✅ Track work progress with visual indicators
- ✅ View supervisor comments and lecturer feedback
- ✅ Generate weekly, monthly, and full internship reports
- ✅ File attachment support (infrastructure ready)
- ✅ Draft and submission workflow

### Supervisor Module

- ✅ Review and approve student work records
- ✅ Add detailed comments and ratings
- ✅ Quick approve/reject functionality
- ✅ Track assigned students' progress
- ✅ Analytics dashboard with submission trends

### Lecturer Module

- ✅ Assess student performance across multiple criteria
- ✅ Technical, communication, and professionalism scoring
- ✅ Academic feedback system
- ✅ Grade management and reporting
- ✅ Student progress tracking

### Admin Module

- ✅ Comprehensive user management system
- ✅ Department management and organization
- ✅ System analytics and insights
- ✅ User role assignment and permissions
- ✅ System activity monitoring and logs

## Tech Stack

### Frontend

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **ShadCN UI** components
- **Framer Motion** for animations
- **Lucide React** icons

### Backend

- **Next.js API Routes** and Server Actions
- **NextAuth.js** for authentication
- **Prisma ORM** for database management
- **PostgreSQL** database

### Additional Libraries

- **React Hook Form + Zod** for form validation
- **Zustand** for state management
- **Recharts** for data visualization
- **UploadThing** for file uploads
- **jsPDF** for PDF generation
- **date-fns** for date manipulation

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── auth/                      # Authentication pages
│   ├── student/                    # Student module
│   ├── supervisor/                 # Supervisor module
│   ├── lecturer/                   # Lecturer module
│   └── admin/                     # Admin module
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── layout/                    # Layout components
│   └── providers/                 # Context providers
├── lib/                          # Utility functions and configurations
├── types/                        # TypeScript type definitions
└── prisma/                       # Database schema and migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd log_book
   npm install
   ```

2. **Environment Setup:**

   ```bash
   cp env.example .env
   ```

   Configure your `.env` file with:
   - Database connection string
   - NextAuth secret
   - UploadThing credentials

3. **Database Setup:**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

### Registration Email Configuration

Registration emails use SMTP and are sent after the registration transaction and PDF generation complete. Configure these environment variables in the server environment:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=BG HUB Consulting LTD <no-reply@example.com>
BG_HUB_CONTACT_EMAIL=info@example.com
BG_HUB_CONTACT_PHONE=+254 700 000 000
```

Failed deliveries are retained in the `email_deliveries` table and can be retried by an administrator through `POST /api/admin/email-deliveries/:id/retry`.

4. **Start Development Server:**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## Authentication

The system uses role-based authentication with the following roles:

### Demo Accounts

- **Student:** `student@demo.com` / `password123`
- **Supervisor:** `supervisor@demo.com` / `password123`
- **Lecturer:** `lecturer@demo.com` / `password123`
- **Admin:** `admin@demo.com` / `password123`

## Database Schema

The system includes comprehensive database models:

- **Users** - Authentication and role management
- **StudentProfiles** - Student-specific information
- **SupervisorProfiles** - Supervisor details
- **LecturerProfiles** - Lecturer information
- **AdminProfiles** - Administrator configuration
- **LogbookEntries** - Student work submissions
- **SupervisorComments** - Supervisor feedback
- **LecturerAssessments** - Academic evaluations
- **Departments** - Organizational structure
- **Notifications** - System notifications
- **AuditLogs** - Activity tracking

## Design System

### UI Features

- **Dark theme** by default
- **Glassmorphism** effects for modern aesthetics
- **Smooth animations** with Framer Motion
- **Responsive design** with mobile-first approach
- **Accessibility** following WCAG guidelines

### Component Library

- Built with **ShadCN UI** components
- **TailwindCSS** for consistent styling
- **Lucide icons** for cohesive iconography
- **Custom components** for specific use cases

## Responsive Design

- **Mobile:** Optimized for phones and tablets
- **Tablet:** Enhanced layouts for medium screens
- **Desktop:** Full-featured experience for large screens
- **Adaptive navigation** based on screen size

## Security Features

- **JWT-based authentication** with NextAuth
- **Role-based authorization** middleware
- **Input validation** with Zod schemas
- **Protected API routes** with role checks
- **Secure file uploads** with validation
- **Password hashing** with bcrypt
- **Activity logging** for audit trails

## Analytics & Reporting

### Student Reports

- Weekly progress summaries
- Monthly performance reports
- Complete internship documentation
- PDF export functionality
- Supervisor comment integration

### Admin Analytics

- User activity metrics
- Submission trends and patterns
- Department-wise statistics
- System performance monitoring
- Export capabilities

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - JWT secret key
- `UPLOADTHING_SECRET` - File upload service
- `UPLOADTHING_APP_ID` - UploadThing app ID
- `CLICKUP_API_TOKEN` - ClickUp API token
- `CLICKUP_TEAM_ID` - ClickUp workspace/team ID
- `CLICKUP_SPACE_ID` - ClickUp space where cohort lists are created
- `CLICKUP_FOLDER_ID` - Optional ClickUp folder where cohort lists are created

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

© 2026 BG HUB Consulting LTD. All rights reserved.

## Support

For technical support or questions:

- Contact the development team
- Check the documentation
- Review demo accounts for testing

---

**Built with ❤️ for BG HUB Consulting LTD.**
