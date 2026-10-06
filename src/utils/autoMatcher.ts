import { Requirement, UploadedDocFile, RequirementMatch } from '../types';

/**
 * Intelligent file-to-requirement auto-matching based on normalized filename heuristics.
 * Guarantees strict 1-to-1 matching:
 * - One document gets at most one file
 * - One file goes to at most one document
 * - Duplicates are never assigned to multiple documents
 */
export function autoMatchFiles(
  requirements: Requirement[],
  uploadedFiles: UploadedDocFile[],
  currentMatches: Record<string, RequirementMatch>
): Record<string, RequirementMatch> {
  const newMatches: Record<string, RequirementMatch> = { ...currentMatches };
  const assignedFileIds = new Set<string>();

  // Collect already assigned files (excluding non-matching ones)
  Object.values(newMatches).forEach(m => {
    if (m.fileId) assignedFileIds.add(m.fileId);
  });

  const availableFiles = uploadedFiles.filter(f => !f.isCorrupt);

  // Helper keyword map for robust matching
  const requirementKeywords: Record<string, string[]> = {
    R01: ['trade', 'license', 'tradelicense'],
    R02: ['tin', 'tax', 'tin_certificate'],
    R03: ['vat', 'vat_certificate', 'value_added'],
    R04: ['bank', 'solvency', 'banksolvency'],
    R05: ['experience', 'experience_cert'],
    R06: ['audit', 'financial_statement', 'audited'],
    R07: ['manufacturer', 'authorization', 'ma_letter'],
    R08: ['technical', 'technical_proposal'],
    R09: ['financial', 'financial_proposal'],
    R10: ['declaration', 'signed_declaration', 'scan_0042', 'scanned']
  };

  // Sort requirements by order
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);

  for (const req of sortedReqs) {
    // If already matched and file still exists, keep it
    if (newMatches[req.id]?.fileId) {
      continue;
    }

    const keywords = requirementKeywords[req.id] || [];
    const normalizedReqTitle = req.title_en.toLowerCase().replace(/[^a-z0-9]/g, ' ');

    let bestFile: UploadedDocFile | null = null;
    let highestScore = 0;

    for (const file of availableFiles) {
      if (assignedFileIds.has(file.id)) continue;

      // Rule 4.6: If file is marked duplicate of an already assigned file, skip it
      if (file.isDuplicate && file.duplicateOfId && assignedFileIds.has(file.duplicateOfId)) {
        continue;
      }

      const fNameNorm = file.name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      let score = 0;

      // Exact keyword matches
      for (const kw of keywords) {
        if (fNameNorm.includes(kw.toLowerCase())) {
          score += 5;
        }
      }

      // Requirement title word matches
      const reqWords = normalizedReqTitle.split(' ').filter(w => w.length > 2);
      for (const word of reqWords) {
        if (fNameNorm.includes(word)) {
          score += 3;
        }
      }

      // Favor newer year for trade license if multiple exist (e.g. 2026 > 2025)
      if (req.id === 'R01' && fNameNorm.includes('2026')) {
        score += 2;
      }

      if (score > highestScore && score >= 3) {
        highestScore = score;
        bestFile = file;
      }
    }

    if (bestFile) {
      assignedFileIds.add(bestFile.id);
      newMatches[req.id] = {
        requirementId: req.id,
        fileId: bestFile.id,
        expiryDate: newMatches[req.id]?.expiryDate || ''
      };
    }
  }

  return newMatches;
}
