import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  File,
  GripVertical,
  Lock,
  PenTool,
  Play,
  Plus,
  ScanLine,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useAppStore, TOOL_CONFIG } from '../store/useAppStore'
import type { PDFFile, PDFTool } from '../types'
import { processPdfTool, type ProcessingOptions } from '../lib/pdfProcessor'

interface GeneratedFile {
  id: string
  name: string
  url: string
  size: number
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  compressionLevel: 'balanced',
  password: '',
  editText: '',
  signatureName: '',
  quality: 90,
}

const MULTI_FILE_TOOLS = new Set<PDFTool>(['merge', 'organize', 'convert'])

const PROCESS_LABELS: Record<PDFTool, string> = {
  merge: 'Merge PDFs',
  split: 'Split PDF',
  compress: 'Compress PDF',
  convert: 'Convert to PDF',
  'pdf-to-jpg': 'Convert to JPG',
  organize: 'Organize PDF',
  edit: 'Apply Edit Mark',
  protect: 'Protect PDF',
  sign: 'Sign Document',
  ocr: 'Extract Text',
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export default function ToolWorkspace() {
  const {
    activeTool,
    setActiveTool,
    files,
    addFiles,
    removeFile,
    reorderFiles,
    clearFiles,
    updateFileStatus,
    addHistory,
  } = useAppStore()

  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<ProcessingOptions>(DEFAULT_OPTIONS)
  const [results, setResults] = useState<GeneratedFile[]>([])

  const config = activeTool ? TOOL_CONFIG[activeTool] : null
  const multiple = activeTool ? MULTI_FILE_TOOLS.has(activeTool) : false
  const toolUnavailable = activeTool === 'protect'

  const acceptedTypes = useMemo(() => {
    const types: Record<string, string[]> = {
      'application/pdf': ['.pdf'],
    }

    if (activeTool === 'convert') {
      types['image/png'] = ['.png']
      types['image/jpeg'] = ['.jpg', '.jpeg']
      types['image/webp'] = ['.webp']
      types['image/gif'] = ['.gif']
    }

    return types
  }, [activeTool])

  const acceptedTypeLabel = activeTool === 'convert' ? 'PDF, PNG, JPG, WEBP, GIF' : 'PDF'

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) {
        return
      }

      const chosenFiles = multiple ? acceptedFiles : [acceptedFiles[0]]
      if (!multiple) {
        clearFiles()
      }

      const newFiles: PDFFile[] = chosenFiles.map((file) => ({
        id: createId(),
        name: file.name,
        size: file.size,
        file,
        status: 'pending',
        progress: 0,
      }))

      addFiles(newFiles)
      setProcessed(false)
      setError(null)
    },
    [addFiles, clearFiles, multiple]
  )

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstMessage = rejections[0]?.errors[0]?.message ?? 'Unsupported file type.'
    setError(firstMessage)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptedTypes,
    multiple,
  })

  useEffect(() => {
    setProcessed(false)
    setProcessing(false)
    setError(null)
    setOptions(DEFAULT_OPTIONS)
    setResults([])
  }, [activeTool])

  useEffect(
    () => () => {
      for (const result of results) {
        URL.revokeObjectURL(result.url)
      }
    },
    [results]
  )

  const resetWorkspace = () => {
    clearFiles()
    setProcessed(false)
    setProcessing(false)
    setError(null)
    setOptions(DEFAULT_OPTIONS)
    setResults([])
  }

  const handleBack = () => {
    resetWorkspace()
    setActiveTool(null)
  }

  const handleProcess = async () => {
    if (!activeTool || files.length === 0 || processing) {
      return
    }

    const validationMessage = validateSelection(activeTool, files.length)
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    if (toolUnavailable) {
      setError('Password protection requires backend encryption and is disabled in this build.')
      return
    }

    setProcessing(true)
    setProcessed(false)
    setError(null)

    for (const file of files) {
      updateFileStatus(file.id, 'processing', 20)
    }

    try {
      const processedResults = await processPdfTool(activeTool, files, options)
      if (!processedResults.length) {
        throw new Error('No output file was generated.')
      }

      setResults(
        processedResults.map((item) => ({
          id: createId(),
          name: item.name,
          size: item.blob.size,
          url: URL.createObjectURL(item.blob),
        }))
      )

      for (const file of files) {
        updateFileStatus(file.id, 'done', 100)
      }

      const timestamp = new Date()
      for (const file of files) {
        addHistory({
          id: createId(),
          tool: activeTool,
          fileName: file.name,
          timestamp,
          status: 'success',
        })
      }

      setProcessed(true)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to process files.'
      setError(message)

      const timestamp = new Date()
      for (const file of files) {
        updateFileStatus(file.id, 'error', 100)
        addHistory({
          id: createId(),
          tool: activeTool,
          fileName: file.name,
          timestamp,
          status: 'error',
        })
      }
    } finally {
      setProcessing(false)
    }
  }

  if (!config || !activeTool) {
    return null
  }

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={handleBack}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{config.name}</h2>
            <p className="text-slate-400">{config.description}</p>
          </div>
          {files.length > 0 && (
            <button
              onClick={resetWorkspace}
              className="p-2 rounded-xl glass hover:bg-red-500/20 transition-colors group"
              title="Reset"
            >
              <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
            </button>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!processed ? (
            <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!files.length ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-slate-600 hover:border-violet-500 hover:bg-violet-500/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Drop files here' : 'Select files'}
                  </p>
                  <p className="text-slate-400 text-sm">or drag and drop files here</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {multiple && (
                      <span className="px-3 py-1 rounded-full glass text-xs text-slate-400">
                        Multiple files supported
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full glass text-xs text-slate-400">
                      {acceptedTypeLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Selected Files</h3>
                      <span className="text-sm text-slate-400">{files.length} file(s)</span>
                    </div>

                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                        >
                          <GripVertical className="w-4 h-4 text-slate-600" />
                          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <File className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-slate-400">
                              {formatSize(file.size)}
                              {file.status === 'processing' && ' - Processing'}
                              {file.status === 'done' && ' - Done'}
                              {file.status === 'error' && ' - Error'}
                            </p>
                          </div>

                          {(activeTool === 'merge' || activeTool === 'organize') && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => reorderFiles(index, index - 1)}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => reorderFiles(index, index + 1)}
                                disabled={index === files.length - 1}
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {multiple && (
                      <div
                        {...getRootProps()}
                        className="mt-4 p-4 border-2 border-dashed border-slate-600 rounded-xl text-center cursor-pointer hover:border-violet-500 transition-colors"
                      >
                        <input {...getInputProps()} />
                        <Plus className="w-5 h-5 mx-auto text-slate-400" />
                        <span className="text-sm text-slate-400">Add more files</span>
                      </div>
                    )}
                  </div>

                  <ToolOptions tool={activeTool} options={options} onChange={setOptions} />

                  {toolUnavailable && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Protect PDF is hidden from the main tools because this browser build cannot encrypt files.</span>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleProcess}
                    disabled={processing || toolUnavailable}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        {PROCESS_LABELS[activeTool]}
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-10 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Files Ready</h3>
              <p className="text-slate-400 mb-6">
                Generated {results.length} output file{results.length === 1 ? '' : 's'}.
              </p>

              <div className="space-y-3 mb-8 text-left max-w-2xl mx-auto">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{result.name}</p>
                      <p className="text-xs text-slate-400">{formatSize(result.size)}</p>
                    </div>
                    <button
                      onClick={() => downloadResult(result)}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {results.length > 1 && (
                  <button
                    onClick={() => results.forEach((result) => downloadResult(result))}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download All
                  </button>
                )}
                {results.length === 1 && (
                  <button
                    onClick={() => downloadResult(results[0])}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                )}
                <button
                  onClick={resetWorkspace}
                  className="px-6 py-3 rounded-xl glass hover:bg-white/10 transition-all font-semibold"
                >
                  Process Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ToolOptionsProps {
  tool: PDFTool
  options: ProcessingOptions
  onChange: (next: ProcessingOptions) => void
}

function ToolOptions({ tool, options, onChange }: ToolOptionsProps) {
  const setOption = (patch: Partial<ProcessingOptions>) => {
    onChange({ ...options, ...patch })
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold">Options</h3>
      </div>

      <div className="space-y-4">
        {tool === 'compress' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Compression Level</label>
            <div className="flex gap-2">
              {(['low', 'balanced', 'extreme'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setOption({ compressionLevel: level })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    options.compressionLevel === level ? 'bg-violet-500 text-white' : 'glass hover:bg-white/10'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {tool === 'protect' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={options.password}
                  onChange={(event) => setOption({ password: event.target.value })}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Password protection needs backend encryption support.</span>
            </div>
          </div>
        )}

        {(tool === 'convert' || tool === 'pdf-to-jpg') && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Quality</label>
            <input
              type="range"
              min="50"
              max="100"
              value={options.quality}
              onChange={(event) => setOption({ quality: Number.parseInt(event.target.value, 10) })}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-sm text-slate-400">
              <span>50%</span>
              <span>{options.quality}%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {tool === 'edit' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Edit Note</label>
            <div className="relative">
              <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={options.editText}
                onChange={(event) => setOption({ editText: event.target.value })}
                placeholder="Edited by John Doe"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {tool === 'sign' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Signer Name</label>
            <div className="relative">
              <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={options.signatureName}
                onChange={(event) => setOption({ signatureName: event.target.value })}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {tool === 'ocr' && (
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 flex items-start gap-2">
            <ScanLine className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              This mode extracts existing text from PDF pages. Image-only OCR needs an OCR backend model.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function validateSelection(tool: PDFTool, fileCount: number): string | null {
  if ((tool === 'merge' || tool === 'organize') && fileCount < 2) {
    return 'Select at least two files for this tool.'
  }

  if (tool !== 'merge' && tool !== 'organize' && tool !== 'convert' && fileCount > 1) {
    return 'This tool only supports one file at a time.'
  }

  return null
}

function downloadResult(result: GeneratedFile) {
  const anchor = document.createElement('a')
  anchor.href = result.url
  anchor.download = result.name
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
