const POPULATION_MANIFEST = 'assets/data/datasets.json';
const MODEL_MANIFEST_CANDIDATES = [
  'assets/data/models/manifest.json',
  'assets/data/models/datasets.json',
  'assets/data/models.json'
];

let populationManifestPromise = null;
const populationDataCache = new Map();

let modelManifestPromise = null;
const modelDataCache = new Map();

const percentilePattern = /^p(\d{1,3})(?:_(\d{1,3}))?$/i;

const typeAliases = {
  flat: ['flat', 'print', 'catalog', 'catalogue', 'commercial', 'editorial-flat', 'plane', 'plane-model', '平面', '平面模特', '平面模特兒'],
  runway: ['runway', 'catwalk', 'editorial', 'show', 'runway-model', '伸展台', '伸展台模特']
};

const rangeKeyAliases = {
  lo: ['lo', 'low', 'min', 'lower', 'lowerBound'],
  hi: ['hi', 'high', 'max', 'upper', 'upperBound'],
  avg: ['avg', 'mean', 'average'],
  sd: ['sd', 'std', 'stddev', 'stdev'],
  q1: ['q1', 'p25', 'firstQuartile'],
  q3: ['q3', 'p75', 'thirdQuartile']
};

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function collectSourceTitles(candidate) {
  if (!candidate) return [];
  if (typeof candidate === 'string') {
    const normalized = candidate.trim();
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(candidate)) {
    const titles = candidate
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') return entry.trim();
        if (typeof entry === 'object') {
          const title = entry.title ?? entry.name ?? entry.source ?? entry.label;
          return typeof title === 'string' ? title.trim() : null;
        }
        return null;
      })
      .filter((title) => title && title.length > 0);
    return titles;
  }
  if (typeof candidate === 'object') {
    const title = candidate.title ?? candidate.name ?? candidate.source ?? candidate.label;
    if (typeof title === 'string') {
      const normalized = title.trim();
      return normalized ? [normalized] : [];
    }
  }
  return [];
}

function extractMetaValue(containers, keys) {
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(container, key)) continue;
      const value = container[key];
      if (value === null || value === undefined) continue;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') return value;
    }
  }
  return null;
}

function extractSampleSize(containers) {
  const value = extractMetaValue(containers, ['n', 'N', 'sampleSize', 'sample_size', 'samples', 'sample', 'count']);
  if (value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numeric = value.replace(/[^\d.]/g, '');
    if (numeric) {
      const parsed = Number.parseFloat(numeric);
      if (Number.isFinite(parsed)) return parsed;
    }
    return value.trim();
  }
  return null;
}

function extractYear(containers) {
  const value = extractMetaValue(containers, [
    'year',
    'dataYear',
    'releaseYear',
    'publicationYear',
    'published',
    'yearRange',
    'years'
  ]);
  if (value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/\d{4}/);
    return match ? match[0] : value.trim();
  }
  return null;
}

function extractShoulderMedians(metric) {
  if (!metric || typeof metric !== 'object') {
    return { cisMale: null, cisFemale: null };
  }
  const readMedian = (section) => {
    if (section === null || section === undefined) return null;
    if (typeof section === 'number') {
      return toNumber(section);
    }
    if (typeof section !== 'object') return null;
    const direct = section.median ?? section.p50 ?? section.P50 ?? section['p_50'] ?? section.value;
    const numeric = toNumber(direct);
    if (numeric !== null) return numeric;
    return null;
  };
  const cisMale =
    readMedian(metric.cis_male) ??
    readMedian(metric.cisMale) ??
    readMedian(metric.cis?.male) ??
    readMedian(metric.cisMaleMedian) ??
    readMedian(metric.median_cis_male);
  const cisFemale =
    readMedian(metric.cis_female) ??
    readMedian(metric.cisFemale) ??
    readMedian(metric.cis?.female) ??
    readMedian(metric.cisFemaleMedian) ??
    readMedian(metric.median_cis_female);
  return { cisMale: cisMale ?? null, cisFemale: cisFemale ?? null };
}

function normalizeMetric(metric) {
  if (!metric || typeof metric !== 'object') return null;

  const rawValues = Array.isArray(metric.values)
    ? metric.values.map((item) => toNumber(item)).filter((item) => item !== null)
    : null;
  const sortedRaw = rawValues && rawValues.length > 0 ? [...rawValues].sort((a, b) => a - b) : null;

  const quantiles = [];
  Object.entries(metric).forEach(([key, value]) => {
    const match = key.match(percentilePattern);
    if (match && typeof value === 'number' && Number.isFinite(value)) {
      const major = Number.parseInt(match[1], 10);
      const minor = match[2] ? Number.parseInt(match[2], 10) : 0;
      const percentile = major + minor / 100;
      quantiles.push({ percentile, value });
    }
  });

  if (Array.isArray(metric.quantiles)) {
    metric.quantiles.forEach((entry) => {
      if (!entry) return;
      const percentile = toNumber(entry.percentile ?? entry.p ?? entry.quantile);
      const value = toNumber(entry.value);
      if (percentile !== null && value !== null) {
        quantiles.push({ percentile, value });
      }
    });
  }

  const uniqueQuantiles = [];
  const seen = new Set();
  quantiles
    .filter((item) => item.percentile !== null && item.value !== null)
    .forEach((item) => {
      const key = `${item.percentile}:${item.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueQuantiles.push(item);
      }
    });

  uniqueQuantiles.sort((a, b) => a.percentile - b.percentile);

  return {
    unit: typeof metric.unit === 'string' ? metric.unit : null,
    raw: sortedRaw,
    quantiles: uniqueQuantiles,
    cut: typeof metric.cut === 'number' && Number.isFinite(metric.cut) ? metric.cut : null,
    betterDirection:
      typeof metric.betterDirection === 'string' ? metric.betterDirection : null
  };
}

function normalizePopulationDataset(data) {
  if (!data || typeof data !== 'object') return null;
  const metrics = data.metrics && typeof data.metrics === 'object' ? data.metrics : {};
  const metaContainers = [data, data.metadata, data.meta, data.info, data.details];
  const sources = collectSourceTitles(data.source ?? data.sources ?? data.references ?? data.citations);
  const year = extractYear(metaContainers);
  const sampleSize = extractSampleSize(metaContainers);
  const shoulderMedians = extractShoulderMedians(metrics.shoulderHeightRatio);
  const normalized = {
    id: data.id ?? null,
    name: data.name ?? null,
    meta: {
      sources,
      year: year ?? null,
      sampleSize: sampleSize ?? null
    },
    metrics: {
      shoulderHeightRatio: normalizeMetric(metrics.shoulderHeightRatio),
      thighHeightRatio: normalizeMetric(metrics.thighHeightRatio),
      calfHeightRatio: normalizeMetric(metrics.calfHeightRatio),
      whtR: normalizeMetric(metrics.whtR),
      whr: normalizeMetric(metrics.whr),
      whrFemale: normalizeMetric(metrics.whrFemale),
      whrMale: normalizeMetric(metrics.whrMale)
    },
    whtRCut: metrics.whtR && typeof metrics.whtR.cut === 'number' ? metrics.whtR.cut : null,
    whrFemaleCut: metrics.whrFemale && typeof metrics.whrFemale.cut === 'number' ? metrics.whrFemale.cut : null,
    whrMaleCut: metrics.whrMale && typeof metrics.whrMale.cut === 'number' ? metrics.whrMale.cut : null,
    shoulderMedians
  };
  return normalized;
}

async function loadPopulationManifest() {
  if (!populationManifestPromise) {
    populationManifestPromise = fetch(POPULATION_MANIFEST, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('population manifest load failed');
        return response.json();
      })
      .catch((error) => {
        console.warn('Population manifest unavailable', error);
        return { datasets: [] };
      });
  }
  return populationManifestPromise;
}

async function loadModelManifest() {
  if (modelManifestPromise) return modelManifestPromise;
  modelManifestPromise = (async () => {
    for (const candidate of MODEL_MANIFEST_CANDIDATES) {
      try {
        const response = await fetch(candidate, { cache: 'no-store' });
        if (!response.ok) continue;
        const json = await response.json();
        if (Array.isArray(json.datasets)) {
          return { datasets: json.datasets };
        }
        if (Array.isArray(json.models)) {
          return { datasets: json.models };
        }
      } catch (error) {
        console.warn('Model manifest probe failed', candidate, error);
      }
    }
    return { datasets: [] };
  })();
  return modelManifestPromise;
}

export async function loadPopulationList() {
  try {
    const manifest = await loadPopulationManifest();
    if (!manifest || !Array.isArray(manifest.datasets)) return [];
    return manifest.datasets
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const { id, name, file } = item;
        if (!id || !file) return null;
        return { id, name: name ?? id, file };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('Failed to load population list', error);
    return [];
  }
}

export async function loadPopulationData(file) {
  if (!file) return null;
  if (!populationDataCache.has(file)) {
    const promise = fetch(file, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('population dataset load failed');
        return response.json();
      })
      .then((data) => normalizePopulationDataset(data))
      .catch((error) => {
        console.warn('Failed to read population dataset', file, error);
        return null;
      });
    populationDataCache.set(file, promise);
  }
  return populationDataCache.get(file);
}

export async function loadModelList() {
  try {
    const manifest = await loadModelManifest();
    if (!manifest || !Array.isArray(manifest.datasets)) return [];
    return manifest.datasets
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const id = item.id ?? item.datasetId ?? null;
        const file = item.file ?? item.path ?? null;
        if (!id || !file) return null;
        const name = item.name ?? item.title ?? id;
        const description = item.description ?? item.summary ?? null;
        const source = item.source ?? item.sources ?? null;
        const year = item.year ?? item.dataYear ?? item.releaseYear ?? null;
        const sampleSize =
          item.sampleSize ?? item.samples ?? item.sample_size ?? item.n ?? item.N ?? null;
        return { id, name, file, description, source, year, sampleSize };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('Failed to load model list', error);
    return [];
  }
}

export async function loadModelData(file) {
  if (!file) return null;
  if (!modelDataCache.has(file)) {
    const promise = fetch(file, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('model dataset load failed');
        return response.json();
      })
      .catch((error) => {
        console.warn('Failed to read model dataset', file, error);
        return null;
      });
    modelDataCache.set(file, promise);
  }
  return modelDataCache.get(file);
}

function upperBound(sorted, value) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (sorted[mid] <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

function clampPercentile(value) {
  if (!Number.isFinite(value)) return null;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Number(value);
}

function interpolatePercentile(lower, upper, target) {
  if (!lower || !upper) return null;
  if (upper.value === lower.value) {
    return (upper.percentile + lower.percentile) / 2;
  }
  const fraction = (target - lower.value) / (upper.value - lower.value);
  return lower.percentile + fraction * (upper.percentile - lower.percentile);
}

export function getPR(metric, value) {
  const numeric = toNumber(value);
  if (numeric === null || !metric) {
    return { percentile: null, rawPercentile: null, method: null };
  }

  if (Array.isArray(metric.raw) && metric.raw.length > 0) {
    const position = upperBound(metric.raw, numeric);
    const rawPercentile = (position / metric.raw.length) * 100;
    return {
      percentile: clampPercentile(rawPercentile),
      rawPercentile,
      method: 'empirical'
    };
  }

  if (Array.isArray(metric.quantiles) && metric.quantiles.length >= 2) {
    const deduped = new Map();
    metric.quantiles.forEach((entry) => {
      const percentile = toNumber(entry.percentile ?? entry.p ?? entry.quantile);
      const valueNumber = toNumber(entry.value);
      if (!Number.isFinite(percentile) || !Number.isFinite(valueNumber)) return;
      const key = valueNumber.toPrecision(12);
      const existing = deduped.get(key);
      if (!existing || percentile > existing.percentile) {
        deduped.set(key, { value: valueNumber, percentile });
      }
    });
    const points = Array.from(deduped.values()).sort((a, b) => a.value - b.value);
    if (points.length === 0) {
      return { percentile: null, rawPercentile: null, method: null };
    }
    if (points.length === 1) {
      const rawPercentile = points[0].percentile;
      return { percentile: clampPercentile(rawPercentile), rawPercentile, method: 'quantile-single' };
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    let rawPercentile = null;

    if (numeric <= firstPoint.value) {
      rawPercentile = interpolatePercentile(firstPoint, points[1], numeric);
    } else if (numeric >= lastPoint.value) {
      rawPercentile = interpolatePercentile(points[points.length - 2], lastPoint, numeric);
    } else {
      for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1];
        const current = points[i];
        if (numeric === current.value) {
          rawPercentile = current.percentile;
          break;
        }
        if (numeric === previous.value) {
          rawPercentile = previous.percentile;
          break;
        }
        if (numeric < current.value) {
          rawPercentile = interpolatePercentile(previous, current, numeric);
          break;
        }
      }
    }

    if (!Number.isFinite(rawPercentile)) {
      rawPercentile = lastPoint.percentile;
    }

    return {
      percentile: clampPercentile(rawPercentile),
      rawPercentile,
      method: 'quantile-linear'
    };
  }

  return { percentile: null, rawPercentile: null, method: null };
}

function normalizeKeyVariants(key) {
  const variants = new Set();
  if (!key) return variants;
  variants.add(key);
  variants.add(key.toLowerCase());
  variants.add(key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`));
  variants.add(key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`));
  variants.add(key.replace(/_/g, '').toLowerCase());
  return variants;
}

function extractRangeObject(candidate) {
  if (!candidate) return null;
  if (Array.isArray(candidate) && candidate.length >= 2) {
    const lo = toNumber(candidate[0]);
    const hi = toNumber(candidate[1]);
    if (lo !== null || hi !== null) {
      return { lo: lo ?? null, hi: hi ?? null };
    }
  }
  if (typeof candidate !== 'object') return null;
  const range = {};
  Object.entries(rangeKeyAliases).forEach(([normalizedKey, aliases]) => {
    aliases.forEach((alias) => {
      if (Object.prototype.hasOwnProperty.call(candidate, alias)) {
        const numeric = toNumber(candidate[alias]);
        if (numeric !== null) {
          range[normalizedKey] = numeric;
        }
      }
    });
  });
  if (Object.keys(range).length === 0) return null;
  return {
    lo: range.lo ?? null,
    hi: range.hi ?? null,
    avg: range.avg ?? null,
    sd: range.sd ?? null,
    q1: range.q1 ?? null,
    q3: range.q3 ?? null
  };
}

function searchMetricRange(modelData, typeKeys, metricVariants) {
  if (!modelData || typeof modelData !== 'object') return null;
  const containers = [modelData.ranges, modelData.metrics, modelData.groups, modelData.categories, modelData.segments, modelData.data];
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    // Type-first structure
    for (const typeKey of typeKeys) {
      const section = container[typeKey];
      if (!section || typeof section !== 'object') continue;
      if (Array.isArray(section)) {
        for (const entry of section) {
          if (!entry || typeof entry !== 'object') continue;
          for (const metricKey of metricVariants) {
            if (Object.prototype.hasOwnProperty.call(entry, metricKey)) {
              const range = extractRangeObject(entry[metricKey]);
              if (range) return range;
            }
          }
        }
      } else {
        for (const metricKey of metricVariants) {
          const candidate = section[metricKey] ?? section.metrics?.[metricKey];
          const range = extractRangeObject(candidate);
          if (range) return range;
        }
      }
    }
    // Metric-first structure
    for (const metricKey of metricVariants) {
      const entry = container[metricKey];
      if (!entry || typeof entry !== 'object') continue;
      if (Array.isArray(entry)) {
        for (const item of entry) {
          if (!item || typeof item !== 'object') continue;
          for (const typeKey of typeKeys) {
            if (Object.prototype.hasOwnProperty.call(item, typeKey)) {
              const range = extractRangeObject(item[typeKey]);
              if (range) return range;
            }
          }
        }
      } else {
        for (const typeKey of typeKeys) {
          const candidate = entry[typeKey] ?? entry[typeKey?.replace(/-/g, '_')] ?? entry[typeKey?.replace(/_/g, '-')];
          const range = extractRangeObject(candidate ?? entry.ranges?.[typeKey]);
          if (range) return range;
        }
      }
    }
  }
  return null;
}

export function getModelRange(modelData, type, metric) {
  if (!modelData || !type || !metric) return null;
  const normalizedType = typeAliases[type] ? type : type.toLowerCase();
  const typeKeys = typeAliases[normalizedType] ?? [normalizedType];
  const metricVariants = [...normalizeKeyVariants(metric)];
  const range = searchMetricRange(modelData, typeKeys, metricVariants);
  return range ?? null;
}

export function __debugResetCaches() {
  populationManifestPromise = null;
  populationDataCache.clear();
  modelManifestPromise = null;
  modelDataCache.clear();
}
