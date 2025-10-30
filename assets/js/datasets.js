import { safeNumber } from './dom.js';

let manifestCache = null;
const datasetCache = new Map();

const percentileLabels = [
  { key: 'p10', label: 'P10' },
  { key: 'p25', label: 'P25' },
  { key: 'p50', label: 'P50' },
  { key: 'p75', label: 'P75' },
  { key: 'p90', label: 'P90' }
];

export async function loadDatasetManifest() {
  if (manifestCache) return manifestCache;
  try {
    const response = await fetch('assets/data/datasets.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('manifest load failed');
    manifestCache = await response.json();
  } catch (error) {
    console.warn('Dataset manifest unavailable', error);
    manifestCache = { datasets: [] };
  }
  return manifestCache;
}

export async function loadDataset(key) {
  if (!key || key === 'off') return null;
  if (datasetCache.has(key)) return datasetCache.get(key);
  const manifest = await loadDatasetManifest();
  const entry = manifest.datasets?.find((d) => d.id === key);
  if (!entry) return null;
  try {
    const response = await fetch(entry.file, { cache: 'no-store' });
    if (!response.ok) throw new Error('dataset load failed');
    const data = await response.json();
    if (typeof window !== 'undefined' && window.DEBUG && data?.metrics) {
      Object.entries(data.metrics).forEach(([metricKey, metricValue]) => {
        if (metricValue?.diagnostic) {
          const identifier = data.id ?? entry.id ?? key;
          console.info(`[Dataset QA] ${identifier}:${metricKey}`, metricValue.diagnostic);
        }
      });
    }
    datasetCache.set(key, data);
    return data;
  } catch (error) {
    console.warn('Dataset fetch failed', error);
    return null;
  }
}

export function getPercentile(metricData, value) {
  const numeric = safeNumber(value);
  if (!Number.isFinite(numeric) || !metricData) return { label: '—', state: null, fallback: false };
  const available = percentileLabels.filter(({ key }) => typeof metricData[key] === 'number');
  if (available.length === 0) return { label: '—', state: null, fallback: false };
  const sorted = [...available].sort((a, b) => metricData[a.key] - metricData[b.key]);
  let label = sorted[0].label;
  for (const step of sorted) {
    if (numeric >= metricData[step.key]) {
      label = step.label;
    }
  }
  let state = null;
  if (metricData.cut && numeric >= metricData.cut) {
    state = 'alert';
  }
  const fallback = sorted.length === 1 && sorted[0].key === 'p50';
  if (metricData.betterDirection === 'lower') {
    const remap = {
      P10: 'P90',
      P25: 'P75',
      P50: 'P50',
      P75: 'P25',
      P90: 'P10'
    };
    label = remap[label] ?? label;
  }
  return { label, state, fallback };
}

export function getWhrCut(dataset, reference) {
  if (!dataset?.metrics) return null;
  if (reference === 'female') return dataset.metrics.whrFemale?.cut ?? null;
  if (reference === 'male') return dataset.metrics.whrMale?.cut ?? null;
  return dataset.metrics.whtR?.cut ?? null;
}
