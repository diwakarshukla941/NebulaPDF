import { PDFDocument, type PDFFont, StandardFonts, degrees, rgb } from 'pdf-lib'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import type { PDFFile, PDFTool } from '../types'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const PDF_MIME = 'application/pdf'

export type CompressionLevel = 'low' | 'balanced' | 'extreme'

export interface ProcessingOptions {
  compressionLevel: CompressionLevel
  password: string
  editText: string
  signatureName: string
  quality: number
}

export interface ProcessingResult {
  name: string
  blob: Blob
}

interface PreparedImage {
  bytes: Uint8Array
  mimeType: string
}

export async function processPdfTool(
  tool: PDFTool,
  files: PDFFile[],
  options: ProcessingOptions
): Promise<ProcessingResult[]> {
  if (!files.length) {
    throw new Error('Select at least one file to continue.')
  }

  switch (tool) {
    case 'merge':
      return mergePdfFiles(files, 'merged.pdf')
    case 'organize':
      return mergePdfFiles(files, 'organized.pdf')
    case 'split':
      return splitPdf(files[0])
    case 'compress':
      return compressPdf(files[0], options.compressionLevel)
    case 'convert':
      return convertToPdf(files)
    case 'pdf-to-jpg':
      return convertPdfToJpg(files[0], options.quality)
    case 'edit':
      return editPdf(files[0], options.editText)
    case 'sign':
      return signPdf(files[0], options.signatureName)
    case 'ocr':
      return extractText(files[0])
    case 'protect':
      if (!options.password.trim()) {
        throw new Error('Enter a password before protecting the PDF.')
      }
      throw new Error('Password encryption is not supported in this browser-only build.')
  }
}

async function mergePdfFiles(files: PDFFile[], outputName: string): Promise<ProcessingResult[]> {
  const merged = await PDFDocument.create()

  for (const file of files) {
    assertPdf(file, 'merge')
    const source = await PDFDocument.load(await readFileBytes(file.file))
    const pages = await merged.copyPages(source, source.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }

  if (merged.getPageCount() === 0) {
    throw new Error('No PDF pages were found to merge.')
  }

  const mergedBytes = await merged.save({ useObjectStreams: true })
  return [asResult(outputName, new Blob([mergedBytes], { type: PDF_MIME }))]
}

async function splitPdf(file: PDFFile): Promise<ProcessingResult[]> {
  assertPdf(file, 'split')
  const source = await PDFDocument.load(await readFileBytes(file.file))
  const pageCount = source.getPageCount()
  const baseName = getBaseName(file.name)
  const results: ProcessingResult[] = []

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const singlePageDoc = await PDFDocument.create()
    const [page] = await singlePageDoc.copyPages(source, [pageIndex])
    singlePageDoc.addPage(page)
    const bytes = await singlePageDoc.save({ useObjectStreams: true })
    results.push(asResult(`${baseName}-page-${pageIndex + 1}.pdf`, new Blob([bytes], { type: PDF_MIME })))
  }

  return results
}

async function compressPdf(file: PDFFile, level: CompressionLevel): Promise<ProcessingResult[]> {
  assertPdf(file, 'compress')
  const source = await PDFDocument.load(await readFileBytes(file.file))
  const objectsPerTick = level === 'extreme' ? 25 : level === 'balanced' ? 50 : 100
  const compressedBytes = await source.save({
    useObjectStreams: true,
    updateFieldAppearances: false,
    objectsPerTick,
  })

  return [
    asResult(`${getBaseName(file.name)}-compressed.pdf`, new Blob([compressedBytes], { type: PDF_MIME })),
  ]
}

async function convertToPdf(files: PDFFile[]): Promise<ProcessingResult[]> {
  const pdfDoc = await PDFDocument.create()

  for (const file of files) {
    if (isPdf(file.file)) {
      const sourcePdf = await PDFDocument.load(await readFileBytes(file.file))
      const pages = await pdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices())
      for (const page of pages) {
        pdfDoc.addPage(page)
      }
      continue
    }

    if (isDocLike(file.file)) {
      throw new Error('DOC and DOCX conversion needs a backend converter and is unavailable locally.')
    }

    const preparedImage = await getImageForPdf(file.file)
    const supported = await addImagePage(pdfDoc, preparedImage.bytes, preparedImage.mimeType)
    if (!supported) {
      throw new Error(`Unsupported file type for conversion: ${file.name}`)
    }
  }

  if (pdfDoc.getPageCount() === 0) {
    throw new Error('No supported files were selected for conversion.')
  }

  const bytes = await pdfDoc.save({ useObjectStreams: true })
  return [asResult('converted.pdf', new Blob([bytes], { type: PDF_MIME }))]
}

async function convertPdfToJpg(file: PDFFile, quality: number): Promise<ProcessingResult[]> {
  assertPdf(file, 'convert to JPG')
  const sourceBytes = await readFileBytes(file.file)
  const pdf = await getDocument({ data: sourceBytes }).promise
  const baseName = getBaseName(file.name)
  const renderScale = quality >= 90 ? 2 : quality >= 75 ? 1.5 : 1.2
  const results: ProcessingResult[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: renderScale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Unable to initialize image canvas.')
      }

      await page.render({ canvasContext: context, viewport }).promise
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality / 100)
      results.push(asResult(`${baseName}-page-${pageNumber}.jpg`, blob))
    }
  } finally {
    await pdf.destroy()
  }

  return results
}

async function editPdf(file: PDFFile, editText: string): Promise<ProcessingResult[]> {
  assertPdf(file, 'edit')
  const source = await PDFDocument.load(await readFileBytes(file.file))
  const boldFont = await source.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await source.embedFont(StandardFonts.Helvetica)
  const note = editText.trim() || 'Edited with NebulaPDF'
  const editedAt = formatTimestamp()

  for (const [index, page] of source.getPages().entries()) {
    const { width, height } = page.getSize()
    const margin = Math.max(14, Math.min(34, width * 0.04))
    const maxBoxWidth = Math.max(120, width - margin * 2)
    const meta = `Edited on ${editedAt} | Page ${index + 1}`
    const titleSize = fitFontSize(
      boldFont,
      note,
      maxBoxWidth - 20,
      Math.max(12, Math.min(20, width / 28)),
      9
    )
    const metaSize = fitFontSize(
      regularFont,
      meta,
      maxBoxWidth - 20,
      Math.max(9, titleSize - 3),
      8
    )
    const titleWidth = boldFont.widthOfTextAtSize(note, titleSize)
    const metaWidth = regularFont.widthOfTextAtSize(meta, metaSize)
    const boxWidth = Math.min(maxBoxWidth, Math.max(titleWidth, metaWidth) + 20)
    const boxHeight = titleSize + metaSize + 18
    const boxX = margin
    const boxY = Math.max(margin, height - margin - boxHeight)

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.96, 0.98, 1),
      opacity: 0.92,
      borderColor: rgb(0.76, 0.84, 0.93),
      borderWidth: 1,
    })

    page.drawText(note, {
      x: boxX + 10,
      y: boxY + boxHeight - titleSize - 7,
      size: titleSize,
      font: boldFont,
      color: rgb(0.13, 0.24, 0.4),
    })

    page.drawText(meta, {
      x: boxX + 10,
      y: boxY + 7,
      size: metaSize,
      font: regularFont,
      color: rgb(0.34, 0.47, 0.63),
    })

    const watermarkSize = fitFontSize(
      boldFont,
      note,
      width * 0.86,
      Math.max(24, Math.min(52, width / 9)),
      12
    )
    const watermarkWidth = boldFont.widthOfTextAtSize(note, watermarkSize)
    page.drawText(note, {
      x: (width - watermarkWidth) / 2,
      y: (height - watermarkSize) / 2,
      size: watermarkSize,
      font: boldFont,
      color: rgb(0.18, 0.39, 0.62),
      rotate: degrees(-24),
      opacity: 0.1,
    })
  }

  const bytes = await source.save({ useObjectStreams: true })
  return [asResult(`${getBaseName(file.name)}-edited.pdf`, new Blob([bytes], { type: PDF_MIME }))]
}

async function signPdf(file: PDFFile, signatureName: string): Promise<ProcessingResult[]> {
  assertPdf(file, 'sign')
  const source = await PDFDocument.load(await readFileBytes(file.file))
  const headingFont = await source.embedFont(StandardFonts.HelveticaBold)
  const detailFont = await source.embedFont(StandardFonts.Helvetica)
  const scriptFont = await source.embedFont(StandardFonts.TimesRomanItalic)
  const signer = signatureName.trim() || 'NebulaPDF User'
  const signedAt = formatTimestamp()

  const pages = source.getPages()
  const page = pages[pages.length - 1]
  if (!page) {
    throw new Error('The PDF has no pages to sign.')
  }

  const { width, height } = page.getSize()
  const margin = Math.max(16, Math.min(34, width * 0.04))
  const maxWidth = Math.max(160, width - margin * 2)
  const heading = 'Electronically Signed'
  const dateLine = `Date: ${signedAt}`
  const provenanceLine = 'Generated by NebulaPDF'

  const headingSize = fitFontSize(headingFont, heading, maxWidth - 24, 10.5, 8.5)
  const signatureSize = fitFontSize(
    scriptFont,
    signer,
    maxWidth - 24,
    Math.max(16, Math.min(28, width / 20)),
    12
  )
  const detailSize = fitFontSize(detailFont, dateLine, maxWidth - 24, 9.5, 8)

  const headingWidth = headingFont.widthOfTextAtSize(heading, headingSize)
  const signatureWidth = scriptFont.widthOfTextAtSize(signer, signatureSize)
  const dateWidth = detailFont.widthOfTextAtSize(dateLine, detailSize)
  const provenanceWidth = detailFont.widthOfTextAtSize(provenanceLine, detailSize)

  const contentWidth = Math.max(headingWidth, signatureWidth, dateWidth, provenanceWidth)
  const boxWidth = Math.min(maxWidth, contentWidth + 24)
  const boxHeight = headingSize + signatureSize + detailSize * 2 + 30
  const x = Math.max(margin, width - margin - boxWidth)
  const y = Math.max(margin, Math.min(margin + 8, height - boxHeight - margin))

  page.drawRectangle({
    x,
    y,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.96, 0.99, 1),
    opacity: 0.95,
    borderColor: rgb(0.22, 0.5, 0.74),
    borderWidth: 1.2,
  })

  let cursorY = y + boxHeight - 12 - headingSize
  page.drawText(heading, {
    x: x + 12,
    y: cursorY,
    size: headingSize,
    font: headingFont,
    color: rgb(0.07, 0.23, 0.41),
  })

  cursorY -= 6
  page.drawLine({
    start: { x: x + 12, y: cursorY },
    end: { x: x + boxWidth - 12, y: cursorY },
    thickness: 0.7,
    color: rgb(0.46, 0.62, 0.78),
    opacity: 0.8,
  })

  cursorY -= signatureSize + 6
  page.drawText(signer, {
    x: x + 12,
    y: cursorY,
    size: signatureSize,
    font: scriptFont,
    color: rgb(0.06, 0.28, 0.49),
  })

  cursorY -= detailSize + 4
  page.drawText(dateLine, {
    x: x + 12,
    y: cursorY,
    size: detailSize,
    font: detailFont,
    color: rgb(0.13, 0.36, 0.55),
  })

  cursorY -= detailSize + 2
  page.drawText(provenanceLine, {
    x: x + 12,
    y: cursorY,
    size: detailSize,
    font: detailFont,
    color: rgb(0.13, 0.36, 0.55),
  })

  const bytes = await source.save({ useObjectStreams: true })
  return [asResult(`${getBaseName(file.name)}-signed.pdf`, new Blob([bytes], { type: PDF_MIME }))]
}

async function extractText(file: PDFFile): Promise<ProcessingResult[]> {
  assertPdf(file, 'extract text')
  const sourceBytes = await readFileBytes(file.file)
  const pdf = await getDocument({ data: sourceBytes }).promise
  const sections: string[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => readTextItem(item))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      sections.push(`Page ${pageNumber}`)
      sections.push(text || '[No extractable text detected on this page.]')
      sections.push('')
    }
  } finally {
    await pdf.destroy()
  }

  const output = new Blob([sections.join('\n')], { type: 'text/plain;charset=utf-8' })
  return [asResult(`${getBaseName(file.name)}-text.txt`, output)]
}

function readTextItem(item: unknown): string {
  if (!item || typeof item !== 'object' || !('str' in item)) {
    return ''
  }

  const maybeString = (item as { str: unknown }).str
  return typeof maybeString === 'string' ? maybeString : ''
}

async function addImagePage(pdfDoc: PDFDocument, imageBytes: Uint8Array, mimeType: string): Promise<boolean> {
  if (mimeType === 'image/png') {
    const image = await pdfDoc.embedPng(imageBytes)
    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    return true
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    const image = await pdfDoc.embedJpg(imageBytes)
    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    return true
  }

  return false
}

function fitFontSize(
  font: PDFFont,
  text: string,
  maxWidth: number,
  preferredSize: number,
  minSize: number
): number {
  let size = preferredSize
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5
  }
  return Math.max(minSize, Number(size.toFixed(2)))
}

function assertPdf(file: PDFFile, action: string) {
  if (!isPdf(file.file)) {
    throw new Error(`"${file.name}" is not a PDF file and cannot be used for ${action}.`)
  }
}

function isPdf(file: File): boolean {
  return file.type === PDF_MIME || file.name.toLowerCase().endsWith('.pdf')
}

function isDocLike(file: File): boolean {
  const lower = file.name.toLowerCase()
  return lower.endsWith('.doc') || lower.endsWith('.docx')
}

function isImageLike(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true
  }
  const lower = file.name.toLowerCase()
  return (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif')
  )
}

async function getImageForPdf(file: File): Promise<PreparedImage> {
  if (!isImageLike(file)) {
    throw new Error(`"${file.name}" is not a supported image format.`)
  }

  const loweredType = file.type.toLowerCase()
  if (loweredType === 'image/png' || loweredType === 'image/jpeg' || loweredType === 'image/jpg') {
    return {
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: loweredType,
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Unable to render image for conversion.')
    }
    context.drawImage(image, 0, 0)
    const blob = await canvasToBlob(canvas, 'image/png')
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      mimeType: 'image/png',
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to read image file.'))
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to export generated file.'))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

function readFileBytes(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

function asResult(name: string, blob: Blob): ProcessingResult {
  return { name, blob }
}

function getBaseName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot <= 0 ? fileName : fileName.slice(0, lastDot)
}

function formatTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
