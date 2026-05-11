import React, { useCallback, useRef, useState } from 'react';
import { Upload, Film, X, CheckCircle2, AlertCircle, RefreshCw, Video } from 'lucide-react';
import { uploadAssetDemoVideo } from '../api/assets';

/* ─── constants ─────────────────────────────────────────────────────────── */
const MAX_BYTES = 120 * 1024 * 1024; // 120 MB

const ACCEPTED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',       // .mov
  'video/avi',
  'video/x-msvideo',       // .avi alternate MIME
  'video/x-matroska',      // .mkv
]);

const ACCEPTED_EXT = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv']);
const ACCEPT_ATTR  = 'video/mp4,video/webm,video/quicktime,video/avi,video/x-msvideo,.mp4,.webm,.mov,.avi';
const FORMATS_DISPLAY = 'MP4, WebM, MOV, AVI';

/* ─── helpers ────────────────────────────────────────────────────────────── */
function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024)        return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function validateFile(file) {
  if (!file) return 'No file selected.';
  const ext  = `.${file.name.split('.').pop().toLowerCase()}`;
  const mime = ACCEPTED_MIME.has(file.type);
  const extOk = ACCEPTED_EXT.has(ext);
  if (!mime && !extOk)  return `Unsupported format. Accepted: ${FORMATS_DISPLAY}.`;
  if (file.size > MAX_BYTES)
    return `File is ${formatBytes(file.size)} — maximum is 120 MB.`;
  if (file.size === 0)  return 'File appears empty. Choose a valid video file.';
  return null;
}

/* ─── sub-components ─────────────────────────────────────────────────────── */
const FileCard = ({ file, onRemove }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface-muted/50">
    <Film className="w-4 h-4 text-brand-500 shrink-0" strokeWidth={1.5} />
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-[12px] font-semibold text-text-primary truncate leading-tight">
        {file.name}
      </span>
      <span className="text-[10px] text-text-muted mt-0.5">{formatBytes(file.size)}</span>
    </div>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="shrink-0 p-1 rounded hover:bg-surface-muted text-text-muted hover:text-text-primary transition-colors"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    )}
  </div>
);

const ProgressBar = ({ pct }) => (
  <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
    <div
      className="h-full rounded-full bg-brand-500 transition-all duration-150 ease-out"
      style={{ width: `${pct}%` }}
    />
  </div>
);

/* ─── main component ─────────────────────────────────────────────────────── */
/**
 * VideoUploadPanel — drag-and-drop demo video uploader for an asset.
 *
 * Props:
 *   assetId   {string}              Required. Asset ID to upload to.
 *   hasVideo  {boolean}             Whether the asset already has a video.
 *   onSuccess {(asset) => void}     Called with the updated asset from the API.
 *   className {string}              Optional extra wrapper class.
 */
const VideoUploadPanel = ({ assetId, hasVideo, onSuccess, className = '' }) => {
  const [phase, setPhase]               = useState('idle');
  // idle | selected | uploading | success | error
  const [file, setFile]                 = useState(null);
  const [validationError, setValidErr]  = useState(null);
  const [progress, setProgress]         = useState(0);
  const [errorMsg, setErrorMsg]         = useState(null);
  const [dragging, setDragging]         = useState(false);

  const inputRef    = useRef(null);
  const abortRef    = useRef(null);

  /* pick & validate */
  const pickFile = useCallback((f) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setValidErr(err);
      setFile(null);
      setPhase('idle');
      return;
    }
    setValidErr(null);
    setFile(f);
    setPhase('selected');
  }, []);

  /* drag handlers */
  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true);  }, []);
  const onDragLeave = useCallback(()  => setDragging(false), []);
  const onDrop      = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }, [pickFile]);

  /* reset back to idle */
  const reset = useCallback(() => {
    setPhase('idle');
    setFile(null);
    setValidErr(null);
    setProgress(0);
    setErrorMsg(null);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  /* upload */
  const startUpload = useCallback(async (fileToUpload = file) => {
    if (!fileToUpload || !assetId) return;
    setPhase('uploading');
    setProgress(0);
    setErrorMsg(null);
    try {
      const res = await uploadAssetDemoVideo(assetId, fileToUpload, (pct) => setProgress(pct));
      setProgress(100);
      setPhase('success');
      onSuccess?.(res.data?.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED'
          ? 'Request timed out. The file may be too large or your connection is slow.'
          : err.message) ||
        'Upload failed. Check your connection and try again.';
      setErrorMsg(msg);
      setPhase('error');
    }
  }, [assetId, file, onSuccess]);

  /* ── render ── */
  return (
    <section className={`bg-surface border border-border p-4 ${className}`}>
      {/* header */}
      <div className="flex items-center gap-1.5 mb-3">
        <Video className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          {hasVideo ? 'Replace demo video' : 'Upload demo video'}
        </h2>
      </div>

      {/* ── SUCCESS ── */}
      {phase === 'success' && (
        <div className="flex flex-col items-center gap-2 py-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" strokeWidth={1.5} />
          <p className="text-[13px] font-semibold text-text-primary">Uploaded successfully</p>
          <p className="text-[11px] text-text-muted truncate max-w-[200px]">{file?.name}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-1 text-[11px] font-medium text-brand-600 hover:underline focus-ring"
          >
            {hasVideo ? 'Upload another' : 'Replace video'}
          </button>
        </div>
      )}

      {/* ── UPLOADING ── */}
      {phase === 'uploading' && (
        <div className="flex flex-col gap-3 py-1">
          <FileCard file={file} />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Uploading to storage…</span>
              <span className="tabular-nums font-semibold text-brand-600">{progress}%</span>
            </div>
            <ProgressBar pct={progress} />
          </div>
          <p className="text-[10px] text-text-muted">
            Do not close this page until the upload completes.
          </p>
        </div>
      )}

      {/* ── ERROR ── */}
      {phase === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-px" strokeWidth={1.5} />
            <p className="text-[12px] text-red-700 leading-snug">{errorMsg}</p>
          </div>
          {file && <FileCard file={file} />}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => startUpload()}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:underline focus-ring"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={2} />
              Retry upload
            </button>
            <span className="text-text-muted text-[11px]">·</span>
            <button
              type="button"
              onClick={reset}
              className="text-[12px] text-text-muted hover:text-text-primary hover:underline focus-ring"
            >
              Choose different file
            </button>
          </div>
        </div>
      )}

      {/* ── SELECTED ── */}
      {phase === 'selected' && file && (
        <div className="flex flex-col gap-3">
          <FileCard file={file} onRemove={reset} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startUpload()}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 btn-primary text-[12px]"
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={2} />
              Upload video
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-[12px] text-text-muted hover:text-text-primary hover:underline focus-ring px-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── IDLE (drag & drop zone) ── */}
      {phase === 'idle' && (
        <div className="flex flex-col gap-2">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload demo video — drag and drop or click to browse"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={`
              flex flex-col items-center justify-center gap-2 py-7 px-4
              border-2 border-dashed rounded-lg cursor-pointer
              transition-colors duration-150 select-none outline-none
              focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
              ${dragging
                ? 'border-brand-400 bg-brand-50/60 scale-[0.995]'
                : 'border-border hover:border-brand-300 hover:bg-surface-muted/40'}
            `}
          >
            <div className={`p-2 rounded-xl transition-colors ${dragging ? 'bg-brand-100' : 'bg-surface-muted'}`}>
              <Upload
                className={`w-5 h-5 transition-colors ${dragging ? 'text-brand-500' : 'text-text-muted'}`}
                strokeWidth={1.5}
              />
            </div>
            <div className="text-center leading-snug">
              <p className="text-[12px] font-semibold text-text-primary">
                {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {FORMATS_DISPLAY} · max 120 MB
              </p>
            </div>
          </div>

          {/* validation error banner */}
          {validationError && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-px" strokeWidth={1.5} />
              <p className="text-[11px] text-red-700 leading-snug">{validationError}</p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>
      )}
    </section>
  );
};

export default VideoUploadPanel;
