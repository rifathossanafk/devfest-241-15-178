# Tender Document Package Builder

**AI DevFest 2026 Solo Contest Submission**
- **Candidate:** 241-15-178
- **Name:** Rifat Hossan
- **Public Repository:** https://github.com/rifathossanafk/devfest-241-15-178
- **Live Demo:** [Vercel Deployment Link] (To be added after deployment)

## How to Run the App
1. Clone the repository: `git clone https://github.com/rifathossanafk/devfest-241-15-178.git`
2. Navigate to directory: `cd devfest-241-15-178`
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`
5. Open `http://localhost:3000`

## Main Features Completed
- Frontend-only, browser-based PDF processing (zero backend).
- Upload and parse `requirements.json`.
- Drag-and-drop multiple PDF uploads with strict validation (rejects non-PDFs).
- 1-to-1 strict matching matrix between required documents and uploaded files.
- Expiry date inputs for documents requiring validity check.
- Live Status engine (`Missing`, `Expiry date needed`, `Expired`, `Not provided`, `OK`).
- Exact duplicate detection (SHA-256) preventing identical files from matching multiple docs.
- Generation of the final `<tender_id>_Package.pdf` with Cover Page, Ordered Documents, and Page Footers.
- Bilingual interface (English / Bangla).

## Bonus Features Completed
- **Table of Contents (Index Page):** Generates an index on Page 2 with starting page numbers for each document.
- **Digital Stamp / Signature:** Upload a PNG seal/signature and place it on all pages, cover only, or documents only (Bottom-Right, Bottom-Left, Top-Right).
- **Export Checklist:** Download the complete validation audit as a CSV.
- **Smart Auto-Match:** Automatically pairs files based on keyword heuristics.
- **Handle Bad Files Safely:** Gracefully identifies corrupt/encrypted PDFs.
- **Save & Reopen Session:** Work is automatically saved to `localStorage`.
- **AI Compliance Advisor:** Sidebar integration for user-provided Gemini/OpenAI API keys to analyze compliance.

## Known Problems
- None.

## AI Tools Used
- Google Antigravity / Gemini

## Most Useful Prompt
```
"Initialize project structure for Tender Document Package Builder with React, TypeScript, pdf-lib, bilingual i18n support and responsive styling"
```