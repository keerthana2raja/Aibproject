import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import { getFamilies } from '../api/families';
import { getCatalogMasters } from '../api/catalog';
import { createAsset, uploadAssetDemoVideo } from '../api/assets';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/ui/PageLoader';
import ErrorState from '../components/ui/ErrorState';
import Spinner from '../components/ui/Spinner';

const inputClass =
  'w-full px-2.5 py-2 border border-border text-[13px] text-text-primary bg-surface outline-none transition-colors focus:border-border-mid focus:ring-1 focus:ring-border-mid placeholder:text-text-muted';
const labelClass = 'text-[10.5px] font-bold text-text-secondary uppercase tracking-[0.6px]';

const AddCatalog = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [bootstrap, setBootstrap] = useState({ ok: false, error: null });
  const [families, setFamilies] = useState([]);
  const [clouds, setClouds] = useState([]);
  const [maturities, setMaturities] = useState([]);
  const [efforts, setEfforts] = useState([]);

  const [saving, setSaving] = useState(false);
  const [demoVideoFile, setDemoVideoFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    desc: '',
    family: '',
    clouds: [],
    maturity: 'experimental',
    effort: 'medium',
    demoReady: false,
    solution: '',
    owner: user?.name || '',
  });

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [fRes, mRes] = await Promise.all([getFamilies(), getCatalogMasters()]);
        if (c) return;
        const famRows = fRes.data?.data || [];
        const { values = [] } = mRes.data?.data || {};
        setFamilies(famRows);
        setClouds(values.filter((v) => v.typeCode === 'CLOUD'));
        setMaturities(values.filter((v) => v.typeCode === 'MATURITY'));
        setEfforts(values.filter((v) => v.typeCode === 'EFFORT'));
        setForm((prev) => ({
          ...prev,
          family: prev.family || famRows[0]?.key || '',
          owner: prev.owner || user?.name || '',
        }));
      } catch (e) {
        if (!c) setBootstrap({ ok: false, error: e.response?.data?.message || 'Failed to load catalog data.' });
        return;
      }
      if (!c) setBootstrap({ ok: true, error: null });
    })();
    return () => {
      c = true;
    };
  }, [user?.name]);

  const toggleCloud = (code) => {
    setForm((prev) => {
      const has = prev.clouds.includes(code);
      return {
        ...prev,
        clouds: has ? prev.clouds.filter((x) => x !== code) : [...prev.clouds, code],
      };
    });
  };

  const canSubmit = useMemo(
    () => form.name.trim() && form.family && form.clouds.length > 0,
    [form.name, form.family, form.clouds],
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error('Name, family, and at least one cloud are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await createAsset({
        name: form.name.trim(),
        desc: form.desc.trim(),
        family: form.family,
        clouds: form.clouds,
        maturity: form.maturity,
        effort: form.effort,
        demoReady: form.demoReady || !!demoVideoFile,
        solution: form.solution.trim(),
        owner: form.owner.trim() || undefined,
      });
      const newId = res.data?.data?.id;
      if (newId && demoVideoFile) {
        try {
          await uploadAssetDemoVideo(newId, demoVideoFile);
          toast.success('Catalog entry saved. Demo video attached.');
        } catch (upErr) {
          toast.error(
            upErr.response?.data?.message ||
              'Asset saved, but demo upload failed. Try uploading again via API or contact an admin.',
          );
          toast.success('Catalog entry saved.');
        }
      } else {
        toast.success('Catalog entry saved.');
      }
      if (newId) navigate(`/detail/${newId}`, { replace: true });
      else navigate('/catalog', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to save. Editors or admins only.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!bootstrap.ok && bootstrap.error)
    return (
      <div className="p-6 flex flex-1 items-center justify-center">
        <ErrorState message={bootstrap.error} onRetry={() => window.location.reload()} />
      </div>
    );

  if (!bootstrap.ok) return <PageLoader message="Loading catalog reference data…" />;

  const role = (user?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'editor') {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="border border-border bg-surface rounded-enterprise-md p-6 shadow-enterprise">
          <h1 className="text-[15px] font-semibold text-text-primary">Restricted</h1>
          <p className="text-[12px] text-text-muted mt-2 leading-relaxed">
            Only catalog editors can create registry assets. Contact your AIMPLIFY admin if you need access.
          </p>
          <Link to="/catalog" className="inline-flex mt-4 text-[12px] font-semibold text-brand hover:underline">
            ← Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-4 flex flex-col gap-3 flex-1 max-w-[720px] w-full mx-auto">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 border border-border bg-surface text-text-secondary hover:bg-surface-3 rounded-enterprise focus-ring"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <Layers className="w-4 h-4 text-brand" strokeWidth={1.75} aria-hidden />
        <h1 className="text-[15px] font-semibold text-text-primary">New catalog accelerator</h1>
      </div>
      <p className="text-[11px] text-text-muted -mt-1">
        Saved to the registry database. Families and taxonomy are loaded from the server.
      </p>

      <form
        onSubmit={handleSave}
        className="border border-border bg-surface rounded-enterprise-md shadow-enterprise p-4 space-y-4"
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            required
            className={`${inputClass} mt-1`}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Accelerator title"
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} mt-1 min-h-[88px] resize-y`}
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            placeholder="What it solves and primary capabilities"
          />
        </div>
        <div>
          <label className={labelClass}>Family *</label>
          <select
            required
            className={`${inputClass} mt-1`}
            value={form.family}
            onChange={(e) => setForm((f) => ({ ...f, family: e.target.value }))}
          >
            {families.map((fam) => (
              <option key={fam.key} value={fam.key}>
                {fam.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Cloud regions *</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {clouds.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleCloud(c.code)}
                className={`text-[11px] font-semibold px-2 py-1 border rounded-enterprise transition-colors ${
                  form.clouds.includes(c.code)
                    ? 'border-brand-muted-border bg-brand-muted text-brand'
                    : 'border-border bg-surface-2 text-text-secondary hover:border-border-mid'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Maturity</label>
            <select
              className={`${inputClass} mt-1`}
              value={form.maturity}
              onChange={(e) => setForm((f) => ({ ...f, maturity: e.target.value }))}
            >
              {maturities.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Effort</label>
            <select
              className={`${inputClass} mt-1`}
              value={form.effort}
              onChange={(e) => setForm((f) => ({ ...f, effort: e.target.value }))}
            >
              {efforts.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={form.demoReady}
            onChange={(e) => setForm((f) => ({ ...f, demoReady: e.target.checked }))}
            className="rounded border-border"
          />
          Demo-ready
        </label>
        <div>
          <label className={labelClass}>Demo video (optional)</label>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            className={`${inputClass} mt-1 text-[12px] file:mr-3 file:py-1 file:px-2 file:rounded-md file:border file:border-border file:bg-surface-muted file:text-[11px] file:font-semibold`}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setDemoVideoFile(f || null);
            }}
          />
          <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
            MP4, WebM, or MOV — up to ~120MB. Stored on the server and playable from the catalog.
          </p>
        </div>
        <div>
          <label className={labelClass}>Solution / program</label>
          <input
            className={`${inputClass} mt-1`}
            value={form.solution}
            onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
            placeholder="e.g. Atlas AI Ready Data Estate"
          />
        </div>
        <div>
          <label className={labelClass}>Owner</label>
          <input
            className={`${inputClass} mt-1`}
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            className="btn-primary border bg-transparent border-border text-text-secondary !shadow-none hover:bg-surface-2"
            onClick={() => navigate('/catalog')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="btn-primary inline-flex items-center gap-2 min-w-[120px] justify-center disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" color="white" /> : null}
            Save to registry
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCatalog;
