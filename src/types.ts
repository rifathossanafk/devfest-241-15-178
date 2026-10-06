export interface TenderInfo {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string;
}

export interface Requirement {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface RequirementsData {
  tender: TenderInfo;
  requirements: Requirement[];
}

export interface UploadedDocFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  hash: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateOfName?: string;
  data: Uint8Array;
  isCorrupt?: boolean;
  errorMessage?: string;
}

export type DocumentStatusType =
  | 'OK'
  | 'MISSING'
  | 'EXPIRY_NEEDED'
  | 'EXPIRED'
  | 'NOT_PROVIDED';

export interface RequirementMatch {
  requirementId: string;
  fileId?: string;
  expiryDate?: string;
}

export interface DocumentVerificationStatus {
  status: DocumentStatusType;
  blocking: boolean;
  message_en: string;
  message_bn: string;
}

export interface StampConfig {
  enabled: boolean;
  imageDataUrl?: string;
  imageBytes?: Uint8Array;
  imageName?: string;
  target: 'all' | 'documents' | 'cover';
  position: 'bottom-right' | 'bottom-left' | 'top-right';
  opacity: number;
  scale: number;
}
