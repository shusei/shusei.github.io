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

const Z5 = -1.6448536269;
const Z95 = 1.6448536269;
const Z10 = -1.2815515655;
const Z90 = 1.2815515655;
const MIN_SIGMA = 1e-6;

const shoulderHeightJointLibrary = new Map();

export function normalCdf(z) {
  if (Number.isNaN(z)) return NaN;
  if (z === Number.POSITIVE_INFINITY) return 1;
  if (z === Number.NEGATIVE_INFINITY) return 0;
  const sign = z < 0 ? -1 : 1;
  const abs = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * abs);
  const poly =
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - poly * Math.exp(-abs * abs);
  const cdf = 0.5 * (1 + sign * erf);
  return Math.max(0, Math.min(1, cdf));
}

export function normalInvCdf(p) {
  if (Number.isNaN(p)) return NaN;
  if (p <= 0) return Number.NEGATIVE_INFINITY;
  if (p >= 1) return Number.POSITIVE_INFINITY;

  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const plow = 0.02425;
  const phigh = 1 - plow;
  let q = 0;
  let r = 0;

  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  q = p - 0.5;
  r = q * q;
  return (
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

export function percentilesToNormal(qLow, q50, qHigh, zLow, zHigh) {
  const mu = Number.isFinite(q50) ? q50 : null;
  if (mu === null) return null;

  const sigmaCandidates = [];
  if (Number.isFinite(qLow) && Number.isFinite(zLow) && zLow !== 0) {
    const candidate = (mu - qLow) / (-zLow);
    if (candidate > 0) sigmaCandidates.push(candidate);
  }
  if (Number.isFinite(qHigh) && Number.isFinite(zHigh) && zHigh !== 0) {
    const candidate = (qHigh - mu) / zHigh;
    if (candidate > 0) sigmaCandidates.push(candidate);
  }

  if (sigmaCandidates.length === 0) return null;
  const sigma = sigmaCandidates.reduce((sum, value) => sum + value, 0) / sigmaCandidates.length;
  if (!(sigma > 0)) return null;
  return { mu, sigma };
}

export function conditionalParams(muH, sigmaH, muS, sigmaS, rho, h) {
  if (
    !Number.isFinite(muH) ||
    !Number.isFinite(sigmaH) ||
    sigmaH <= 0 ||
    !Number.isFinite(muS) ||
    !Number.isFinite(sigmaS) ||
    sigmaS <= 0 ||
    !Number.isFinite(rho) ||
    !Number.isFinite(h)
  ) {
    return null;
  }
  const muCond = muS + rho * (sigmaS / sigmaH) * (h - muH);
  const variance = Math.max(0, 1 - rho * rho);
  const sigmaCond = Math.max(MIN_SIGMA, sigmaS * Math.sqrt(variance));
  return { muCond, sigmaCond };
}

function detectUnit(section) {
  if (!section || typeof section !== 'object') return null;
  const unitCandidate = section.unit ?? section.units ?? null;
  if (typeof unitCandidate !== 'string') return null;
  const normalized = unitCandidate.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('millimeter') || normalized.includes('mm')) return 'mm';
  if (normalized.includes('centimeter') || normalized.includes('cm')) return 'cm';
  if (normalized.includes('meter') || normalized.includes('m ')) return 'm';
  return normalized === 'm' ? 'm' : null;
}

function toCentimeters(value, unitHint) {
  const numeric = toNumber(value);
  if (!Number.isFinite(numeric)) return null;
  if (unitHint === 'cm') return numeric;
  if (unitHint === 'mm') return numeric / 10;
  if (unitHint === 'm') return numeric * 100;
  if (numeric > 300) return numeric / 10;
  if (numeric < 3) return numeric * 100;
  return numeric;
}

function readPercentileMap(section) {
  const percentiles = new Map();
  if (!section || typeof section !== 'object') return percentiles;

  const register = (percentile, value) => {
    const numeric = toNumber(value);
    if (numeric !== null) {
      percentiles.set(percentile, numeric);
    }
  };

  Object.entries(section).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const match = key.match(percentilePattern);
    if (match) {
      const major = Number.parseInt(match[1], 10);
      const minor = match[2] ? Number.parseInt(match[2], 10) : 0;
      const percentile = major + minor / 100;
      register(percentile, value);
      return;
    }
    const normalizedKey = key.trim().toLowerCase();
    if ((normalizedKey === 'quantiles' || normalizedKey === 'percentiles') && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (!entry || typeof entry !== 'object') return;
          const percentile = toNumber(entry.percentile ?? entry.p ?? entry.quantile);
          const entryValue = entry.value ?? entry.val ?? entry.metric;
          if (percentile !== null && entryValue !== undefined) {
            register(percentile, entryValue);
          }
        });
      } else {
        Object.entries(value).forEach(([percentileKey, percentileValue]) => {
          const percentile = toNumber(percentileKey);
          if (percentile !== null) {
            register(percentile, percentileValue);
          }
        });
      }
    }
  });

  return percentiles;
}

function readNormalApproximation(section) {
  if (!section || typeof section !== 'object') return null;
  const percentiles = readPercentileMap(section);
  if (!percentiles.has(50)) return null;
  const unitHint = detectUnit(section);

  const q50 = toCentimeters(percentiles.get(50), unitHint);
  if (!Number.isFinite(q50)) return null;

  const has5 = percentiles.has(5) && percentiles.has(95);
  const has10 = percentiles.has(10) && percentiles.has(90);
  let qLow = null;
  let qHigh = null;
  let zLow = null;
  let zHigh = null;
  let percentileLow = null;
  let percentileHigh = null;

  if (has5) {
    qLow = toCentimeters(percentiles.get(5), unitHint);
    qHigh = toCentimeters(percentiles.get(95), unitHint);
    zLow = Z5;
    zHigh = Z95;
    percentileLow = 5;
    percentileHigh = 95;
  } else if (has10) {
    qLow = toCentimeters(percentiles.get(10), unitHint);
    qHigh = toCentimeters(percentiles.get(90), unitHint);
    zLow = Z10;
    zHigh = Z90;
    percentileLow = 10;
    percentileHigh = 90;
  } else {
    return null;
  }

  if (!Number.isFinite(qLow) || !Number.isFinite(qHigh)) return null;
  const normal = percentilesToNormal(qLow, q50, qHigh, zLow, zHigh);
  if (!normal) return null;

  return {
    ...normal,
    bounds: { low: qLow, high: qHigh },
    percentiles: { low: percentileLow, high: percentileHigh }
  };
}

function extractRho(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload.rho,
    payload.correlation,
    payload.correlation_rho,
    payload.correlationRho,
    payload.assumptions?.correlation_rho,
    payload.assumptions?.correlationRho,
    payload.assumptions?.rho,
    payload.assumptions?.correlation
  ];
  for (const candidate of candidates) {
    const numeric = toNumber(candidate);
    if (numeric === null) continue;
    if (!Number.isFinite(numeric)) continue;
    const clamped = Math.max(-0.999999, Math.min(0.999999, numeric));
    return clamped;
  }
  return null;
}

function genderToCohortKeys(gender) {
  if (!gender || (typeof gender !== 'string' && typeof gender !== 'number')) return [];
  const normalized = gender.toString().trim().toLowerCase();
  if (!normalized) return [];
  if (['female', 'woman', 'women', 'cisfemale', 'f'].includes(normalized)) return ['cisFemale'];
  if (['male', 'man', 'men', 'cismale', 'm'].includes(normalized)) return ['cisMale'];
  if (['nonbinary', 'non-binary', 'nb', 'enby'].includes(normalized)) return ['nonBinary'];
  if (['transfeminine', 'trans-feminine'].includes(normalized)) return ['transfeminine'];
  if (['transmasculine', 'trans-masculine'].includes(normalized)) return ['transmasculine'];
  if (['mixed', 'coed', 'all', 'combined', 'general'].includes(normalized)) return ['combined'];
  return [];
}

function determineCohortKeys(payload, datasetMeta, explicitKey) {
  const set = new Set();
  const register = (value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (trimmed) set.add(trimmed);
  };

  if (explicitKey) register(explicitKey);
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.cohortKeys)) payload.cohortKeys.forEach(register);
    register(payload.cohortKey);
    register(payload.cohort);
    register(payload.key);
    register(payload.id);
    if (payload.gender) {
      genderToCohortKeys(payload.gender).forEach(register);
    }
  }

  if (datasetMeta && typeof datasetMeta === 'object') {
    if (Array.isArray(datasetMeta.cohortKeys)) datasetMeta.cohortKeys.forEach(register);
    register(datasetMeta.cohortKey);
    if (datasetMeta.gender) {
      genderToCohortKeys(datasetMeta.gender).forEach(register);
    }
  }

  if (set.size === 0) {
    (payload?.gender ? genderToCohortKeys(payload.gender) : []).forEach(register);
  }

  if (set.size === 0) {
    register('default');
  }

  if (set.size > 1 && set.has('default')) {
    set.delete('default');
  }

  return Array.from(set);
}

function parseShoulderHeightJointEntry(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const heightSection =
    payload.height_mm ??
    payload.stature_mm ??
    payload.stature ??
    payload.height ??
    payload.heightMm ??
    payload.statureMm;
  const shoulderSection =
    payload.biacromial_mm ??
    payload.shoulder_mm ??
    payload.biacromial ??
    payload.shoulder ??
    payload.biacromialMm ??
    payload.shoulderMm ??
    payload.shoulderWidth_mm ??
    payload.shoulderWidthMm;

  const heightNormal = readNormalApproximation(heightSection);
  const shoulderNormal = readNormalApproximation(shoulderSection);
  if (!heightNormal || !shoulderNormal) return null;

  const rho = extractRho(payload);

  return {
    muHeight: heightNormal.mu,
    sigmaHeight: heightNormal.sigma,
    muShoulder: shoulderNormal.mu,
    sigmaShoulder: shoulderNormal.sigma,
    rho: rho ?? null,
    unit: 'cm',
    heightRange: heightNormal.bounds,
    shoulderRange: shoulderNormal.bounds,
    heightPercentiles: heightNormal.percentiles,
    shoulderPercentiles: shoulderNormal.percentiles
  };
}

function buildShoulderHeightJoint(metric, datasetMeta) {
  if (!metric || typeof metric !== 'object') return null;
  const computed = metric.computedFrom;
  if (!computed || typeof computed !== 'object') return null;

  const joint = {};

  const registerEntry = (payload, explicitKey) => {
    const entry = parseShoulderHeightJointEntry(payload);
    if (!entry) return;
    const keys = determineCohortKeys(payload, datasetMeta, explicitKey);
    keys.forEach((key) => {
      if (!key) return;
      joint[key] = entry;
      shoulderHeightJointLibrary.set(key, entry);
    });
  };

  if (Array.isArray(computed.cohorts)) {
    computed.cohorts.forEach((payload) => {
      if (!payload || typeof payload !== 'object') return;
      registerEntry(payload);
    });
  } else if (computed.cohorts && typeof computed.cohorts === 'object') {
    Object.entries(computed.cohorts).forEach(([key, payload]) => {
      if (!payload || typeof payload !== 'object') return;
      registerEntry(payload, key);
    });
  } else {
    registerEntry(computed);
  }

  return Object.keys(joint).length > 0 ? joint : null;
}

function attachShoulderJointToMetrics(metrics, datasetMeta) {
  if (!metrics || typeof metrics !== 'object') {
    return { metrics, joint: null };
  }
  const existing = metrics.shoulderHeightRatio;
  if (existing && typeof existing === 'object' && existing.joint) {
    return { metrics, joint: existing.joint };
  }
  const joint = buildShoulderHeightJoint(existing, datasetMeta);
  if (!joint) {
    return { metrics, joint: null };
  }
  const patchedShoulder =
    existing && typeof existing === 'object' ? { ...existing, joint } : { joint };
  const patchedMetrics = { ...metrics, shoulderHeightRatio: patchedShoulder };
  return { metrics: patchedMetrics, joint };
}

export function computeConditionalShoulder(h, s, cohortKey) {
  if (!cohortKey || typeof cohortKey !== 'string') return null;
  const params = shoulderHeightJointLibrary.get(cohortKey.trim());
  if (!params) return null;
  if (params.rho === null || !Number.isFinite(params.rho)) {
    return {
      z: null,
      pr: null,
      muCond: null,
      sigmaCond: null,
      flags: { missingRho: true }
    };
  }

  const height = toNumber(h);
  if (!Number.isFinite(height)) return null;
  const shoulder = toNumber(s);

  let workingHeight = height;
  const flags = {};
  if (params.heightRange) {
    if (Number.isFinite(params.heightRange.low) && workingHeight < params.heightRange.low) {
      workingHeight = params.heightRange.low;
      flags.heightClamped = true;
    } else if (Number.isFinite(params.heightRange.high) && workingHeight > params.heightRange.high) {
      workingHeight = params.heightRange.high;
      flags.heightClamped = true;
    }
  }

  const conditional = conditionalParams(
    params.muHeight,
    params.sigmaHeight,
    params.muShoulder,
    params.sigmaShoulder,
    params.rho,
    workingHeight
  );
  if (!conditional) return null;

  const result = {
    z: null,
    pr: null,
    muCond: conditional.muCond,
    sigmaCond: conditional.sigmaCond,
    flags
  };

  if (Number.isFinite(shoulder)) {
    const z = (shoulder - conditional.muCond) / conditional.sigmaCond;
    result.z = z;
    result.pr = normalCdf(z) * 100;
  }

  if (Object.keys(result.flags).length === 0) {
    result.flags = {};
  }

  return result;
}

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
  const metricsSource =
    data.metrics && typeof data.metrics === 'object' ? data.metrics : {};
  const { metrics, joint: shoulderHeightJoint } = attachShoulderJointToMetrics(
    metricsSource,
    data
  );
  const metaContainers = [data, data.metadata, data.meta, data.info, data.details];
  const sources = collectSourceTitles(data.source ?? data.sources ?? data.references ?? data.citations);
  const year = extractYear(metaContainers);
  const sampleSize = extractSampleSize(metaContainers);
  const shoulderMedians = extractShoulderMedians(metrics.shoulderHeightRatio);
  let shoulderHeightMetric = normalizeMetric(metrics.shoulderHeightRatio);
  if (shoulderHeightJoint) {
    if (shoulderHeightMetric) {
      shoulderHeightMetric = { ...shoulderHeightMetric, joint: shoulderHeightJoint };
    } else {
      shoulderHeightMetric = {
        unit: metrics.shoulderHeightRatio?.unit ?? null,
        raw: null,
        quantiles: [],
        cut: null,
        betterDirection: metrics.shoulderHeightRatio?.betterDirection ?? null,
        joint: shoulderHeightJoint
      };
    }
  }
  const normalized = {
    id: data.id ?? null,
    name: data.name ?? null,
    meta: {
      sources,
      year: year ?? null,
      sampleSize: sampleSize ?? null
    },
    metrics: {
      bmi: normalizeMetric(metrics.bmi),
      shoulderHeightRatio: shoulderHeightMetric,
      shoulderHipRatio: normalizeMetric(metrics.shoulderHipRatio),
      bustWaistRatio: normalizeMetric(metrics.bustWaistRatio),
      bustHeightRatio: normalizeMetric(metrics.bustHeightRatio),
      thighHeightRatio: normalizeMetric(metrics.thighHeightRatio),
      calfHeightRatio: normalizeMetric(metrics.calfHeightRatio),
      whtR: normalizeMetric(metrics.whtR),
      whr: normalizeMetric(metrics.whr),
      whrFemale: normalizeMetric(metrics.whrFemale),
      whrMale: normalizeMetric(metrics.whrMale),
      bodyFatPct: normalizeMetric(metrics.bodyFatPct)
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
      .then((data) => {
        if (!data || typeof data !== 'object' || !data.metrics || typeof data.metrics !== 'object') {
          return data;
        }
        const { metrics, joint } = attachShoulderJointToMetrics(data.metrics, data);
        if (!joint) {
          return data;
        }
        return { ...data, metrics };
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
  if (!Number.isFinite(value)) {
    return { percentile: null, clamped: null };
  }
  if (value < 0) {
    return { percentile: 0, clamped: 'low' };
  }
  if (value > 100) {
    return { percentile: 100, clamped: 'high' };
  }
  return { percentile: Number(value), clamped: null };
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
    return { percentile: null, rawPercentile: null, method: null, clamped: null };
  }

  if (Array.isArray(metric.raw) && metric.raw.length > 0) {
    const position = upperBound(metric.raw, numeric);
    const rawPercentile = (position / metric.raw.length) * 100;
    const { percentile, clamped } = clampPercentile(rawPercentile);
    return {
      percentile,
      rawPercentile,
      method: 'empirical',
      clamped
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
      return { percentile: null, rawPercentile: null, method: null, clamped: null };
    }
    if (points.length === 1) {
      const rawPercentile = points[0].percentile;
      const { percentile, clamped } = clampPercentile(rawPercentile);
      return { percentile, rawPercentile, method: 'quantile-single', clamped };
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

    const { percentile, clamped } = clampPercentile(rawPercentile);
    return {
      percentile,
      rawPercentile,
      method: 'quantile-linear',
      clamped
    };
  }

  return { percentile: null, rawPercentile: null, method: null, clamped: null };
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
  shoulderHeightJointLibrary.clear();
}
