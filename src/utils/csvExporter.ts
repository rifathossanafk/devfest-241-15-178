import { RequirementsData, UploadedDocFile, RequirementMatch } from '../types';
import { calculateDocumentStatus } from './statusCalculator';

export function exportChecklistToCSV(
  tenderData: RequirementsData,
  uploadedFiles: UploadedDocFile[],
  matches: Record<string, RequirementMatch>,
  lang: 'en' | 'bn'
): void {
  const { tender, requirements } = tenderData;
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);

  const headers = lang === 'en'
    ? ['Order', 'Document ID', 'Document Name', 'Mandatory', 'File Name', 'Pages', 'Expiry Date', 'Status', 'Notes']
    : ['ক্রম', 'ডকুমেন্ট আইডি', 'ডকুমেন্টের নাম', 'বাধ্যতামূলক', 'ফাইলের নাম', 'পৃষ্ঠা সংখ্যা', 'মেয়াদের তারিখ', 'অবস্থা', 'মন্তব্য'];

  const rows: string[][] = [headers];

  for (const req of sortedReqs) {
    const match = matches[req.id];
    const file = match?.fileId ? uploadedFiles.find(f => f.id === match.fileId) : undefined;
    const statusObj = calculateDocumentStatus(req, match, tender.submission_deadline);

    const docTitle = lang === 'bn' ? req.title_bn : req.title_en;
    const mandatoryText = req.mandatory ? (lang === 'bn' ? 'হ্যাঁ' : 'Yes') : (lang === 'bn' ? 'না' : 'No');
    const fileName = file ? file.name : (lang === 'bn' ? 'সংযুক্ত করা হয়নি' : 'None');
    const pages = file ? String(file.pageCount) : '-';
    const expiry = match?.expiryDate || '-';
    const statusText = statusObj.status;
    const note = lang === 'bn' ? statusObj.message_bn : statusObj.message_en;

    rows.push([
      String(req.order),
      req.id,
      `"${docTitle.replace(/"/g, '""')}"`,
      mandatoryText,
      `"${fileName.replace(/"/g, '""')}"`,
      pages,
      expiry,
      statusText,
      `"${note.replace(/"/g, '""')}"`
    ]);
  }

  // Prepend UTF-8 BOM so Excel opens Bangla and English characters flawlessly
  const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${tender.tender_id}_Verification_Checklist.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
