export type Language = 'en' | 'bn';

export const translations = {
  en: {
    appTitle: 'Tender Document Package Builder',
    appSubtitle: 'Automated validation, ordering & compliance packager for institutional tenders',
    badgeSoloContest: 'AI DevFest 2026',
    tenderDetails: 'Tender Overview',
    tenderId: 'Tender ID',
    tenderTitle: 'Tender Title',
    procuringEntity: 'Procuring Entity',
    bidder: 'Bidder Name',
    submissionDeadline: 'Submission Deadline',
    uploadTenderSpec: 'Load Requirements (JSON)',
    uploadTenderSpecSub: 'Select or drop requirements.json',
    useSamplePack: 'Load Sample Pack Data',
    resetAll: 'Reset All',
    saveSession: 'Export Session',
    loadSession: 'Import Session',
    
    // Upload zone
    uploadFiles: 'Upload Documents (PDF)',
    uploadFilesSub: 'Drag & drop multiple PDFs or browse files (Max 30 files, 50MB)',
    rejectedFiles: 'Rejected Non-PDF Files',
    nonPdfWarning: 'Only PDF files are permitted for tender documents. Non-PDF files have been rejected.',
    
    // File list
    uploadedFilesList: 'Uploaded PDF Files',
    pages: 'pages',
    page: 'page',
    size: 'Size',
    duplicateBadge: 'Duplicate File',
    duplicateWarning: 'Identical file content detected! Cannot be matched to different documents.',
    removeFile: 'Remove file',
    
    // Matrix / Requirements
    documentChecklist: 'Document Requirements & Matching',
    docOrder: '#',
    docTitle: 'Required Document',
    docType: 'Type',
    mandatory: 'Mandatory',
    optional: 'Optional',
    matchedFile: 'Assigned File',
    expiryDate: 'Expiry Date',
    status: 'Status',
    actions: 'Actions',
    selectFilePlaceholder: '-- Select uploaded file --',
    unmatch: 'Unassign',
    autoMatchBtn: 'Smart Auto-Match',
    autoMatchTooltip: 'Automatically match files based on filenames',
    exportChecklistCsv: 'Export Checklist (CSV)',
    
    // Statuses
    statusMissing: 'Missing',
    statusExpiryNeeded: 'Expiry Date Needed',
    statusExpired: 'Expired',
    statusNotProvided: 'Not Provided',
    statusOk: 'OK',
    
    // Reasons
    reasonMissing: 'Mandatory document with no file attached.',
    reasonExpiryNeeded: 'Document requires validity check but expiry date is not entered.',
    reasonExpired: 'Expiry date is before the tender submission deadline.',
    reasonNotProvided: 'Optional document not provided (will be omitted from package).',
    reasonOk: 'Document verified and compliant.',
    
    // Package generation
    packageBuilder: 'Package Generation',
    generatePackageBtn: 'Generate Tender Package PDF',
    generating: 'Compiling & Generating PDF...',
    downloadPackageBtn: 'Download PDF Package',
    validationSummary: 'Validation Audit',
    readyToGenerate: 'All mandatory documents verified. Ready to create package.',
    blockingIssuesCount: 'blocking issue(s) detected. Fix them before generating.',
    
    // Options
    includeIndexPage: 'Include Table of Contents (Index Page)',
    includeIndexPageSub: 'Adds a structured index on Page 2 showing start page of each document',
    stampSignature: 'Digital Stamp / Signature',
    stampUpload: 'Upload PNG Stamp/Seal',
    stampPosition: 'Stamp Placement',
    stampPosBottomRight: 'Bottom Right',
    stampPosBottomLeft: 'Bottom Left',
    stampPosTopRight: 'Top Right',
    stampTarget: 'Apply Stamp To',
    stampTargetAll: 'All Pages',
    stampTargetDocuments: 'Document Pages Only',
    stampTargetCover: 'Cover Page Only',
    
    // AI sidebar
    aiAssistant: 'AI Compliance Advisor (Optional)',
    aiKeyPlaceholder: 'Enter your AI API key (Gemini / OpenAI)',
    aiDisclaimer: 'Your key stays in browser memory only. The core app works 100% offline without AI.',
    aiAnalyzeBtn: 'Analyze Tender Readiness',
    
    // Footer & info
    footerCredits: 'AI DevFest 2026 Solo Contest | Candidate: 241-15-178 | Frontend-Only Architecture'
  },
  bn: {
    appTitle: 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার',
    appSubtitle: 'টেন্ডারের জন্য স্বয়ংক্রিয় যাচাইকরণ, ক্রমানুযায়ী সাজানো এবং প্যাকেজ তৈরির ব্যবস্থা',
    badgeSoloContest: 'এআই ডেভফেস্ট ২০২৬',
    tenderDetails: 'টেন্ডারের বিবরণ',
    tenderId: 'টেন্ডার আইডি',
    tenderTitle: 'টেন্ডারের শিরোনাম',
    procuringEntity: 'সংগ্রহকারী কর্তৃপক্ষ',
    bidder: 'দরপত্রদাতার নাম',
    submissionDeadline: 'জমার শেষ তারিখ',
    uploadTenderSpec: 'রিকয়ারমেন্টস লোড করুন (JSON)',
    uploadTenderSpecSub: 'requirements.json ফাইল নির্বাচন বা ড্রপ করুন',
    useSamplePack: 'স্যাম্পল প্যাক ডেটা লোড করুন',
    resetAll: 'রিসেট করুন',
    saveSession: 'সেশন সংরক্ষণ (JSON)',
    loadSession: 'সেশন লোড করুন',
    
    // Upload zone
    uploadFiles: 'ডকুমেন্ট আপলোড (PDF)',
    uploadFilesSub: 'একাধিক পিডিএফ ফাইল ড্র্যাগ ও ড্রপ করুন বা ব্রাউজ করুন (সর্বোচ্চ ৩০টি ফাইল, ৫০ মেগাবাইট)',
    rejectedFiles: 'বাতিলকৃত নন-পিডিএফ ফাইল',
    nonPdfWarning: 'টেন্ডার ডকুমেন্টের জন্য শুধুমাত্র পিডিএফ ফাইল গ্রহণযোগ্য। নন-পিডিএফ ফাইল বাতিল করা হয়েছে।',
    
    // File list
    uploadedFilesList: 'আপলোডকৃত পিডিএফ ফাইলসমূহ',
    pages: 'পৃষ্ঠা',
    page: 'পৃষ্ঠা',
    size: 'সাইজ',
    duplicateBadge: 'ডুপ্লিকেট ফাইল',
    duplicateWarning: 'একই ফাইল বারবার পাওয়া গেছে! ভিন্ন ডকুমেন্টে ম্যাচ করা যাবে না।',
    removeFile: 'ফাইল মুছুন',
    
    // Matrix / Requirements
    documentChecklist: 'ডকুমেন্টের তালিকা ও ম্যাচিং',
    docOrder: 'ক্রম',
    docTitle: 'প্রয়োজনীয় ডকুমেন্ট',
    docType: 'ধরন',
    mandatory: 'বাধ্যতামূলক',
    optional: 'ঐচ্ছিক',
    matchedFile: 'সংযুক্ত ফাইল',
    expiryDate: 'মেয়াদোত্তীর্ণের তারিখ',
    status: 'অবস্থা',
    actions: 'অ্যাকশন',
    selectFilePlaceholder: '-- আপলোড করা ফাইল নির্বাচন করুন --',
    unmatch: 'বাতিল',
    autoMatchBtn: 'স্মার্ট অটো-ম্যাচ',
    autoMatchTooltip: 'ফাইলের নামের সাথে মিল রেখে স্বয়ংক্রিয় ম্যাচ করুন',
    exportChecklistCsv: 'চেকলিস্ট এক্সপোর্ট (CSV)',
    
    // Statuses
    statusMissing: 'অনুপস্থিত (Missing)',
    statusExpiryNeeded: 'মেয়াদের তারিখ প্রয়োজন (Expiry date needed)',
    statusExpired: 'মেয়াদোত্তীর্ণ (Expired)',
    statusNotProvided: 'প্রদান করা হয়নি (Not provided)',
    statusOk: 'সঠিক (OK)',
    
    // Reasons
    reasonMissing: 'বাধ্যতামূলক ডকুমেন্ট কিন্তু কোনো ফাইল যুক্ত করা হয়নি।',
    reasonExpiryNeeded: 'ডকুমেন্টের মেয়াদ যাচাই প্রয়োজন কিন্তু তারিখ দেওয়া হয়নি।',
    reasonExpired: 'মেয়াদের তারিখ টেন্ডার জমার শেষ তারিখের পূর্ববর্তী।',
    reasonNotProvided: 'ঐচ্ছিক ডকুমেন্ট দেওয়া হয়নি (চূড়ান্ত প্যাকেজ থেকে বাদ থাকবে)।',
    reasonOk: 'ডকুমেন্ট সম্পূর্ণ এবং অনুমোদিত।',
    
    // Package generation
    packageBuilder: 'প্যাকেজ তৈরি',
    generatePackageBtn: 'টেন্ডার প্যাকেজ পিডিএফ তৈরি করুন',
    generating: 'পিডিএফ তৈরি হচ্ছে...',
    downloadPackageBtn: 'পিডিএফ প্যাকেজ ডাউনলোড করুন',
    validationSummary: 'যাচাইকরণ অডিট',
    readyToGenerate: 'সকল বাধ্যতামূলক ডকুমেন্ট যাচাই সম্পন্ন। প্যাকেজ তৈরির জন্য প্রস্তুত।',
    blockingIssuesCount: 'টি সমস্যা সমাধান করা প্রয়োজন। প্যাকেজ তৈরির পূর্বে সমাধান করুন।',
    
    // Options
    includeIndexPage: 'সূচিপত্র পৃষ্ঠা যুক্ত করুন (Index Page)',
    includeIndexPageSub: '২য় পৃষ্ঠায় প্রতিটি ডকুমেন্টের শুরুর পৃষ্ঠা নম্বর সহ সূচিপত্র যুক্ত করে',
    stampSignature: 'ডিজিটাল সিল / স্বাক্ষর',
    stampUpload: 'পিএনজি সিল বা স্বাক্ষর আপলোড',
    stampPosition: 'সিলের অবস্থান',
    stampPosBottomRight: 'নিচে ডানে',
    stampPosBottomLeft: 'নিচে বামে',
    stampPosTopRight: 'উপরে ডানে',
    stampTarget: 'সিল যুক্ত করার স্থান',
    stampTargetAll: 'সকল পৃষ্ঠায়',
    stampTargetDocuments: 'শুধুমাত্র মূল ডকুমেন্টে',
    stampTargetCover: 'শুধুমাত্র কভার পেজে',
    
    // AI sidebar
    aiAssistant: 'এআই পরামর্শক (ঐচ্ছিক)',
    aiKeyPlaceholder: 'আপনার নিজস্ব এআই এপিআই কী দিন (Gemini / OpenAI)',
    aiDisclaimer: 'আপনার কী শুধুমাত্র ব্রাউজারে সংরক্ষিত থাকবে। অ্যাপটি এআই ছাড়াও সম্পূর্ণ কার্যকর।',
    aiAnalyzeBtn: 'টেন্ডার যাচাই করুন',
    
    // Footer & info
    footerCredits: 'এআই ডেভফেস্ট ২০২৬ একক প্রতিযোগিতা | প্রতিযোগী: 241-15-178 | ফ্রন্টএন্ড ভিত্তিক'
  }
};
