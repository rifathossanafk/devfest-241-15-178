import React, { useState, useEffect, useRef } from 'react';
import { translations, Language } from './utils/i18n';
import {
  TenderInfo,
  Requirement,
  RequirementsData,
  UploadedDocFile,
  RequirementMatch,
  StampConfig
} from './types';
import { calculateDocumentStatus } from './utils/statusCalculator';
import { autoMatchFiles } from './utils/autoMatcher';
import { exportChecklistToCSV } from './utils/csvExporter';
import {
  computeFileHash,
  inspectPDF,
  buildTenderPackage,
  PackageBuildResult
} from './utils/pdfProcessor';
import {
  FileText,
  Upload,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileCheck,
  Download,
  Trash2,
  Wand2,
  FileSpreadsheet,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Stamp,
  Calendar,
  Building,
  ShieldCheck,
  AlertOctagon,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [tenderData, setTenderData] = useState<RequirementsData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocFile[]>([]);
  const [matches, setMatches] = useState<Record<string, RequirementMatch>>({});
  
  // Non-PDF rejection alerts
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  
  // Bonus Task 1: Include Index Page
  const [includeIndexPage, setIncludeIndexPage] = useState<boolean>(true);
  
  // Bonus Task 2: Digital Stamp / Seal
  const [stampConfig, setStampConfig] = useState<StampConfig>({
    enabled: false,
    target: 'documents',
    position: 'bottom-right',
    opacity: 0.9,
    scale: 1.0
  });

  // Bonus Task: Optional AI Advisor Sidebar
  const [showAiAdvisor, setShowAiAdvisor] = useState<boolean>(false);
  const [aiApiKey, setAiApiKey] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<PackageBuildResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  // Autosave to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tender_pack_autosave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tenderData) setTenderData(parsed.tenderData);
        if (parsed.matches) setMatches(parsed.matches);
        if (parsed.lang) setLang(parsed.lang);
        if (typeof parsed.includeIndexPage === 'boolean') setIncludeIndexPage(parsed.includeIndexPage);
      } catch {
        // ignore invalid cache
      }
    }
  }, []);

  // Save session updates
  useEffect(() => {
    if (tenderData) {
      const stateToSave = {
        tenderData,
        matches,
        lang,
        includeIndexPage
      };
      localStorage.setItem('tender_pack_autosave', JSON.stringify(stateToSave));
    }
  }, [tenderData, matches, lang, includeIndexPage]);

  // Handle uploading requirements.json
  const handleLoadRequirementsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tender && Array.isArray(json.requirements)) {
          setTenderData(json);
          // initialize matches
          const initMatches: Record<string, RequirementMatch> = {};
          json.requirements.forEach((r: Requirement) => {
            initMatches[r.id] = { requirementId: r.id, fileId: undefined, expiryDate: '' };
          });
          setMatches(initMatches);
          setGeneratedResult(null);
        } else {
          alert('Invalid requirements.json structure.');
        }
      } catch (err: any) {
        alert('Failed to parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // 1-Click Load Sample Pack (Loads requirements.json + sample documents)
  const handleLoadSamplePack = async () => {
    try {
      // 1. Fetch requirements.json
      const reqRes = await fetch('/sample-pack/requirements.json');
      if (!reqRes.ok) throw new Error('Could not fetch /sample-pack/requirements.json');
      const reqJson: RequirementsData = await reqRes.json();
      setTenderData(reqJson);

      const sampleFileList = [
        '01_financial_proposal.pdf',
        '02_technical_proposal.pdf',
        '03_tin_certificate.pdf',
        '04_vat_certificate.pdf',
        'bank_solvency.pdf',
        'company_logo.png', // Non-PDF test!
        'experience_cert (1).pdf',
        'experience_cert.pdf',
        'scan_0042.pdf',
        'trade_license_2025.pdf',
        'trade_license_2026.pdf'
      ];

      const loadedDocs: UploadedDocFile[] = [];
      const rejectedList: string[] = [];

      for (const fName of sampleFileList) {
        if (!fName.toLowerCase().endsWith('.pdf')) {
          rejectedList.push(fName);
          // If it is company_logo.png, prepare it as default stamp option!
          if (fName === 'company_logo.png') {
            const logoRes = await fetch(`/sample-pack/documents/${fName}`);
            const logoBlob = await logoRes.blob();
            const logoBuffer = await logoBlob.arrayBuffer();
            const dataUrl = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onloadend = () => resolve(r.result as string);
              r.readAsDataURL(logoBlob);
            });
            setStampConfig(prev => ({
              ...prev,
              imageDataUrl: dataUrl,
              imageBytes: new Uint8Array(logoBuffer),
              imageName: fName
            }));
          }
          continue;
        }

        const res = await fetch(`/sample-pack/documents/${fName}`);
        if (!res.ok) continue;
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const fileObj = new File([blob], fName, { type: 'application/pdf' });
        
        const hash = await computeFileHash(arrayBuffer);
        const { pageCount, data, isCorrupt, errorMessage } = await inspectPDF(fileObj);

        // Check for duplicates
        const existingWithHash = loadedDocs.find(d => d.hash === hash);
        const isDuplicate = Boolean(existingWithHash);

        const newDoc: UploadedDocFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file: fileObj,
          name: fName,
          size: blob.size,
          pageCount,
          hash,
          isDuplicate,
          duplicateOfId: existingWithHash?.id,
          duplicateOfName: existingWithHash?.name,
          data,
          isCorrupt,
          errorMessage
        };

        if (existingWithHash) {
          existingWithHash.isDuplicate = true;
          existingWithHash.duplicateOfId = newDoc.id;
          existingWithHash.duplicateOfName = newDoc.name;
        }

        loadedDocs.push(newDoc);
      }

      setUploadedFiles(loadedDocs);
      setRejectedFiles(rejectedList);

      // Initialize empty matches
      const initialMatches: Record<string, RequirementMatch> = {};
      reqJson.requirements.forEach(r => {
        initialMatches[r.id] = { requirementId: r.id, fileId: undefined, expiryDate: '' };
      });
      setMatches(initialMatches);
      setGeneratedResult(null);
    } catch (err: any) {
      alert('Error loading sample pack: ' + err.message);
    }
  };

  // Upload PDFs handler (Task 4.2 & 4.6)
  const handleUploadPDFs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: UploadedDocFile[] = [...uploadedFiles];
    const newRejected: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Rule 4.2: If file is not a PDF, reject it and show clear message
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        newRejected.push(file.name);
        // If image file, give option to use as stamp
        if (file.type.startsWith('image/')) {
          const buffer = await file.arrayBuffer();
          const dataUrl = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(file);
          });
          setStampConfig(prev => ({
            ...prev,
            imageDataUrl: dataUrl,
            imageBytes: new Uint8Array(buffer),
            imageName: file.name
          }));
        }
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const hash = await computeFileHash(arrayBuffer);
      const { pageCount, data, isCorrupt, errorMessage } = await inspectPDF(file);

      // Check duplicate
      const existingMatch = newDocs.find(d => d.hash === hash);
      const isDuplicate = Boolean(existingMatch);

      const docItem: UploadedDocFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
        file,
        name: file.name,
        size: file.size,
        pageCount,
        hash,
        isDuplicate,
        duplicateOfId: existingMatch?.id,
        duplicateOfName: existingMatch?.name,
        data,
        isCorrupt,
        errorMessage
      };

      if (existingMatch) {
        existingMatch.isDuplicate = true;
        existingMatch.duplicateOfId = docItem.id;
        existingMatch.duplicateOfName = docItem.name;
      }

      newDocs.push(docItem);
    }

    setUploadedFiles(newDocs);
    if (newRejected.length > 0) {
      setRejectedFiles(prev => Array.from(new Set([...prev, ...newRejected])));
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove uploaded file
  const handleRemoveFile = (fileId: string) => {
    // 1. Remove from matches
    setMatches(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        if (updated[k].fileId === fileId) {
          updated[k] = { ...updated[k], fileId: undefined };
        }
      });
      return updated;
    });

    // 2. Remove file
    setUploadedFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      // Re-evaluate duplicates
      const hashCounts: Record<string, string[]> = {};
      filtered.forEach(f => {
        if (!hashCounts[f.hash]) hashCounts[f.hash] = [];
        hashCounts[f.hash].push(f.id);
      });

      return filtered.map(f => {
        const matchesWithHash = hashCounts[f.hash];
        if (matchesWithHash && matchesWithHash.length > 1) {
          const otherId = matchesWithHash.find(id => id !== f.id);
          const otherDoc = filtered.find(d => d.id === otherId);
          return {
            ...f,
            isDuplicate: true,
            duplicateOfId: otherId,
            duplicateOfName: otherDoc?.name
          };
        } else {
          return {
            ...f,
            isDuplicate: false,
            duplicateOfId: undefined,
            duplicateOfName: undefined
          };
        }
      });
    });
  };

  // Match file to requirement (Task 4.3)
  const handleAssignFile = (reqId: string, fileId: string) => {
    if (!fileId) {
      // Unmatch
      setMatches(prev => ({
        ...prev,
        [reqId]: { ...prev[reqId], fileId: undefined }
      }));
      return;
    }

    const selectedFile = uploadedFiles.find(f => f.id === fileId);
    if (!selectedFile) return;

    // Rule 4.6: If file is a duplicate of another file, and that other file is already matched to another requirement,
    // do not allow them to be matched to different documents!
    if (selectedFile.isDuplicate && selectedFile.duplicateOfId) {
      const duplicateAssignedReqId = Object.keys(matches).find(
        k => k !== reqId && matches[k].fileId === selectedFile.duplicateOfId
      );
      if (duplicateAssignedReqId) {
        alert(
          lang === 'en'
            ? `Cannot assign "${selectedFile.name}"! It has identical content to "${selectedFile.duplicateOfName}", which is already assigned. Per contest rules, duplicates cannot be matched to different documents.`
            : `"${selectedFile.name}" ফাইলটি যুক্ত করা যাবে না! কারণ এটি "${selectedFile.duplicateOfName}" ফাইলের হুবহু ডুপ্লিকেট, যা ইতিমধ্যে অন্য ডকুমেন্টে ব্যবহৃত হয়েছে।`
        );
        return;
      }
    }

    setMatches(prev => {
      const updated = { ...prev };
      // 1-to-1 match: if file was assigned to another requirement, remove it from that one
      Object.keys(updated).forEach(k => {
        if (k !== reqId && updated[k].fileId === fileId) {
          updated[k] = { ...updated[k], fileId: undefined };
        }
      });

      updated[reqId] = {
        ...updated[reqId],
        requirementId: reqId,
        fileId
      };
      return updated;
    });
  };

  // Expiry date handler (Task 4.4)
  const handleExpiryDateChange = (reqId: string, date: string) => {
    setMatches(prev => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        requirementId: reqId,
        expiryDate: date
      }
    }));
  };

  // Auto-Match Trigger (Bonus Task)
  const handleTriggerAutoMatch = () => {
    if (!tenderData) return;
    const autoMatched = autoMatchFiles(tenderData.requirements, uploadedFiles, matches);
    setMatches(autoMatched);
  };

  // Calculate overall validation audit
  const calculateAudit = () => {
    if (!tenderData) return { blockingCount: 0, blockingIssues: [], allOk: false };

    const blockingIssues: { req: Requirement; message_en: string; message_bn: string }[] = [];
    const sortedReqs = [...tenderData.requirements].sort((a, b) => a.order - b.order);

    for (const req of sortedReqs) {
      const match = matches[req.id];
      const statusObj = calculateDocumentStatus(req, match, tenderData.tender.submission_deadline);
      if (statusObj.blocking) {
        blockingIssues.push({
          req,
          message_en: statusObj.message_en,
          message_bn: statusObj.message_bn
        });
      }
    }

    return {
      blockingCount: blockingIssues.length,
      blockingIssues,
      allOk: blockingIssues.length === 0
    };
  };

  const audit = calculateAudit();

  // Generate Tender Package PDF (Task 4.7 & Section 6)
  const handleGeneratePackage = async () => {
    if (!tenderData || !audit.allOk) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await buildTenderPackage(tenderData, uploadedFiles, matches, {
        includeIndexPage,
        stampConfig
      });
      setGeneratedResult(result);
    } catch (err: any) {
      setGenerationError(err.message || 'Error generating PDF package');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Generated PDF (Task 4.8)
  const handleDownloadPackage = () => {
    if (!generatedResult) return;
    const blob = new Blob([generatedResult.pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generatedResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Digital Stamp Upload
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = await file.arrayBuffer();
      setStampConfig(prev => ({
        ...prev,
        enabled: true,
        imageDataUrl: event.target?.result as string,
        imageBytes: new Uint8Array(buffer),
        imageName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  // Optional AI Compliance Advisor
  const handleRunAiAnalysis = async () => {
    if (!aiApiKey.trim()) {
      alert(lang === 'en' ? 'Please enter your API key.' : 'অনুগ্রহ করে এপিআই কী দিন।');
      return;
    }

    setAiLoading(true);
    try {
      // Call Gemini API client-side with user-provided key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an executive tender compliance consultant. Analyze this tender submission status:
Tender ID: ${tenderData?.tender.tender_id}
Title: ${tenderData?.tender.title}
Submission Deadline: ${tenderData?.tender.submission_deadline}
Blocking Issues Remaining: ${audit.blockingCount}
Requirements Checklist Status:
${tenderData?.requirements
  .map(r => {
    const m = matches[r.id];
    const s = calculateDocumentStatus(r, m, tenderData.tender.submission_deadline);
    return `- ${r.title_en} (Mandatory: ${r.mandatory}): Status = ${s.status}, Expiry = ${m?.expiryDate || 'N/A'}`;
  })
  .join('\n')}

Provide a concise 3-bullet executive briefing on tender compliance readiness, potential risks, and recommendations.`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        setAiAnalysis(data.candidates[0].content.parts[0].text);
      } else {
        throw new Error(data.error?.message || 'Failed to get AI response');
      }
    } catch (err: any) {
      setAiAnalysis(`AI Analysis failed: ${err.message}. Please check your API key.`);
    } finally {
      setAiLoading(false);
    }
  };

  // Helper format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      {/* 1. Header & Navigation */}
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

        <div className="nav-actions">
          {/* Quick Sample Pack Loader */}
          <button
            id="btn-load-sample"
            className="action-btn secondary"
            onClick={handleLoadSamplePack}
            title="Load sample-pack/requirements.json and documents"
          >
            <Sparkles size={16} />
            <span>{t.useSamplePack}</span>
          </button>

          {/* Export CSV */}
          {tenderData && (
            <button
              id="btn-export-csv"
              className="action-btn secondary"
              onClick={() => exportChecklistToCSV(tenderData, uploadedFiles, matches, lang)}
              title="Download audit checklist in CSV"
            >
              <FileSpreadsheet size={16} />
              <span>{t.exportChecklistCsv}</span>
            </button>
          )}

          {/* AI Advisor Toggle */}
          <button
            className={`action-btn ${showAiAdvisor ? 'active' : 'secondary'}`}
            onClick={() => setShowAiAdvisor(!showAiAdvisor)}
            title="Open optional AI compliance advisor"
          >
            <ShieldCheck size={16} />
            <span>AI Help</span>
          </button>

          {/* Language Switcher */}
          <div className="lang-switcher">
            <button
              id="btn-lang-en"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              id="btn-lang-bn"
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
        {/* Rejected Non-PDF Files Alert (Task 4.2) */}
        {rejectedFiles.length > 0 && (
          <div className="alert-banner warning">
            <AlertTriangle className="alert-icon" />
            <div className="alert-content">
              <strong>{t.rejectedFiles}</strong>
              <p>
                {t.nonPdfWarning} <em>[{rejectedFiles.join(', ')}]</em>
              </p>
              {stampConfig.imageDataUrl && (
                <div className="alert-action">
                  <span>Image detected! Use as Digital Seal/Signature?</span>
                  <button
                    className="btn-tiny"
                    onClick={() => setStampConfig(prev => ({ ...prev, enabled: true }))}
                  >
                    Enable Seal
                  </button>
                </div>
              )}
            </div>
            <button
              className="alert-close"
              onClick={() => setRejectedFiles([])}
            >
              ×
            </button>
          </div>
        )}

        {/* 2. Tender Overview & Spec Uploader (Task 4.1) */}
        {!tenderData ? (
          <div className="hero-upload-card">
            <div className="hero-icon-ring">
              <Layers size={36} />
            </div>
            <h2>{t.uploadTenderSpec}</h2>
            <p>{t.uploadTenderSpecSub}</p>
            <div className="hero-btn-row">
              <label className="btn-primary file-select-label">
                <Upload size={18} />
                <span>Browse requirements.json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleLoadRequirementsFile}
                  ref={jsonInputRef}
                  style={{ display: 'none' }}
                />
              </label>
              <button className="btn-secondary" onClick={handleLoadSamplePack}>
                <Sparkles size={18} />
                <span>{t.useSamplePack}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="tender-meta-card">
            <div className="meta-card-header">
              <div className="meta-badge-tag">
                <Building size={14} />
                <span>{tenderData.tender.tender_id}</span>
              </div>
              <div className="meta-header-actions">
                <label className="btn-icon-subtle" title="Load different requirements.json">
                  <Upload size={14} />
                  <span>Change Spec</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleLoadRequirementsFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-label">{t.tenderTitle}</span>
                <strong className="meta-value">{tenderData.tender.title}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">{t.procuringEntity}</span>
                <strong className="meta-value">{tenderData.tender.procuring_entity}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">{t.bidder}</span>
                <strong className="meta-value">{tenderData.tender.bidder}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">{t.submissionDeadline}</span>
                <strong className="meta-value deadline-pill">
                  <Calendar size={14} />
                  {tenderData.tender.submission_deadline}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Workflow (when requirements loaded) */}
        {tenderData && (
          <div className="workflow-grid">
            {/* Left Column: Requirements & Matching Matrix */}
            <div className="matrix-column">
              <div className="section-header">
                <div className="section-title-wrap">
                  <FileCheck className="section-icon" />
                  <div>
                    <h3 className="section-title">{t.documentChecklist}</h3>
                    <p className="section-subtitle">
                      {tenderData.requirements.length} {lang === 'en' ? 'requirements total' : 'টি মোট আবশ্যকীয় নথি'}
                    </p>
                  </div>
                </div>

                <div className="section-actions">
                  <button
                    id="btn-auto-match"
                    className="action-btn auto-match"
                    onClick={handleTriggerAutoMatch}
                    title={t.autoMatchTooltip}
                  >
                    <Wand2 size={16} />
                    <span>{t.autoMatchBtn}</span>
                  </button>
                </div>
              </div>

              {/* Requirements Table */}
              <div className="matrix-table-card">
                <div className="table-responsive">
                  <table className="checklist-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px' }}>{t.docOrder}</th>
                        <th>{t.docTitle}</th>
                        <th style={{ minWidth: '190px' }}>{t.matchedFile}</th>
                        <th style={{ width: '150px' }}>{t.expiryDate}</th>
                        <th style={{ width: '130px' }}>{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenderData.requirements
                        .sort((a, b) => a.order - b.order)
                        .map(req => {
                          const match = matches[req.id];
                          const matchedFile = match?.fileId
                            ? uploadedFiles.find(f => f.id === match.fileId)
                            : undefined;
                          const statusObj = calculateDocumentStatus(
                            req,
                            match,
                            tenderData.tender.submission_deadline
                          );

                          return (
                            <tr key={req.id} className={`req-row status-${statusObj.status.toLowerCase()}`}>
                              {/* Order Badge */}
                              <td className="col-order">
                                <span className="order-circle">{req.order}</span>
                              </td>

                              {/* Title & Mandatory Badge */}
                              <td className="col-title">
                                <div className="title-wrapper">
                                  <span className="doc-name">
                                    {lang === 'bn' ? req.title_bn : req.title_en}
                                  </span>
                                  <div className="badge-row">
                                    <span
                                      className={`type-badge ${
                                        req.mandatory ? 'mandatory' : 'optional'
                                      }`}
                                    >
                                      {req.mandatory ? t.mandatory : t.optional}
                                    </span>
                                    {req.has_expiry && (
                                      <span className="expiry-badge" title="Validity check required">
                                        Exp Check
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* File Match Dropdown */}
                              <td className="col-match">
                                <div className="match-selector-wrap">
                                  <select
                                    className={`file-select ${matchedFile ? 'has-file' : ''}`}
                                    value={match?.fileId || ''}
                                    onChange={e => handleAssignFile(req.id, e.target.value)}
                                  >
                                    <option value="">{t.selectFilePlaceholder}</option>
                                    {uploadedFiles.map(file => {
                                      // Check if this file is assigned to a DIFFERENT requirement
                                      const assignedOtherKey = Object.keys(matches).find(
                                        k => k !== req.id && matches[k].fileId === file.id
                                      );
                                      const isDuplicateTaken =
                                        file.isDuplicate &&
                                        file.duplicateOfId &&
                                        Object.keys(matches).some(
                                          k => k !== req.id && matches[k].fileId === file.duplicateOfId
                                        );

                                      return (
                                        <option
                                          key={file.id}
                                          value={file.id}
                                          disabled={file.isCorrupt}
                                        >
                                          {file.name} ({file.pageCount}p)
                                          {assignedOtherKey ? ' [In use]' : ''}
                                          {file.isDuplicate ? ' [Duplicate]' : ''}
                                          {file.isCorrupt ? ' [Corrupt]' : ''}
                                        </option>
                                      );
                                    })}
                                  </select>

                                  {matchedFile && (
                                    <button
                                      className="btn-unmatch"
                                      onClick={() => handleAssignFile(req.id, '')}
                                      title={t.unmatch}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>

                                {matchedFile && (
                                  <span className="file-info-sub">
                                    {matchedFile.pageCount} {t.pages} • {formatBytes(matchedFile.size)}
                                  </span>
                                )}
                              </td>

                              {/* Expiry Date */}
                              <td className="col-expiry">
                                {req.has_expiry ? (
                                  <div className="expiry-input-wrap">
                                    <input
                                      type="date"
                                      className={`date-input ${
                                        statusObj.status === 'EXPIRY_NEEDED' || statusObj.status === 'EXPIRED'
                                          ? 'input-error'
                                          : ''
                                      }`}
                                      value={match?.expiryDate || ''}
                                      onChange={e => handleExpiryDateChange(req.id, e.target.value)}
                                      placeholder="YYYY-MM-DD"
                                    />
                                  </div>
                                ) : (
                                  <span className="na-text">—</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="col-status">
                                <div className="status-cell">
                                  <span
                                    className={`status-pill pill-${statusObj.status.toLowerCase()}`}
                                    title={lang === 'bn' ? statusObj.message_bn : statusObj.message_en}
                                  >
                                    {statusObj.status === 'OK' && <CheckCircle2 size={12} />}
                                    {statusObj.status === 'MISSING' && <XCircle size={12} />}
                                    {statusObj.status === 'EXPIRY_NEEDED' && <AlertTriangle size={12} />}
                                    {statusObj.status === 'EXPIRED' && <AlertOctagon size={12} />}
                                    {statusObj.status === 'NOT_PROVIDED' && <HelpCircle size={12} />}
                                    <span>
                                      {statusObj.status === 'OK' && t.statusOk}
                                      {statusObj.status === 'MISSING' && t.statusMissing}
                                      {statusObj.status === 'EXPIRY_NEEDED' && t.statusExpiryNeeded}
                                      {statusObj.status === 'EXPIRED' && t.statusExpired}
                                      {statusObj.status === 'NOT_PROVIDED' && t.statusNotProvided}
                                    </span>
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Uploaded Files & Package Generation Drawer */}
            <div className="sidebar-column">
              {/* Upload Zone Card */}
              <div className="card-panel">
                <div className="panel-title-row">
                  <div className="panel-title-wrap">
                    <Upload size={18} className="panel-icon" />
                    <h4>{t.uploadFiles}</h4>
                  </div>
                  <span className="file-count-badge">
                    {uploadedFiles.length} / 30
                  </span>
                </div>

                <div
                  className="dropzone-box"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} className="dropzone-icon" />
                  <p className="dropzone-title">{t.uploadFilesSub}</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    ref={fileInputRef}
                    onChange={handleUploadPDFs}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* List of uploaded files with duplicate indicators */}
                {uploadedFiles.length > 0 && (
                  <div className="file-items-scroll">
                    {uploadedFiles.map(file => (
                      <div
                        key={file.id}
                        className={`uploaded-file-item ${
                          file.isDuplicate ? 'file-duplicate' : ''
                        } ${file.isCorrupt ? 'file-corrupt' : ''}`}
                      >
                        <div className="file-item-left">
                          <FileText size={16} className="file-icon" />
                          <div className="file-text-col">
                            <span className="file-name" title={file.name}>
                              {file.name}
                            </span>
                            <div className="file-meta-row">
                              <span>{file.pageCount} {t.pages}</span>
                              <span>•</span>
                              <span>{formatBytes(file.size)}</span>
                              {file.isDuplicate && (
                                <span className="badge-duplicate" title={t.duplicateWarning}>
                                  {t.duplicateBadge}
                                </span>
                              )}
                              {file.isCorrupt && (
                                <span className="badge-corrupt">
                                  Corrupt / Encrypted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn-remove-file"
                          onClick={() => handleRemoveFile(file.id)}
                          title={t.removeFile}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bonus Task 1 & 2: Package Options & Digital Stamp */}
              <div className="card-panel options-panel">
                <h4 className="options-title">
                  <Layers size={16} />
                  <span>Package Customization</span>
                </h4>

                {/* Index page toggle */}
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={includeIndexPage}
                    onChange={e => setIncludeIndexPage(e.target.checked)}
                  />
                  <div>
                    <span className="toggle-text">{t.includeIndexPage}</span>
                    <span className="toggle-sub">{t.includeIndexPageSub}</span>
                  </div>
                </label>

                {/* Digital Stamp / Signature */}
                <div className="stamp-config-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={stampConfig.enabled}
                      onChange={e => setStampConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <div>
                      <span className="toggle-text">{t.stampSignature}</span>
                      <span className="toggle-sub">Place PNG official seal / signature</span>
                    </div>
                  </label>

                  {stampConfig.enabled && (
                    <div className="stamp-details">
                      <div className="stamp-upload-row">
                        <label className="btn-tiny">
                          <Stamp size={12} />
                          <span>{stampConfig.imageName ? 'Change Stamp' : 'Select PNG'}</span>
                          <input
                            type="file"
                            accept="image/png"
                            ref={stampInputRef}
                            onChange={handleStampUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {stampConfig.imageName && (
                          <span className="stamp-name-tag">{stampConfig.imageName}</span>
                        )}
                      </div>

                      <div className="stamp-selectors">
                        <select
                          value={stampConfig.position}
                          onChange={e => setStampConfig(prev => ({ ...prev, position: e.target.value as any }))}
                          className="subtle-select"
                        >
                          <option value="bottom-right">{t.stampPosBottomRight}</option>
                          <option value="bottom-left">{t.stampPosBottomLeft}</option>
                          <option value="top-right">{t.stampPosTopRight}</option>
                        </select>

                        <select
                          value={stampConfig.target}
                          onChange={e => setStampConfig(prev => ({ ...prev, target: e.target.value as any }))}
                          className="subtle-select"
                        >
                          <option value="documents">{t.stampTargetDocuments}</option>
                          <option value="all">{t.stampTargetAll}</option>
                          <option value="cover">{t.stampTargetCover}</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Validation Summary & Package Generator (Task 4.7 & 4.8) */}
              <div className="card-panel package-gen-card">
                <div className="gen-header">
                  <h4>{t.packageBuilder}</h4>
                  <span className={`audit-badge ${audit.allOk ? 'badge-ok' : 'badge-blocked'}`}>
                    {audit.allOk ? 'Ready' : 'Blocked'}
                  </span>
                </div>

                {/* Audit issues list */}
                {!audit.allOk ? (
                  <div className="audit-issues-box">
                    <div className="audit-header">
                      <AlertTriangle size={16} />
                      <span>
                        {audit.blockingCount} {t.blockingIssuesCount}
                      </span>
                    </div>
                    <ul className="audit-list">
                      {audit.blockingIssues.map((issue, idx) => (
                        <li key={idx} className="audit-item">
                          <strong>{lang === 'bn' ? issue.req.title_bn : issue.req.title_en}:</strong>{' '}
                          {lang === 'bn' ? issue.message_bn : issue.message_en}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="audit-success-box">
                    <CheckCircle2 size={18} />
                    <span>{t.readyToGenerate}</span>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  id="btn-generate-package"
                  className={`btn-generate ${audit.allOk ? 'btn-ready' : 'btn-disabled'}`}
                  disabled={!audit.allOk || isGenerating}
                  onClick={handleGeneratePackage}
                >
                  {isGenerating ? (
                    <span>{t.generating}</span>
                  ) : (
                    <>
                      <FileCheck size={18} />
                      <span>{t.generatePackageBtn}</span>
                    </>
                  )}
                </button>

                {/* Error Banner if any */}
                {generationError && (
                  <div className="alert-banner error" style={{ marginTop: '0.8rem' }}>
                    <XCircle size={16} />
                    <span>{generationError}</span>
                  </div>
                )}

                {/* Download Card when ready */}
                {generatedResult && (
                  <div className="download-ready-box">
                    <div className="download-info">
                      <FileCheck size={24} className="download-icon" />
                      <div>
                        <strong>{generatedResult.fileName}</strong>
                        <p>{generatedResult.totalPages} {t.pages} compiled & footer numbered</p>
                      </div>
                    </div>
                    <button
                      id="btn-download-package"
                      className="btn-download-glow"
                      onClick={handleDownloadPackage}
                    >
                      <Download size={18} />
                      <span>{t.downloadPackageBtn}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optional AI Advisor Drawer */}
        {showAiAdvisor && (
          <div className="ai-advisor-drawer">
            <div className="ai-header">
              <div className="ai-title">
                <Sparkles size={18} />
                <h4>{t.aiAssistant}</h4>
              </div>
              <button className="btn-close" onClick={() => setShowAiAdvisor(false)}>×</button>
            </div>
            <p className="ai-disclaimer">{t.aiDisclaimer}</p>

            <div className="ai-key-box">
              <input
                type="password"
                placeholder={t.aiKeyPlaceholder}
                value={aiApiKey}
                onChange={e => setAiApiKey(e.target.value)}
                className="ai-input"
              />
              <button
                className="btn-ai-run"
                onClick={handleRunAiAnalysis}
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyzing...' : t.aiAnalyzeBtn}
              </button>
            </div>

            {aiAnalysis && (
              <div className="ai-result-box">
                <pre>{aiAnalysis}</pre>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>{t.footerCredits}</p>
      </footer>
    </div>
  );
}
