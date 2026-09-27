import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../api';

interface DistrictTelemetry {
  id: string;
  district: string;
  station: string;
  rainfallMmh: number;
  porePressureKpa: number;
  soilSaturationPct: number;
  slopeTiltDeg: number;
  factorOfSafety: number;
  recordedAt: string;
  dataKind: string;
}

interface Prediction {
  district: string;
  station: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'watch' | 'low';
  factors: string[];
}

interface PredictionJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'engine_unavailable';
  recordsCount: number;
  results: Prediction[];
  error?: string | null;
  modelVersion?: string;
  createdAt: string;
}

interface EngineStatus {
  mainEngine: string;
  aiEngine: { status: 'online' | 'offline' | 'unavailable'; details?: { modelVersion?: string } | null };
}

const riskColor: Record<Prediction['riskLevel'], string> = {
  critical: 'bg-error-container text-on-error-container',
  high: 'bg-[#ffedd5] text-[#9a3412]',
  watch: 'bg-tertiary-container text-on-tertiary-container',
  low: 'bg-[#dcfce7] text-[#166534]',
};

// This panel polls job status because inference runs in another process and may finish or fail asynchronously.
export const DistrictPredictionPanel: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictTelemetry[]>([]);
  const [jobs, setJobs] = useState<PredictionJob[]>([]);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCrashing, setIsCrashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [districtData, statusData, jobData] = await Promise.all([
          apiRequest<DistrictTelemetry[]>('/districts/telemetry'),
          apiRequest<EngineStatus>('/ai/status'),
          apiRequest<PredictionJob[]>('/ai/jobs'),
        ]);
        if (!active) return;
        setDistricts(districtData);
        setEngineStatus(statusData);
        setJobs(jobData);
        setError(null);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load district data.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    const initialLoad = window.setTimeout(() => { void loadData(); }, 0);
    const poll = window.setInterval(() => { void loadData(); }, 2500);
    return () => {
      active = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(poll);
    };
  }, []);

  const latestJob = jobs[0] ?? null;

  const submitPredictions = async () => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const job = await apiRequest<PredictionJob>('/ai/jobs', {
        method: 'POST',
        body: JSON.stringify({ records: districts }),
      });
      setJobs((current) => [job, ...current]);
      setMessage(`Sent ${job.recordsCount} district records to the separate prediction process.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not queue prediction job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const simulateCrash = async () => {
    if (!window.confirm('Stop the separate AI demo process? The main API should stay online.')) return;
    setIsCrashing(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest('/ai/engine/crash', { method: 'POST' });
      setMessage('Crash requested for the AI process only. Checking the main API separately...');
    } catch (crashError) {
      setError(crashError instanceof Error ? crashError.message : 'Could not reach the AI engine.');
    } finally {
      setIsCrashing(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5 shadow-sm" aria-labelledby="district-prediction-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">model_training</span>
            <h2 id="district-prediction-title" className="font-heading text-base font-bold text-on-surface">District Risk Prediction Lab</h2>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Backend telemetry is sent as a background job to an independent AI process.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-on-surface">Main API: {engineStatus?.mainEngine ?? 'checking'}</span>
          <span className={`rounded-full px-3 py-1 ${engineStatus?.aiEngine.status === 'online' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-error-container text-on-error-container'}`}>
            AI process: {engineStatus?.aiEngine.status ?? 'checking'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-outline-variant/60 py-3">
        <div className="text-xs text-on-surface-variant">
          {districts.length} districts • {districts[0]?.dataKind ?? 'loading source data'}
          {engineStatus?.aiEngine.details?.modelVersion && ` • ${engineStatus.aiEngine.details.modelVersion}`}
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50" disabled={isSubmitting || districts.length === 0} onClick={() => void submitPredictions()} type="button">
            {isSubmitting ? 'Queueing...' : 'Run District Predictions'}
          </button>
          <button className="rounded-full border border-error/40 px-4 py-2 text-xs font-bold text-error disabled:opacity-50" disabled={isCrashing || engineStatus?.aiEngine.status !== 'online'} onClick={() => void simulateCrash()} type="button">
            {isCrashing ? 'Requesting...' : 'Crash AI Process (Demo)'}
          </button>
        </div>
      </div>

      {(error || message) && <p role={error ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-xs ${error ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface'}`}>{error ?? message}</p>}

      <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-surface-container text-[10px] uppercase text-on-surface-variant">
            <tr>
              <th className="px-3 py-2">District / station</th>
              <th className="px-3 py-2">Rain mm/h</th>
              <th className="px-3 py-2">Pore kPa</th>
              <th className="px-3 py-2">Saturation</th>
              <th className="px-3 py-2">Tilt</th>
              <th className="px-3 py-2">FoS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {districts.map((record) => (
              <tr key={record.id}>
                <td className="px-3 py-2 font-semibold text-on-surface">{record.district}<span className="block font-normal text-on-surface-variant">{record.station}</span></td>
                <td className="px-3 py-2">{record.rainfallMmh}</td>
                <td className="px-3 py-2">{record.porePressureKpa}</td>
                <td className="px-3 py-2">{record.soilSaturationPct}%</td>
                <td className="px-3 py-2">{record.slopeTiltDeg}°</td>
                <td className="px-3 py-2">{record.factorOfSafety.toFixed(2)}</td>
              </tr>
            ))}
            {!districts.length && <tr><td className="px-3 py-5 text-center text-on-surface-variant" colSpan={6}>{isLoading ? 'Loading district telemetry...' : 'No district records available.'}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="font-bold text-on-surface">Latest job: {latestJob?.status ?? 'not run'}</div>
        {latestJob && <div className="text-on-surface-variant">Job {latestJob.id.slice(0, 8)} • {latestJob.recordsCount} districts</div>}
      </div>

      {latestJob?.status === 'completed' && (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {latestJob.results.map((prediction) => (
            <div key={`${latestJob.id}-${prediction.district}`} className="flex items-start justify-between gap-3 rounded-lg border border-outline-variant/60 bg-surface p-3">
              <div>
                <div className="text-xs font-bold text-on-surface">{prediction.district}</div>
                <div className="mt-1 text-[10px] text-on-surface-variant">{prediction.factors.join(' • ')}</div>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${riskColor[prediction.riskLevel]}`}>{prediction.riskLevel}</span>
                <div className="mt-1 font-mono text-sm font-bold text-on-surface">{prediction.riskScore}/100</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {latestJob?.status === 'engine_unavailable' && (
        <div role="status" className="rounded-lg border border-error/30 bg-error-container px-3 py-2 text-xs text-on-error-container">
          AI process failed independently: {latestJob.error || 'no response'}. Main API status: {engineStatus?.mainEngine ?? 'checking'}.
        </div>
      )}

      <p className="text-[10px] text-outline">Demo rules baseline for architecture testing only. Replace with a validated model and operational telemetry before using for real decisions.</p>
    </section>
  );
};
