# NebulaPDF

NebulaPDF is a browser-based PDF toolkit built with React + TypeScript + Vite.  
It is designed for fast local file processing with a modern UI and no server dependency for core operations.

## What This Project Is

NebulaPDF is a single-page web app that lets users:
- Merge PDFs
- Split PDFs by page
- Compress PDFs
- Convert images/PDFs into a single PDF
- Convert PDF pages to JPG
- Add visible edit marks/watermarks
- Add visible digital signature blocks
- Extract text from PDF pages
- Reorder files before merge/organize flows
- Switch between dark/light themes
- View processing history in-app

All processing happens in the browser for the supported operations.

## Why NebulaPDF

- Fast UI and drag-and-drop workflow
- Privacy-friendly local processing
- No account, pricing, or sign-in dependency in the app flow
- Clear error handling for unsupported cases
- Production-ready structure for further extension

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Framer Motion (UI transitions)
- pdf-lib (PDF manipulation)
- pdfjs-dist (rendering + text extraction)
- react-dropzone (file upload UX)
- lucide-react (icons)

## Current Features

### PDF Operations
- **Merge PDF**: Combine multiple PDFs into one output file.
- **Split PDF**: Export each page as an individual PDF file.
- **Compress PDF**: Save optimized PDF output with selectable compression level.
- **Convert to PDF**: Combine PDFs and images (`png`, `jpg`, `jpeg`, `webp`, `gif`) into one PDF.
- **PDF to JPG**: Render each page to a JPG image with quality control.
- **Organize PDF**: Reorder selected files before combining.
- **Edit PDF**: Add visible edit note and watermark overlays.
- **Sign PDF**: Add a visible signature block with signer name + timestamp.
- **Extract Text**: Export selectable text content into `.txt`.

### UI/UX
- Responsive interface
- Dark/light theme toggle
- File list management with remove/reorder actions
- Processing states and status indicators
- Download single or multiple generated outputs
- History panel with success/error logging

## Known Functional Boundaries

- **Password-protected/encrypted PDF creation** is not implemented in this browser-only build.
  - The underlying flow is intentionally disabled in UI and guarded in processor logic.
- **Real OCR for image-only scanned PDFs** is not included.
  - Current text extraction uses `pdfjs-dist` and works for PDFs with extractable text layers.
- **DOC/DOCX direct conversion** requires a backend conversion service and is not supported locally.

## Project Structure

```text
NebulaPDF/
  public/
    favicon.svg
  src/
    components/
      Header.tsx
      Hero.tsx
      HistoryPanel.tsx
      ToolGrid.tsx
      ToolWorkspace.tsx
    lib/
      pdfProcessor.ts
    store/
      useAppStore.ts
    App.tsx
    index.css
    main.tsx
    types.ts
    vite-env.d.ts
  index.html
  package.json
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  tsconfig.json
```

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: latest LTS)
- npm 9+

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Default local URL (from Vite): `http://localhost:5173`  
If configured differently, open the URL shown in terminal output.

### Build for Production

```bash
npm run build
```

Build output is generated in `dist/`.

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Scripts

From `package.json`:
- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check + production build
- `npm run preview` - Serve built files locally
- `npm run lint` - ESLint checks

## Core Processing Design

Main processing entry point:
- `src/lib/pdfProcessor.ts` -> `processPdfTool(tool, files, options)`

Flow:
1. Validate inputs and tool compatibility
2. Route to operation-specific handler
3. Use `pdf-lib` / `pdfjs-dist` for processing
4. Return generated `Blob` results
5. UI creates downloadable object URLs

State management:
- `src/store/useAppStore.ts` tracks active tool, file queue, status, history, and theme mode.

## Production Readiness Notes

Implemented:
- Strong TypeScript checks (`strict` mode)
- Build + lint pipeline
- Input validation and guarded unsupported operations
- Cleaner product UI without dead business/navigation actions
- Better file handling for single-file tools
- Theme support at app-shell level

Recommended next improvements:
- Add automated tests (unit + integration)
- Add E2E tests (Playwright/Cypress)
- Add CI workflow for lint/build/test gates
- Add backend services if encrypted output and OCR are required
- Add chunk splitting optimization to reduce large bundle warnings

## Security/Privacy Notes

- Files are processed in-browser for supported operations.
- No external upload is required by current implementation.
- If backend features are added later (OCR/encryption/doc conversion), clearly document upload and retention policies.

## Troubleshooting

- **Dev server fails with spawn/permission issues on restricted environments**
  - Run with proper terminal permissions outside sandbox restrictions.
- **Large bundle warning during build**
  - Expected due to `pdfjs-dist`; optimize with dynamic imports/manual chunks if needed.
- **No text extracted from PDF**
  - File may be image-only scanned content without an OCR text layer.

## License

No license file is currently included in this repository.  
Add a `LICENSE` file if you plan to distribute this project publicly.
