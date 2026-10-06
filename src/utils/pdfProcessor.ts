import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { Requirement, RequirementsData, UploadedDocFile, RequirementMatch, StampConfig } from '../types';

// Fast SHA-256 computation using browser Web Crypto API
export async function computeFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Inspect PDF, get page count, check corruption / passwords safely
export async function inspectPDF(file: File): Promise<{
  pageCount: number;
  data: Uint8Array;
  isCorrupt: boolean;
  errorMessage?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    
    // Attempt load with pdf-lib
    const pdfDoc = await PDFDocument.load(uint8, { ignoreEncryption: true });
    const count = pdfDoc.getPageCount();
    
    return {
      pageCount: count,
      data: uint8,
      isCorrupt: false
    };
  } catch (err: any) {
    return {
      pageCount: 0,
      data: new Uint8Array(),
      isCorrupt: true,
      errorMessage: err.message || 'Corrupt or password-protected PDF'
    };
  }
}

export interface PackageBuildResult {
  pdfBytes: Uint8Array;
  totalPages: number;
  fileName: string;
}

export async function buildTenderPackage(
  tenderData: RequirementsData,
  uploadedFiles: UploadedDocFile[],
  matches: Record<string, RequirementMatch>,
  options: {
    includeIndexPage: boolean;
    stampConfig?: StampConfig;
  }
): Promise<PackageBuildResult> {
  const { tender, requirements } = tenderData;
  const mergedPdf = await PDFDocument.create();
  
  // Sort requirements strictly by order
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  
  // Determine which documents are actually included
  const includedItems: {
    req: Requirement;
    file: UploadedDocFile;
    pageCount: number;
    startPage?: number;
  }[] = [];

  for (const req of sortedReqs) {
    const match = matches[req.id];
    if (match && match.fileId) {
      const file = uploadedFiles.find(f => f.id === match.fileId);
      if (file && !file.isCorrupt) {
        includedItems.push({
          req,
          file,
          pageCount: file.pageCount
        });
      }
    }
  }

  const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await mergedPdf.embedFont(StandardFonts.HelveticaOblique);

  // 1. CREATE COVER PAGE (Page 1)
  const coverPage = mergedPdf.addPage(PageSizes.A4);
  const { width: cWidth, height: cHeight } = coverPage.getSize();

  // Draw Header Banner
  coverPage.drawRectangle({
    x: 0,
    y: cHeight - 110,
    width: cWidth,
    height: 110,
    color: rgb(0.08, 0.15, 0.28) // Deep executive navy
  });

  coverPage.drawText('TENDER DOCUMENT PACKAGE', {
    x: 40,
    y: cHeight - 55,
    size: 20,
    font: helveticaBold,
    color: rgb(1, 1, 1)
  });

  coverPage.drawText(`Official Bid Submission Package | Tender ID: ${tender.tender_id}`, {
    x: 40,
    y: cHeight - 80,
    size: 11,
    font: helveticaFont,
    color: rgb(0.85, 0.90, 0.98)
  });

  // Tender Metadata Box
  coverPage.drawRectangle({
    x: 40,
    y: cHeight - 270,
    width: cWidth - 80,
    height: 140,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.82, 0.86, 0.92),
    borderWidth: 1
  });

  const metaItems = [
    { label: 'Tender Title:', val: tender.title },
    { label: 'Procuring Entity:', val: tender.procuring_entity },
    { label: 'Bidder Name:', val: tender.bidder },
    { label: 'Submission Deadline:', val: tender.submission_deadline },
    { label: 'Package Creation Date:', val: new Date().toISOString().split('T')[0] }
  ];

  let metaY = cHeight - 150;
  for (const item of metaItems) {
    coverPage.drawText(item.label, {
      x: 55,
      y: metaY,
      size: 10,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.35)
    });
    coverPage.drawText(item.val, {
      x: 200,
      y: metaY,
      size: 10,
      font: helveticaFont,
      color: rgb(0.1, 0.1, 0.1)
    });
    metaY -= 22;
  }

  // Included Documents Table
  coverPage.drawText('INCLUDED DOCUMENTS SCHEDULE', {
    x: 40,
    y: cHeight - 300,
    size: 12,
    font: helveticaBold,
    color: rgb(0.12, 0.2, 0.35)
  });

  // Table header
  coverPage.drawRectangle({
    x: 40,
    y: cHeight - 330,
    width: cWidth - 80,
    height: 24,
    color: rgb(0.9, 0.93, 0.97)
  });

  coverPage.drawText('No.', { x: 50, y: cHeight - 323, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  coverPage.drawText('Document Name', { x: 80, y: cHeight - 323, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  coverPage.drawText('File Attached', { x: 300, y: cHeight - 323, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  coverPage.drawText('Pages', { x: 490, y: cHeight - 323, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });

  let rowY = cHeight - 350;
  let docIndex = 1;
  for (const item of includedItems) {
    if (rowY < 80) break; // prevent overflowing page 1
    
    coverPage.drawLine({
      start: { x: 40, y: rowY + 16 },
      end: { x: cWidth - 40, y: rowY + 16 },
      thickness: 0.5,
      color: rgb(0.88, 0.88, 0.9)
    });

    coverPage.drawText(String(docIndex++), { x: 50, y: rowY + 4, size: 9, font: helveticaFont, color: rgb(0.3, 0.3, 0.3) });
    
    // Truncate title if needed
    const docTitle = item.req.title_en.length > 36 ? item.req.title_en.substring(0, 34) + '...' : item.req.title_en;
    coverPage.drawText(docTitle, { x: 80, y: rowY + 4, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });

    const fName = item.file.name.length > 32 ? item.file.name.substring(0, 30) + '...' : item.file.name;
    coverPage.drawText(fName, { x: 300, y: rowY + 4, size: 8, font: helveticaOblique, color: rgb(0.35, 0.35, 0.35) });

    coverPage.drawText(`${item.pageCount}`, { x: 500, y: rowY + 4, size: 9, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });

    rowY -= 20;
  }

  // 2. OPTIONAL INDEX PAGE (BONUS TASK 1)
  let indexPageNumber = 0;
  let indexPageRef: any = null;
  if (options.includeIndexPage) {
    indexPageRef = mergedPdf.addPage(PageSizes.A4);
    indexPageNumber = 2; // page 2
  }

  // 3. COPY PAGES FROM ATTACHED DOCUMENTS IN EXACT ORDER
  let currentOffset = options.includeIndexPage ? 3 : 2; // pages before documents

  for (const item of includedItems) {
    item.startPage = currentOffset;
    const docSrc = await PDFDocument.load(item.file.data);
    const pageIndices = docSrc.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(docSrc, pageIndices);
    
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
    currentOffset += copiedPages.length;
  }

  const totalPages = mergedPdf.getPageCount();

  // Populate Index Page if enabled
  if (options.includeIndexPage && indexPageRef) {
    const { width: iWidth, height: iHeight } = indexPageRef.getSize();

    indexPageRef.drawText('TABLE OF CONTENTS / INDEX', {
      x: 40,
      y: iHeight - 60,
      size: 16,
      font: helveticaBold,
      color: rgb(0.08, 0.15, 0.28)
    });

    indexPageRef.drawText('Navigational Page References for Package Contents', {
      x: 40,
      y: iHeight - 80,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.45, 0.5)
    });

    indexPageRef.drawLine({
      start: { x: 40, y: iHeight - 90 },
      end: { x: iWidth - 40, y: iHeight - 90 },
      thickness: 1,
      color: rgb(0.8, 0.85, 0.9)
    });

    // Index table header
    indexPageRef.drawRectangle({
      x: 40,
      y: iHeight - 125,
      width: iWidth - 80,
      height: 24,
      color: rgb(0.93, 0.95, 0.98)
    });

    indexPageRef.drawText('Section / Document Title', { x: 50, y: iHeight - 118, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    indexPageRef.drawText('File Source', { x: 280, y: iHeight - 118, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    indexPageRef.drawText('Pages', { x: 440, y: iHeight - 118, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    indexPageRef.drawText('Start Page', { x: 490, y: iHeight - 118, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });

    let idxY = iHeight - 150;
    // Cover entry
    indexPageRef.drawText('Tender Submission Cover Page', { x: 50, y: idxY, size: 9, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
    indexPageRef.drawText('System Generated', { x: 280, y: idxY, size: 8, font: helveticaOblique, color: rgb(0.4, 0.4, 0.4) });
    indexPageRef.drawText('1', { x: 445, y: idxY, size: 9, font: helveticaFont, color: rgb(0.3, 0.3, 0.3) });
    indexPageRef.drawText('Page 1', { x: 490, y: idxY, size: 9, font: helveticaBold, color: rgb(0.1, 0.4, 0.8) });
    idxY -= 22;

    // Index entry
    indexPageRef.drawText('Table of Contents (Index)', { x: 50, y: idxY, size: 9, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
    indexPageRef.drawText('System Generated', { x: 280, y: idxY, size: 8, font: helveticaOblique, color: rgb(0.4, 0.4, 0.4) });
    indexPageRef.drawText('1', { x: 445, y: idxY, size: 9, font: helveticaFont, color: rgb(0.3, 0.3, 0.3) });
    indexPageRef.drawText('Page 2', { x: 490, y: idxY, size: 9, font: helveticaBold, color: rgb(0.1, 0.4, 0.8) });
    idxY -= 22;

    for (const item of includedItems) {
      if (idxY < 60) break;
      
      indexPageRef.drawLine({
        start: { x: 40, y: idxY + 16 },
        end: { x: iWidth - 40, y: idxY + 16 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.92)
      });

      const title = item.req.title_en.length > 34 ? item.req.title_en.substring(0, 32) + '...' : item.req.title_en;
      indexPageRef.drawText(title, { x: 50, y: idxY + 4, size: 9, font: helveticaBold, color: rgb(0.15, 0.15, 0.15) });

      const name = item.file.name.length > 25 ? item.file.name.substring(0, 23) + '...' : item.file.name;
      indexPageRef.drawText(name, { x: 280, y: idxY + 4, size: 8, font: helveticaOblique, color: rgb(0.4, 0.4, 0.4) });

      indexPageRef.drawText(`${item.pageCount}`, { x: 445, y: idxY + 4, size: 9, font: helveticaFont, color: rgb(0.3, 0.3, 0.3) });
      indexPageRef.drawText(`Page ${item.startPage}`, { x: 490, y: idxY + 4, size: 9, font: helveticaBold, color: rgb(0.1, 0.4, 0.8) });

      idxY -= 22;
    }
  }

  // 4. EMBED DIGITAL STAMP / SIGNATURE IF CONFIGURED (BONUS TASK 2)
  let embeddedStamp: any = null;
  if (options.stampConfig?.enabled && options.stampConfig?.imageBytes) {
    try {
      embeddedStamp = await mergedPdf.embedPng(options.stampConfig.imageBytes);
    } catch {
      // ignore stamp embed error
    }
  }

  // 5. ADD FOOTER ON EVERY PAGE & APPLY STAMPS
  // Rule 6.3: Every page, including the cover, has a footer at the bottom: <tender_id> | Page X of Y
  // Rule 6.4: The footer must be easy to read and must not cover the document's content.
  const pages = mergedPdf.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;
    const { width: pWidth, height: pHeight } = page.getSize();

    // Draw Footer bar & text
    // A clean unobtrusive 20pt baseline
    const footerText = `${tender.tender_id}  |  Page ${pageNum} of ${totalPages}`;
    const textWidth = helveticaFont.widthOfTextAtSize(footerText, 9);
    const textX = (pWidth - textWidth) / 2;

    // Small translucent white backing bar to ensure 100% legibility over any document background
    page.drawRectangle({
      x: textX - 12,
      y: 12,
      width: textWidth + 24,
      height: 18,
      color: rgb(1, 1, 1),
      opacity: 0.92,
      borderWidth: 0.5,
      borderColor: rgb(0.85, 0.85, 0.85)
    });

    page.drawText(footerText, {
      x: textX,
      y: 17,
      size: 9,
      font: helveticaFont,
      color: rgb(0.2, 0.25, 0.3)
    });

    // Apply stamp if enabled
    if (embeddedStamp && options.stampConfig) {
      const applyToThisPage =
        options.stampConfig.target === 'all' ||
        (options.stampConfig.target === 'cover' && pageNum === 1) ||
        (options.stampConfig.target === 'documents' && pageNum > (options.includeIndexPage ? 2 : 1));

      if (applyToThisPage) {
        const stampW = 75;
        const stampH = 75;
        let sX = pWidth - stampW - 40;
        let sY = 45; // bottom right

        if (options.stampConfig.position === 'bottom-left') {
          sX = 40;
          sY = 45;
        } else if (options.stampConfig.position === 'top-right') {
          sX = pWidth - stampW - 40;
          sY = pHeight - stampH - 40;
        }

        page.drawImage(embeddedStamp, {
          x: sX,
          y: sY,
          width: stampW,
          height: stampH,
          opacity: options.stampConfig.opacity || 0.85
        });
      }
    }
  }

  const pdfBytes = await mergedPdf.save();
  return {
    pdfBytes,
    totalPages,
    fileName: `${tender.tender_id}_Package.pdf`
  };
}
