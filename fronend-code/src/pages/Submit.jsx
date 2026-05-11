import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  ArrowRight,
  Check,
  AlertCircle,
  FolderPlus,
  Lock,
} from 'lucide-react';
import { createSubmission, uploadSubmissionDemoVideo, uploadSubmissionAttachments } from '../api/submissions';
import { getFamilies } from '../api/families';
import { getCatalogMasters } from '../api/catalog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/ui/Spinner';
import PageLoader from '../components/ui/PageLoader';
import ErrorState from '../components/ui/ErrorState';

const labelClass = 'text-[10.5px] font-bold text-text-secondary uppercase tracking-[0.6px]';

const inpErr = 'border-red-300/90 focus:border-red-400 focus:ring-red-500/20';

const FieldGroup = ({ label, children, span2, hint, inputId, error }) => (
  <div className={`flex flex-col gap-1.5${span2 ? ' col-span-1 sm:col-span-2' : ''}`}>
    <label {...(inputId ? { htmlFor: inputId } : {})} className={labelClass}>
      {label}
    </label>
    {hint ? <p className="text-2xs text-text-muted leading-snug -mt-0.5">{hint}</p> : null}
    {inputId && React.isValidElement(children)
      ? React.cloneElement(children, { id: inputId })
      : children}
    {error ? errLine(error) : null}
  </div>
);

const ReviewSection = ({ title, onEdit, children }) => (
  <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-muted/60">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-text-primary">
        <span className="icon-wrap !w-7 !h-7 !rounded-lg border-brand-200 bg-brand-50 text-brand-600">
          <Check className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
        {title}
      </div>
      <button
        type="button"
        className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 hover:underline focus-ring rounded px-1"
        onClick={onEdit}
      >
        Edit
      </button>
    </div>
    {children}
  </div>
);

const STEPS = [
  { n: 1, title: 'Basic info', sub: 'Basics, demo & attachments' },
  { n: 2, title: 'Technical', sub: 'Family, cloud & repo' },
  { n: 3, title: 'Review', sub: 'Declaration & submit' },
];

const StepDot = ({ num, current, done }) => (
  <span
    className={`w-[26px] h-[26px] flex items-center justify-center text-[10px] font-bold flex-shrink-0 rounded-full border transition-colors duration-200 ${
      done
        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
        : current
          ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-inner'
          : 'bg-surface-muted text-text-muted border-border'
    }`}
  >
    {done ? <Check className="w-3 h-3" strokeWidth={2.5} /> : num}
  </span>
);

const errLine = (msg) => (
  <span className="text-2xs text-red-700 flex items-center gap-1" role="alert">
    <AlertCircle className="w-3 h-3 shrink-0 opacity-80" />
    {msg}
  </span>
);

const Submit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [refsReady, setRefsReady] = useState(false);
  const [refsError, setRefsError] = useState(null);
  const [familyRows, setFamilyRows] = useState([]);
  const [cloudOpts, setCloudOpts] = useState([]);
  const [maturityOpts, setMaturityOpts] = useState([]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [fRes, mRes] = await Promise.all([getFamilies(), getCatalogMasters()]);
        if (c) return;
        const fams = fRes.data?.data || [];
        const vals = mRes.data?.data?.values || [];
        setFamilyRows(
          fams.map((f) => ({
            value: f.key,
            label: f.name,
            desc: f.tagline || '',
          })),
        );
        const clouds = vals.filter((v) => v.typeCode === 'CLOUD').sort((a, b) => a.sortOrder - b.sortOrder);
        const maturities = vals.filter((v) => v.typeCode === 'MATURITY').sort((a, b) => a.sortOrder - b.sortOrder);
        setCloudOpts(clouds);
        setMaturityOpts(maturities);
        const defaultCloud = clouds.find((cl) => cl.code === 'gcp')?.code || clouds[clouds.length - 1]?.code || '';
        const defaultMaturity =
          maturities.find((m) => m.code === 'experimental')?.code || maturities[maturities.length - 1]?.code || '';
        setForm((prev) => ({
          ...prev,
          cloud: prev.cloud || defaultCloud,
          maturity: prev.maturity || defaultMaturity,
        }));
      } catch (e) {
        if (!c) setRefsError(e.response?.data?.message || 'Could not load reference data.');
      } finally {
        if (!c) setRefsReady(true);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [declared, setDeclared] = useState(false);
  const [demoVideoFile, setDemoVideoFile] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    owner: user?.name || '',
    team: '',
    coContributors: '',
    version: '',
    tags: '',
    family: '',
    cloud: '',
    maturity: '',
    gitUrl: '',
    architecture: '',
    prerequisites: '',
    quickStart: '',
  });

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Accelerator name is required.';
    if (!form.description.trim()) errs.description = 'Short description is required.';
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.family) errs.family = 'Please select a platform family.';
    return errs;
  };

  const goNext = (validate, nextStep) => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = (target) => {
    if (target >= step) return;
    setErrors({});
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!declared) {
      toast.error('Please accept the declaration before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createSubmission({
        name: form.name.trim(),
        family: form.family,
        description: form.description.trim(),
        owner: form.owner.trim(),
        team: form.team.trim(),
        coContributors: form.coContributors.trim(),
        version: form.version.trim(),
        cloud: form.cloud,
        maturity: form.maturity,
        gitUrl: form.gitUrl.trim(),
        architecture: form.architecture.trim(),
        prerequisites: form.prerequisites.trim(),
        tags: form.tags.trim(),
        quickStart: form.quickStart.trim(),
      });
      const result = res.data?.data || res.data;
      const regId = result.registrationId || result.id || '';
      setSubmissionResult(result);

      if (regId && demoVideoFile) {
        try {
          await uploadSubmissionDemoVideo(regId, demoVideoFile);
        } catch (upErr) {
          toast.error(
            upErr.response?.data?.message ||
              'Submission saved, but demo upload failed. You may upload files again from Pipeline detail.',
          );
          toast.success('Accelerator submitted.');
          return;
        }
      }

      if (regId && supportingFiles.length > 0) {
        try {
          await uploadSubmissionAttachments(regId, supportingFiles);
        } catch (upErr) {
          toast.error(
            upErr.response?.data?.message ||
              'Submission saved, but one or more file uploads failed. Retry from Pipeline detail.',
          );
          toast.success('Accelerator submitted.');
          return;
        }
      }

      toast.success('Accelerator submitted successfully!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setDeclared(false);
    setErrors({});
    setSubmissionResult(null);
    setDemoVideoFile(null);
    setSupportingFiles([]);
    const defaultCloud = cloudOpts.find((cl) => cl.code === 'gcp')?.code || cloudOpts[cloudOpts.length - 1]?.code || '';
    const defaultMaturity =
      maturityOpts.find((m) => m.code === 'experimental')?.code || maturityOpts[maturityOpts.length - 1]?.code || '';
    setForm({
      name: '',
      description: '',
      owner: user?.name || '',
      team: '',
      coContributors: '',
      version: '',
      tags: '',
      family: '',
      cloud: defaultCloud,
      maturity: defaultMaturity,
      gitUrl: '',
      architecture: '',
      prerequisites: '',
      quickStart: '',
    });
  };

  if (refsError)
    return (
      <div className="p-6 flex flex-1 items-center justify-center">
        <ErrorState message={refsError} onRetry={() => window.location.reload()} />
      </div>
    );

  if (!refsReady) return <PageLoader message="Loading form options…" />;

  if (submissionResult) {
    return (
      <div className="page-wrap max-w-[640px]">
        <div className="card shadow-card overflow-hidden text-center">
          <div className="h-1 bg-gradient-to-r from-brand-500 via-emerald-500 to-brand-600" aria-hidden />
          <div className="p-8 sm:p-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-700 flex items-center justify-center mx-auto mb-5 shadow-md ring-4 ring-emerald-500/15">
              <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">Submission recorded</h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto mt-2">
              <span className="font-semibold text-text-primary">{form.name}</span> is in the approval queue. Track
              progress in the pipeline.
            </p>

            <div className="flex flex-wrap items-stretch justify-center gap-3 mt-8">
              <div className="text-left rounded-xl border border-border bg-surface-muted/50 p-4 min-w-[140px] flex-1 sm:flex-none">
                <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Registration ID</div>
                <div className="text-sm font-semibold text-text-primary font-mono tabular-nums">
                  {submissionResult.id || submissionResult.registrationId || '—'}
                </div>
              </div>
              <div className="text-left rounded-xl border border-border bg-surface-muted/50 p-4 min-w-[120px] flex-1 sm:flex-none">
                <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Status</div>
                <span className="status-pill s-review">AI review</span>
              </div>
              <div className="text-left rounded-xl border border-border bg-surface-muted/50 p-4 min-w-[120px] flex-1 sm:flex-none">
                <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Est. review</div>
                <div className="text-sm font-semibold text-text-primary">1–2 business days</div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 mt-10">
              <button type="button" onClick={resetForm} className="btn-ghost py-2.5 px-5 justify-center">
                Submit another
              </button>
              <button type="button" onClick={() => navigate('/pipeline')} className="btn-primary py-2.5 px-5 justify-center">
                Open pipeline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepLabel = (n) =>
    step === n ? 'text-brand-800 font-semibold' : step > n ? 'text-text-primary font-semibold' : 'text-text-muted font-medium';

  return (
    <div className="page-wrap max-w-[760px]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 border border-border bg-surface text-text-secondary hover:bg-surface-muted rounded-lg focus-ring shrink-0 mt-0.5"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <span className="icon-wrap !w-11 !h-11 !rounded-xl border-brand-200 bg-brand-50 text-brand-600 shrink-0 shadow-sm">
            <FolderPlus className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-[17px] font-semibold text-text-primary tracking-tight leading-snug">Submit accelerator</h1>
            <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xl">
              Three short steps. Your entry is reviewed before it can appear in the catalog. Fields marked{' '}
              <span className="text-text-secondary font-medium">*</span> are required.
            </p>
          </div>
        </div>
      </header>

      <nav className="card px-3 py-2.5 sm:px-4 sm:py-3 shadow-card" aria-label="Submission steps">
        <ol className="flex items-center w-full gap-0.5 sm:gap-1">
          {STEPS.map((s, idx) => {
            const done = step > s.n;
            const current = step === s.n;
            const canGoBack = s.n < step;
            return (
              <li key={s.n} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => jumpToStep(s.n)}
                    disabled={!canGoBack}
                    title={canGoBack ? `Go back to ${s.title}` : undefined}
                    className={`flex flex-col items-center gap-0.5 w-full max-w-[112px] mx-auto focus-ring rounded-lg py-1 -my-1 transition-opacity ${
                      canGoBack ? 'cursor-pointer hover:bg-surface-muted/80 opacity-100' : 'cursor-default opacity-100'
                    } ${current ? 'ring-1 ring-brand-400/35 ring-offset-1 ring-offset-surface rounded-lg' : ''}`}
                  >
                    <StepDot num={s.n} current={current} done={done} />
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight ${stepLabel(s.n)}`}>
                      {s.title}
                    </span>
                    <span className="text-[10px] text-text-muted text-center leading-tight hidden sm:block line-clamp-2 px-0.5">
                      {s.sub}
                    </span>
                  </button>
                </div>
                {idx < STEPS.length - 1 ? (
                  <div
                    className={`hidden sm:block self-center h-0.5 flex-1 max-w-[20px] lg:max-w-8 mx-0.5 shrink-0 rounded-full ${
                      step > s.n ? 'bg-brand-500' : 'bg-border'
                    }`}
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 1 && (
        <section className="card shadow-card overflow-hidden" aria-labelledby="submit-step1-title">
          <div className="card-header border-0 border-b border-border">
            <div>
              <h2 id="submit-step1-title" className="text-sm font-semibold text-text-primary">
                Basic information
              </h2>
              <p className="text-2xs text-text-muted font-normal normal-case mt-0.5 tracking-normal">
                How this accelerator will appear to reviewers.
              </p>
            </div>
            <span className="pill ml-auto">Step 1 of 3</span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Accelerator name *" span2 inputId="sub-name" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Invoice extraction agent"
                  className={`inp ${errors.name ? inpErr : ''}`}
                  autoComplete="off"
                />
              </FieldGroup>

              <FieldGroup
                label="Short description *"
                span2
                inputId="sub-desc"
                hint="One or two sentences: outcome, main integration, who it is for."
                error={errors.description}
              >
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="What it does and which business problem it solves."
                  rows={4}
                  className={`inp resize-y min-h-[100px] leading-relaxed ${errors.description ? inpErr : ''}`}
                />
              </FieldGroup>

              <FieldGroup label="Owner / author" inputId="sub-owner">
                <input
                  type="text"
                  value={form.owner}
                  onChange={set('owner')}
                  placeholder="Your name"
                  className="inp"
                  autoComplete="name"
                />
              </FieldGroup>

              <FieldGroup label="Team / department" inputId="sub-team">
                <input
                  type="text"
                  value={form.team}
                  onChange={set('team')}
                  placeholder="e.g. Data & AI CoE"
                  className="inp"
                />
              </FieldGroup>

              <FieldGroup label="Co-contributors" inputId="sub-cocontrib" hint="Optional. Comma-separated names.">
                <input
                  type="text"
                  value={form.coContributors}
                  onChange={set('coContributors')}
                  placeholder="Names, comma-separated"
                  className="inp"
                />
              </FieldGroup>

              <FieldGroup label="Version" inputId="sub-version">
                <input type="text" value={form.version} onChange={set('version')} placeholder="e.g. 1.0.0" className="inp" />
              </FieldGroup>

              <FieldGroup label="Tags" span2 inputId="sub-tags" hint="Comma-separated keywords for search and routing.">
                <input
                  type="text"
                  value={form.tags}
                  onChange={set('tags')}
                  placeholder="e.g. ETL, GCP, automation"
                  className="inp"
                />
              </FieldGroup>
            </div>

            <div className="rounded-xl border-2 border-brand-200 bg-gradient-to-b from-brand-50/95 to-white p-4 sm:p-5 mt-6 space-y-4 shadow-sm ring-1 ring-brand-100/60">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-600 shadow-sm">
                  <UploadCloud className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">Demo video, documents &amp; quick start</h3>
                  <p className="text-2xs text-text-muted mt-1 leading-relaxed">
                    Attach materials now so reviewers and the eventual catalog listing show commands and downloadable files —
                    optional, but encouraged.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-brand-100/70">
                <div>
                  <label className={labelClass}>Demo video</label>
                  <p className="text-2xs text-text-muted mt-0.5 mb-2 leading-relaxed">MP4, WebM, MOV — playable from the catalog.</p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    className="inp text-[12px] file:mr-3 file:py-1 file:px-2 file:rounded-md file:border file:border-border file:bg-surface-muted file:text-[11px] file:font-semibold"
                    onChange={(e) => setDemoVideoFile(e.target.files?.[0] || null)}
                  />
                  {demoVideoFile ? (
                    <p className="text-2xs text-brand-800 font-medium mt-1.5 truncate" title={demoVideoFile.name}>
                      Selected: {demoVideoFile.name}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className={labelClass}>Supporting files</label>
                  <p className="text-2xs text-text-muted mt-0.5 mb-2 leading-relaxed">PDFs, YAML, docs — multiple files.</p>
                  <input
                    type="file"
                    multiple
                    className="inp text-[12px] file:mr-3 file:py-1 file:px-2 file:rounded-md file:border file:border-border file:bg-surface-muted file:text-[11px] file:font-semibold"
                    onChange={(e) => setSupportingFiles(e.target.files ? [...e.target.files] : [])}
                  />
                  {supportingFiles.length > 0 ? (
                    <p className="text-2xs text-brand-800 font-medium mt-1.5">{supportingFiles.length} file(s) selected</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="sub-quickstart" className={labelClass}>
                  Quick start commands
                </label>
                <p className="text-2xs text-text-muted mt-0.5 mb-2 leading-relaxed">
                  Shell steps (e.g. <code className="text-[10px] bg-surface-muted px-1 rounded">cd</code>,{' '}
                  <code className="text-[10px] bg-surface-muted px-1 rounded">pip install</code>) — shown in a terminal-style block on the asset after approval.
                </p>
                <textarea
                  id="sub-quickstart"
                  value={form.quickStart}
                  onChange={set('quickStart')}
                  placeholder={'# Install dependencies\ncd my-accelerator\npip install -r requirements.txt'}
                  rows={7}
                  className="inp resize-y min-h-[120px] font-mono text-[12px] leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 mt-6 border-t border-border">
              <button type="button" className="btn-ghost justify-center sm:justify-start" onClick={() => navigate('/catalog')}>
                <ArrowLeft className="w-3.5 h-3.5" />
                Cancel
              </button>
              <div className="flex items-center justify-end gap-3">
                <span className="text-2xs text-text-muted tabular-nums hidden sm:inline">1 / 3</span>
                <button type="button" className="btn-primary" onClick={() => goNext(validateStep1, 2)}>
                  Continue
                  <ArrowRight className="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card shadow-card overflow-hidden" aria-labelledby="submit-step2-title">
          <div className="card-header border-0 border-b border-border">
            <div>
              <h2 id="submit-step2-title" className="text-sm font-semibold text-text-primary">
                Technical details
              </h2>
              <p className="text-2xs text-text-muted font-normal normal-case mt-0.5 tracking-normal">
                Platform alignment and where the code lives.
              </p>
            </div>
            <span className="pill ml-auto">Step 2 of 3</span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Platform family *" span2 error={errors.family}>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {familyRows.map((f) => {
                    const active = form.family === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, family: f.value }));
                          setErrors((e) => ({ ...e, family: '' }));
                        }}
                        className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-150 focus-ring ${
                          active
                            ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-400/30 shadow-sm'
                            : 'border-border bg-surface-muted/30 hover:border-border-strong hover:bg-surface-muted/60'
                        }`}
                      >
                        {active ? (
                          <span className="absolute top-2 right-2 text-brand-600" aria-hidden>
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          </span>
                        ) : null}
                        <span className="text-[12.5px] font-semibold text-text-primary pr-5">{f.label}</span>
                        {f.desc ? <span className="text-2xs text-text-muted leading-snug line-clamp-2">{f.desc}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>

              <FieldGroup label="Cloud platform" inputId="sub-cloud">
                <select value={form.cloud} onChange={set('cloud')} className="inp cursor-pointer">
                  {cloudOpts.map((cl) => (
                    <option key={cl.code} value={cl.code}>
                      {cl.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Maturity stage" inputId="sub-maturity">
                <select value={form.maturity} onChange={set('maturity')} className="inp cursor-pointer">
                  {maturityOpts.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup
                label="Git repository URL"
                span2
                inputId="sub-git"
                hint="HTTPS link to the canonical repo; optional but speeds up review."
              >
                <input
                  type="url"
                  value={form.gitUrl}
                  onChange={set('gitUrl')}
                  placeholder="https://github.com/org/repository"
                  className="inp font-mono text-[13px]"
                />
              </FieldGroup>

              <FieldGroup label="Architecture overview" span2 inputId="sub-arch">
                <textarea
                  value={form.architecture}
                  onChange={set('architecture')}
                  placeholder="Main components, data flow, and key services."
                  rows={4}
                  className="inp resize-y min-h-[88px] leading-relaxed"
                />
              </FieldGroup>

              <FieldGroup label="Prerequisites & dependencies" span2 inputId="sub-prereq">
                <textarea
                  value={form.prerequisites}
                  onChange={set('prerequisites')}
                  placeholder="APIs, secrets, infra, or datasets required to run."
                  rows={4}
                  className="inp resize-y min-h-[88px] leading-relaxed"
                />
              </FieldGroup>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 mt-6 border-t border-border">
              <button type="button" className="btn-ghost justify-center sm:justify-start" onClick={() => setStep(1)}>
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="flex items-center justify-end gap-3">
                <span className="text-2xs text-text-muted tabular-nums hidden sm:inline">2 / 3</span>
                <button type="button" className="btn-primary" onClick={() => goNext(validateStep2, 3)}>
                  Review
                  <ArrowRight className="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="card shadow-card overflow-hidden" aria-labelledby="submit-step3-title">
          <div className="card-header border-0 border-b border-border">
            <div>
              <h2 id="submit-step3-title" className="text-sm font-semibold text-text-primary">
                Review & submit
              </h2>
              <p className="text-2xs text-text-muted font-normal normal-case mt-0.5 tracking-normal">
                Confirm details and accept the declaration to send to the queue.
              </p>
            </div>
            <span className="pill ml-auto">Step 3 of 3</span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 mb-6">
              <ReviewSection title="Basic info" onEdit={() => setStep(1)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3.5 sm:border-r border-b sm:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Name</div>
                    <div className="text-sm font-semibold text-text-primary">{form.name || '—'}</div>
                  </div>
                  <div className="p-3.5 lg:border-r border-b lg:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Owner</div>
                    <div className="text-sm font-semibold text-text-primary">{form.owner || '—'}</div>
                  </div>
                  <div className="p-3.5 sm:border-r border-b sm:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Version</div>
                    <div className="text-sm font-semibold text-text-primary">{form.version || '—'}</div>
                  </div>
                  <div className="p-3.5">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Tags</div>
                    <div className="flex gap-1 flex-wrap min-h-[22px]">
                      {form.tags ? (
                        form.tags
                          .split(',')
                          .filter(Boolean)
                          .map((t, i) => (
                            <span key={i} className="text-2xs px-2 py-0.5 rounded-md bg-surface-muted border border-border text-text-secondary">
                              {t.trim()}
                            </span>
                          ))
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-3.5 border-t border-border bg-surface-muted/20">
                  <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Description</div>
                  <div className="text-sm text-text-secondary leading-relaxed">{form.description || '—'}</div>
                </div>
              </ReviewSection>

              <ReviewSection title="Technical details" onEdit={() => setStep(2)}>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  <div className="p-3.5 sm:border-r border-b sm:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Family</div>
                    <div className="text-sm font-semibold text-text-primary">
                      {familyRows.find((f) => f.value === form.family)?.label || form.family || '—'}
                    </div>
                  </div>
                  <div className="p-3.5 sm:border-r border-b sm:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Cloud</div>
                    <div className="text-sm font-semibold text-text-primary">
                      {cloudOpts.find((x) => x.code === form.cloud)?.label || form.cloud}
                    </div>
                  </div>
                  <div className="p-3.5 border-b sm:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Maturity</div>
                    <div className="text-sm font-semibold text-text-primary">
                      {maturityOpts.find((x) => x.code === form.maturity)?.label || form.maturity}
                    </div>
                  </div>
                </div>
                {form.gitUrl ? (
                  <div className="p-3.5 border-t border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Git repository</div>
                    <a
                      href={form.gitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-brand-700 hover:underline break-all"
                    >
                      {form.gitUrl}
                    </a>
                  </div>
                ) : null}
              </ReviewSection>

              <ReviewSection title="Demo, files & quick start" onEdit={() => setStep(1)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  <div className="p-3.5 sm:border-r border-b sm:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Demo video</div>
                    <div className="text-sm text-text-primary">{demoVideoFile ? demoVideoFile.name : 'None selected'}</div>
                  </div>
                  <div className="p-3.5 border-b sm:border-b-0 border-border">
                    <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Supporting files</div>
                    <div className="text-sm text-text-primary">
                      {supportingFiles.length > 0 ? `${supportingFiles.length} file(s) selected` : 'None selected'}
                    </div>
                  </div>
                </div>
                <div className="p-3.5 border-t border-border bg-surface-muted/20">
                  <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-1">Quick start</div>
                  <div className="text-sm text-text-secondary font-mono whitespace-pre-wrap break-words max-h-24 overflow-y-auto leading-relaxed">
                    {form.quickStart?.trim()
                      ? form.quickStart.trim()
                      : '—'}
                  </div>
                </div>
              </ReviewSection>
            </div>

            <div className="rounded-xl border border-brand-200/80 bg-brand-50/50 p-4 sm:p-5 mb-2">
              <div className="flex gap-3">
                <span className="icon-wrap !w-9 !h-9 !rounded-lg shrink-0 border-brand-200 bg-white text-brand-600">
                  <Lock className="w-4 h-4" strokeWidth={1.75} />
                </span>
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  <input
                    type="checkbox"
                    id="declare"
                    checked={declared}
                    onChange={(e) => setDeclared(e.target.checked)}
                    className="w-4 h-4 mt-0.5 cursor-pointer accent-brand-600 rounded border-border-strong shrink-0"
                  />
                  <label htmlFor="declare" className="text-xs text-text-secondary leading-relaxed cursor-pointer select-none text-left">
                    I confirm this accelerator complies with organizational IP and security guidelines and may be reviewed
                    before publication in the catalog.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-border">
              <button
                type="button"
                className="btn-ghost justify-center sm:justify-start"
                onClick={() => setStep(2)}
                disabled={submitting}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="flex items-center justify-end gap-3">
                <span className="text-2xs text-text-muted tabular-nums hidden sm:inline">3 / 3</span>
                <button type="button" className="btn-primary min-w-[124px]" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner size="sm" color="white" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Check className="w-[15px] h-[15px]" /> Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Submit;
