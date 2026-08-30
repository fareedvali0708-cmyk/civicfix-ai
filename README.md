# CivicFix

## AI-Powered Civic Issue Resolution Platform

CivicFix is an AI-powered civic issue reporting and resolution platform that helps citizens report local problems and helps municipal authorities manage, prioritize, and resolve those issues efficiently.

## What CivicFix Does

### Citizen Portal
- Report civic issues such as roads, garbage, drainage, streetlights, and other public problems.
- Upload photographic evidence.
- Capture GPS/location information.
- Track submitted complaints and their status.
- View issue details and resolution progress.

### AI-Powered Processing
- Uses AI/Gemini Vision to analyze submitted evidence.
- Automatically classifies civic issues.
- Determines severity and priority.
- Helps identify the responsible government department.
- Supports automated issue routing and processing.

### Government Command Center
- Dedicated government/officer portal.
- View incoming civic complaints.
- Monitor issue queues and priorities.
- Track SLA status.
- Review issue evidence and AI analysis.
- Monitor escalations and resolution status.

## Technology Stack

- React
- Vite
- JavaScript
- Node.js
- Express
- Supabase
- Supabase Authentication
- Supabase Storage
- Gemini Vision AI
- Axios
- Vercel
- Render

## Project Architecture

```text
Citizen
   ↓
CivicFix Web App
   ↓
Issue Submission + Photo + GPS
   ↓
AI / Gemini Processing
   ↓
Classification + Severity + Priority + Department
   ↓
Government Command Center
   ↓
Assignment → Resolution → Tracking
