import React, { useState } from 'react';
import { translations, Language } from './utils/i18n';
import { RequirementsData, UploadedDocFile } from './types';
import { FileText, Upload, Globe, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [tenderData, setTenderData] = useState<RequirementsData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocFile[]>([]);
  const t = translations[lang];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-logo">
            <FileText className="brand-icon" />
          </div>
          <div>
            <h1 className="brand-title">{t.appTitle}</h1>
            <p className="brand-subtitle">{t.appSubtitle}</p>
          </div>
        </div>

        <div className="nav-controls">
          <div className="lang-switcher">
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              English
            </button>
            <button
              className={`lang-btn ${lang === 'bn' ? 'active' : ''}`}
              onClick={() => setLang('bn')}
            >
              বাংলা
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <div className="hero-banner">
          <div className="badge-pill">
            <CheckCircle2 size={14} />
            <span>AI DevFest 2026 • Solo Contest</span>
          </div>
          <h2>{lang === 'en' ? 'Project Structure Initialized' : 'প্রকল্পের প্রাথমিক কাঠামো তৈরি সম্পন্ন'}</h2>
          <p>
            {lang === 'en'
              ? 'Tender Document Package Builder core frontend environment and PDF processing pipeline configured.'
              : 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার ফ্রন্টএন্ড পরিবেশ ও পিডিএফ প্রসেসিং পাইপলাইন প্রস্তুত।'}
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>{t.footerCredits}</p>
      </footer>
    </div>
  );
}
