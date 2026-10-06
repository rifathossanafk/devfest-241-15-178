import { Requirement, DocumentStatusType, RequirementMatch, DocumentVerificationStatus } from '../types';

/**
 * Calculates document status based strictly on Section 5 of the Problem Statement:
 *
 * Status                 When                                                               Blocks?
 * -------------------------------------------------------------------------------------------------
 * Missing                Required document (mandatory=true), no file matched.               Yes
 * Expiry date needed     has_expiry=true and a file is matched, but no expiry date entered. Yes
 * Expired                The expiry date is before the submission deadline.                 Yes
 * Not provided           Optional document (mandatory=false), no file matched.              No
 * OK                     File matched, and (if has_expiry) expiry date >= deadline.         No
 *
 * (Note: If document expires on the same day as submission deadline, it is still OK.)
 */
export function calculateDocumentStatus(
  req: Requirement,
  match: RequirementMatch | undefined,
  submissionDeadline: string
): DocumentVerificationStatus {
  const hasFile = Boolean(match?.fileId);
  const expiryDate = match?.expiryDate?.trim();

  // 1. Mandatory document with no file matched -> MISSING
  if (req.mandatory && !hasFile) {
    return {
      status: 'MISSING',
      blocking: true,
      message_en: 'Mandatory document missing. Please attach a valid PDF file.',
      message_bn: 'বাধ্যতামূলক ডকুমেন্ট অনুপস্থিত। অনুগ্রহ করে একটি বৈধ পিডিএফ ফাইল সংযুক্ত করুন।'
    };
  }

  // 2. Optional document with no file matched -> NOT PROVIDED
  if (!req.mandatory && !hasFile) {
    return {
      status: 'NOT_PROVIDED',
      blocking: false,
      message_en: 'Optional document not provided (will be excluded from package).',
      message_bn: 'ঐচ্ছিক ডকুমেন্ট প্রদান করা হয়নি (প্যাকেজ থেকে বাদ থাকবে)।'
    };
  }

  // File is matched from here onwards:
  // 3. has_expiry is true, but no expiry date entered -> EXPIRY DATE NEEDED
  if (req.has_expiry && !expiryDate) {
    return {
      status: 'EXPIRY_NEEDED',
      blocking: true,
      message_en: 'Validity check required. Please enter the document expiry date.',
      message_bn: 'মেয়াদ যাচাই প্রয়োজন। অনুগ্রহ করে ডকুমেন্টের মেয়াদোত্তীর্ণের তারিখ দিন।'
    };
  }

  // 4. has_expiry is true, and expiry date is before submission deadline -> EXPIRED
  if (req.has_expiry && expiryDate) {
    // Compare dates in YYYY-MM-DD
    // Note: If expiry date is on the same day as deadline, it is still OK!
    if (expiryDate < submissionDeadline) {
      return {
        status: 'EXPIRED',
        blocking: true,
        message_en: `Expired! Document expires on ${expiryDate}, which is before deadline (${submissionDeadline}).`,
        message_bn: `মেয়াদোত্তীর্ণ! ডকুমেন্টের মেয়াদ ${expiryDate}, যা জমার শেষ তারিখের (${submissionDeadline}) পূর্ববর্তী।`
      };
    }
  }

  // 5. File matched, and valid expiry (if required) -> OK
  return {
    status: 'OK',
    blocking: false,
    message_en: 'Verified and compliant.',
    message_bn: 'যাচাই সম্পন্ন ও সঠিক।'
  };
}
