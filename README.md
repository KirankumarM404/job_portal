# Job Notification Tracker — SaaS Job Portal

A premium, single-page application (SPA) designed to track, filter, and manage job applications with intelligent match scoring and a daily digest system. Built with Vanilla JS, HTML5, and CSS3.

## 🚀 Key Features

### 1. Match Score Engine
- **Intelligent Scoring**: Calculates a 0–100 match score based on your preferences.
- **Scoring Rules**:
  - Title Match: +25
  - Location Match: +15
  - Work Mode Match: +10
  - Skills Overlap: +15
  - Experience Level: +10
  - Freshness (< 2 days): +5
  - Source (LinkedIn): +5
- **Visual Badges**: Color-coded scores (Green >80, Amber 60-79, Neutral 40-59, Grey <40).

### 2. Daily Digest System
- **Email-Style Simulation**: Generates a clean, email-ready list of top 10 matches.
- **Persistence**: Saves the daily digest to localStorage so it persists across refreshes.
- **Actions**: "Copy to Clipboard" and "Create Email Draft" for easy sharing.
- **Smart Sorting**: Prioritizes high match scores, then fresh posts.

### 3. Job Status Tracking
- **Lifecycle Management**: Track jobs as "Not Applied", "Applied", "Rejected", or "Selected".
- **Visual Feedback**: Color-coded status badges on job cards.
- **History**: "Recent Status Updates" section in the Daily Digest.
- **Persistence**: All status changes are saved locally.

### 4. Robust Filtering
- **AND Logic**: Filters combine (Location + Role + Status) for precise narrowing.
- **Match Threshold**: Toggle to hide jobs below your minimum score preference.
- **Sort Options**: Sort by Date, Match Score, or Salary.

### 5. Deployment Safety
- **Pre-Flight Checklist**: `#/test` route enforces 10 system checks before shipping.
- **Ship Lock**: `#/ship` route is inaccessible until all tests pass.
- **Proof of Work**: `#/proof` generates a final submission report with artifact links.

---

## 🛠️ Setup & Usage

### Prerequisites
- Node.js (v14+)
- npm

### Installation
1. Clone the repository.
   ```bash
   git clone https://github.com/YourUsername/job-portal.git
   cd job-portal
   ```

2. Install dependencies (http-server).
   ```bash
   npm install
   ```

3. Run the application.
   ```bash
   npx http-server . -p 8080 -c-1 --cors
   ```

4. Open in browser: `http://localhost:8080`

### Browser Support
- Chrome, Edge, Firefox, Safari (Modern versions)
- Responsive design works on Desktop, Tablet, and Mobile.

---

## 📂 Project Structure

```
├── index.html      # Main SPA shell + Routes
├── index.css       # Global styles (Variables, Components, Layout)
├── app.js          # Core logic (Router, Match Engine, UI Rendering)
├── data.js         # Mock job data (60 entries)
├── verify_check... # Verification scripts
└── README.md       # Documentation
```

## 🧪 Verification

To verify the system integrity:
1. Navigate to `http://localhost:8080#/test`.
2. Run through the manual checklist.
3. Confirm all 10 items pass to unlock the Ship route.

## 📝 License
MIT License. Free to use and modify.
