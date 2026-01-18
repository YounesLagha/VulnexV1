# Vulnex

A modern web security scanning platform that analyzes HTTP security headers, SSL/TLS configurations, and provides actionable security insights.

## Features

- **HTTP Security Headers Analysis** - Comprehensive scan of security headers with severity-based recommendations
- **SSL/TLS Certificate Validation** - Detailed analysis of certificate chain, expiration, and configuration
- **Security Score Calculation** - Normalized scoring system (0-100) based on industry standards
- **Intelligent Analysis** - Automated security insights with factual, actionable recommendations
- **Scan History Dashboard** - Track security improvements over time with detailed historical data
- **Free & Premium Modes** - Basic scans available without authentication, full analysis for registered users

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Server Components

**Backend:**
- Node.js
- Express
- TypeScript
- Groq API (LLM analysis)

**Database:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)

**Security Scanning:**
- Custom HTTP headers analyzer
- SSL/TLS certificate inspection
- OWASP-aligned severity classification

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Groq API key (free tier available at https://console.groq.com)



### Backend Configuration

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `backend/.env` and fill in your actual credentials:
   - `SUPABASE_URL` - Get from [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API
   - `SUPABASE_ANON_KEY` - Same location (public anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` - Same location ⚠️ **KEEP SECRET - Full database access**
   - `GROQ_API_KEY` - Get free key from [Groq Console](https://console.groq.com/keys)

### Frontend Configuration

1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Edit `frontend/.env.local` and fill in the same Supabase credentials from backend:
   - `NEXT_PUBLIC_SUPABASE_URL` - Same as backend
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as backend (safe for public use)
   - `NEXT_PUBLIC_API_URL` - Backend URL (default: `http://localhost:4000`)

### Production Deployment

**Never use development credentials in production.** Create separate Supabase projects and Groq API keys for production.

See [SECURITY.md](SECURITY.md) for detailed security guidelines and deployment best practices.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/vulnex.git
cd vulnex
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

Create `.env` files in both `backend/` and `frontend/` directories using the templates above.

### 4. Set up Supabase database

Run the SQL migrations in `backend/supabase/` to create:
- `scans` table with RLS policies
- `user_scan_stats` view
- Authentication tables

### 5. Start development servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

### Free Scan (No Authentication)

1. Navigate to homepage
2. Enter target URL
3. Click "Scan Now"
4. View basic security analysis

### Full Scan (Authenticated)

1. Sign up / Sign in
2. Enter target URL
3. Access complete analysis including:
   - Detailed SSL/TLS report
   - Comprehensive header breakdown
   - Full security recommendations
   - Scan history tracking

## Security Headers Analyzed

| Header | Severity | Purpose |
|--------|----------|---------|
| Content-Security-Policy | Critical | Prevents XSS attacks |
| X-Frame-Options | Critical | Prevents clickjacking |
| Strict-Transport-Security | Important | Enforces HTTPS |
| X-Content-Type-Options | Important | Prevents MIME sniffing |
| Referrer-Policy | Recommended | Controls referrer information |
| Permissions-Policy | Recommended | Controls browser features |
| Cross-Origin-* | Recommended | Isolation policies |

## Project Status

> **⚠️ WORK IN PROGRESS** - This project is currently under active development

**Current Version:** Beta (v0.9)
**Completion:** ~85%

### Completed
- ✅ HTTP Headers scanning (V2 methodology)
- ✅ SSL/TLS certificate analysis
- ✅ User authentication system
- ✅ Scan history dashboard
- ✅ AI-powered analysis with Groq
- ✅ Professional analysis reporting
- ✅ Responsive UI design

### Planned
- 🔄 Port scanning module
- 🔄 DNS security checks
- 🔄 WHOIS information
- 🔄 Vulnerability database integration
- 🔄 Scheduled scans
- 🔄 Email notifications
- 🔄 PDF report generation

## Architecture

```
vulnex/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/          # LLM analysis
│   │   │   ├── auth/        # Authentication
│   │   │   ├── scans/       # Scan orchestration
│   │   │   ├── headers/     # HTTP headers analysis
│   │   │   └── ssl/         # SSL/TLS scanning
│   │   ├── services/        # Core services
│   │   └── config/          # Configuration
│   └── supabase/            # Database migrations
└── frontend/
    ├── src/
    │   ├── app/             # Next.js pages
    │   ├── components/      # React components
    │   └── lib/             # Utilities
    └── public/              # Static assets
```

## Contributing

This project is currently in active development. Contributions are welcome once v1.0 is released.

## License

MIT License - see LICENSE file for details

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with security best practices in mind.**
