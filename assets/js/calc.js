import { qs, qsa, createEl, safeNumber, formatRatio, formatBadge } from './dom.js';
import { loadDatasetManifest, loadDataset, getPercentile } from './datasets.js';
import {
  loadPopulationList,
  loadPopulationData,
  getPR as getPopulationPR,
  loadModelList,
  loadModelData,
  getModelRange as resolveModelRange
} from './datasets.adapter.js';

const STORAGE_KEY = 'calc:formValues';
const POPULATION_STORAGE_KEY = 'calc:populationDatasetId';
const MODEL_STORAGE_KEY = 'calc:modelDatasetId';

const metrics = [
  {
    key: 'bmi',
    label: 'BMI',
    compute: ({ height, weight }) => {
      const h = safeNumber(height) / 100;
      const w = safeNumber(weight);
      if (!Number.isFinite(h) || h === 0 || !Number.isFinite(w)) return NaN;
      return w / (h * h);
    },
    formatter: (value) => formatRatio(value, 1),
    requirements: ['height', 'weight'],
    percentileKey: 'bmi'
  },
  {
    key: 'whtR',
    label: '腰高比 (WHtR)',
    compute: ({ height, waist }) => {
      const h = safeNumber(height);
      const w = safeNumber(waist);
      if (!Number.isFinite(h) || h === 0 || !Number.isFinite(w)) return NaN;
      return w / h;
    },
    formatter: formatRatio,
    requirements: ['height', 'waist'],
    percentileKey: 'whtR'
  },
  {
    key: 'whr',
    label: '腰臀比 (WHR)',
    compute: ({ waist, hip }) => {
      const w = safeNumber(waist);
      const h = safeNumber(hip);
      if (!Number.isFinite(w) || !Number.isFinite(h) || h === 0) return NaN;
      return w / h;
    },
    formatter: formatRatio,
    requirements: ['waist', 'hip'],
    percentileKey: 'whr'
  },
  {
    key: 'thighHeight',
    label: '大腿/身高',
    compute: ({ thigh, height }) => {
      const t = safeNumber(thigh);
      const h = safeNumber(height);
      if (!Number.isFinite(t) || !Number.isFinite(h) || h === 0) return NaN;
      return t / h;
    },
    formatter: formatRatio,
    requirements: ['thigh', 'height'],
    percentileKey: 'thighHeightRatio'
  },
  {
    key: 'calfHeight',
    label: '小腿/身高',
    compute: ({ calf, height }) => {
      const c = safeNumber(calf);
      const h = safeNumber(height);
      if (!Number.isFinite(c) || !Number.isFinite(h) || h === 0) return NaN;
      return c / h;
    },
    formatter: formatRatio,
    requirements: ['calf', 'height'],
    percentileKey: 'calfHeightRatio'
  },
  {
    key: 'shoulderHeight',
    label: '肩/身高 (SHtR)',
    compute: ({ shoulder, height }) => {
      const s = safeNumber(shoulder);
      const h = safeNumber(height);
      if (!Number.isFinite(s) || !Number.isFinite(h) || h === 0) return NaN;
      return s / h;
    },
    formatter: formatRatio,
    requirements: ['shoulder', 'height'],
    percentileKey: 'shoulderHeightRatio'
  },
  {
    key: 'shoulderHip',
    label: '肩/臀 (SHR)',
    compute: ({ shoulder, hip }) => {
      const s = safeNumber(shoulder);
      const h = safeNumber(hip);
      if (!Number.isFinite(s) || !Number.isFinite(h) || h === 0) return NaN;
      return s / h;
    },
    formatter: formatRatio,
    requirements: ['shoulder', 'hip'],
    percentileKey: 'shoulderHipRatio'
  },
  {
    key: 'bustWaist',
    label: '胸/腰 (BWR)',
    compute: ({ bust, waist }) => {
      const b = safeNumber(bust);
      const w = safeNumber(waist);
      if (!Number.isFinite(b) || !Number.isFinite(w) || w === 0) return NaN;
      return b / w;
    },
    formatter: formatRatio,
    requirements: ['bust', 'waist'],
    percentileKey: 'bustWaistRatio'
  },
  {
    key: 'bustHeight',
    label: '胸/身高',
    compute: ({ bust, height }) => {
      const b = safeNumber(bust);
      const h = safeNumber(height);
      if (!Number.isFinite(b) || !Number.isFinite(h) || h === 0) return NaN;
      return b / h;
    },
    formatter: formatRatio,
    requirements: ['bust', 'height'],
    percentileKey: 'bustHeightRatio'
  },
  {
    key: 'bodyfat',
    label: '體脂 %',
    compute: ({ bodyfat }) => {
      const bf = safeNumber(bodyfat);
      return Number.isFinite(bf) ? bf : NaN;
    },
    formatter: (value) => (Number.isFinite(value) ? `${value.toFixed(1)}%` : ''),
    requirements: ['bodyfat'],
    percentileKey: 'bodyFatPct'
  }
];

const datasetInfoHighlights = [
  { key: 'shoulderHeightRatio', label: '肩/身高' },
  { key: 'whtR', label: '腰高比' },
  { key: 'whr', label: '腰臀比' },
  { key: 'bmi', label: 'BMI' },
  { key: 'thighHeightRatio', label: '大腿/身高' }
];

const referenceNotes = {
  neutral: '參考口徑：中性資料，建議維持彈性範圍。',
  female: '參考口徑：女性向資料，僅供趨勢對照。',
  male: '參考口徑：男性向資料，僅供趨勢對照。'
};

const whrReferenceNotes = {
  neutral: '建議留意 0.9 以下的彈性空間。',
  female: '建議留意 0.85 以下的彈性空間。',
  male: '建議留意 0.9 以下的彈性空間。'
};

const bmiGuidelines = {
  neutral: { underweight: 18.5, asianRisk: 23, overweight: 25, obesity: 30 },
  female: { underweight: 18.5, asianRisk: 23, overweight: 25, obesity: 30 },
  male: { underweight: 18.5, asianRisk: 23, overweight: 25, obesity: 30 }
};

const bodyFatGuidelines = {
  neutral: { low: 15, optimalHi: 28, caution: 33 },
  female: { low: 20, optimalHi: 32, caution: 38 },
  male: { low: 10, optimalHi: 25, caution: 30 }
};

const suggestionRules = [
  {
    id: 'whtR',
    test: (results) => Number.isFinite(results.whtR) && results.whtR >= 0.5,
    message: '腰高比偏高，可回顧「瘦腰」與「飲食節奏」。',
    links: [
      { href: '#瘦腰', text: '瘦腰' },
      { href: '#飲食', text: '飲食節奏' }
    ]
  },
  {
    id: 'shoulderShape',
    test: (results) => (Number.isFinite(results.shoulderHip) && results.shoulderHip > 1) || (Number.isFinite(results.shoulderHeight) && results.shoulderHeight > 0.29),
    message: '肩線比例較高，可檢視「倒三角上身」與「穿搭（上深下亮 / A 字裙）」。',
    links: [
      { href: '#倒三角上身', text: '倒三角上身' },
      { href: '#穿搭（上深下亮 / A 字裙）', text: '穿搭（上深下亮 / A 字裙）' }
    ]
  },
  {
    id: 'thighRatio',
    test: (results, context) => {
      if (context?.thighPercent?.label && ['P75', 'P90'].includes(context.thighPercent.label)) return true;
      return Number.isFinite(results.thighHeight) && results.thighHeight > 0.32;
    },
    message: '腿圍比例較高，可複習「瘦腿」「有氧策略」與「絲襪尺寸」。',
    links: [
      { href: '#瘦腿', text: '瘦腿' },
      { href: '#style', text: '有氧策略' },
      { href: '#絲襪尺寸', text: '絲襪尺寸' }
    ]
  },
  {
    id: 'heelNewbie',
    test: (_results, _context, formValues) => formValues.heelLevel === 'beginner',
    message: '若為高跟鞋初學者，可參考「高跟鞋四週訓練」。',
    links: [{ href: '#高跟鞋四週訓練', text: '高跟鞋四週訓練' }]
  }
];

function describePercentiles(metricData) {
  if (!metricData) return { summary: null, fallback: false };
  const keys = ['p10', 'p25', 'p50', 'p75', 'p90'];
  const available = keys.filter((key) => typeof metricData[key] === 'number');
  if (available.length === 0) return { summary: null, fallback: false };
  const summary = available
    .map((key) => `${key.toUpperCase()} ${metricData[key].toFixed(3)}`)
    .join(' · ');
  const fallback = available.length === 1 && available[0] === 'p50';
  return { summary, fallback };
}

function describePopulationPercentiles(metric) {
  if (!metric || !Array.isArray(metric.quantiles) || metric.quantiles.length === 0) {
    return { summary: null, fallback: false };
  }
  const preferred = new Map();
  metric.quantiles.forEach((entry) => {
    if (!Number.isFinite(entry.percentile) || !Number.isFinite(entry.value)) return;
    const rounded = Math.round(entry.percentile);
    if (preferred.has(rounded)) return;
    if ([10, 25, 50, 75, 90].includes(rounded)) {
      preferred.set(rounded, entry.value);
    }
  });
  let summaryParts = [];
  if (preferred.size > 0) {
    summaryParts = [...preferred.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([percentile, value]) => `P${percentile} ${value.toFixed(3)}`);
    const fallback = summaryParts.length === 1 && summaryParts[0].startsWith('P50');
    return { summary: summaryParts.join(' · '), fallback };
  }
  const first = metric.quantiles.find(
    (entry) => Number.isFinite(entry.percentile) && Number.isFinite(entry.value)
  );
  if (!first) return { summary: null, fallback: false };
  const label = `P${Math.round(first.percentile)} ${first.value.toFixed(3)}`;
  return { summary: label, fallback: Math.round(first.percentile) === 50 };
}

function addNoteSegment(segments, text) {
  if (!text) return;
  if (!segments.includes(text)) {
    segments.push(text);
  }
}

function formatRangeValue(value, formatter) {
  if (!Number.isFinite(value)) return null;
  if (typeof formatter === 'function') {
    const formatted = formatter(value);
    if (formatted !== null && formatted !== undefined && formatted !== '') {
      return formatted;
    }
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(3);
}

function formatModelRange(range, formatter) {
  if (!range) return '—';
  const loText = formatRangeValue(range.lo, formatter);
  const hiText = formatRangeValue(range.hi, formatter);
  if (loText && hiText) return `${loText}–${hiText}`;
  if (loText) return `≥${loText}`;
  if (hiText) return `≤${hiText}`;
  const q1Text = formatRangeValue(range.q1, formatter);
  const q3Text = formatRangeValue(range.q3, formatter);
  if (q1Text && q3Text) return `${q1Text}–${q3Text}`;
  if (q1Text) return `Q1 ${q1Text}`;
  if (q3Text) return `Q3 ${q3Text}`;
  return '—';
}

function projectDisplayPercentile(percentile, betterDirection) {
  if (!Number.isFinite(percentile)) return null;
  const bounded = Math.max(0, Math.min(100, percentile));
  if (typeof betterDirection === 'string' && betterDirection.toLowerCase() === 'lower') {
    return Math.max(0, Math.min(100, 100 - bounded));
  }
  return bounded;
}

function formatPrDisplay(value, clamped) {
  if (clamped === 'low') return '＜P1（資料範圍外）';
  if (clamped === 'high') return '＞P99（資料範圍外）';
  if (!Number.isFinite(value)) return '—';
  const bounded = Math.max(0, Math.min(100, value));
  return `贏過 ${Math.round(bounded)}%（PR）`;
}

function evaluateModelDeviation(value, range, label) {
  if (!range || !Number.isFinite(value)) return null;
  const below = Number.isFinite(range.lo) && value < range.lo;
  const above = Number.isFinite(range.hi) && value > range.hi;
  if (!below && !above) return null;
  if (Number.isFinite(range.avg) && range.avg !== 0) {
    const delta = ((value - range.avg) / range.avg) * 100;
    if (Number.isFinite(delta)) {
      const direction = delta >= 0 ? '高於' : '低於';
      return `${label}平均${direction} ${Math.abs(delta).toFixed(1)}%`;
    }
  }
  return `${label}範圍外`;
}

function renderDatasetInfo(element, dataset, populationEntry, populationData) {
  if (!element) return;
  const segments = [];
  if (populationEntry) {
    let message = `一般人群 PR 基準：${populationEntry.name}`;
    if (populationData) {
      const metric = populationData.metrics?.shoulderHeightRatio;
      const { summary, fallback } = describePopulationPercentiles(metric);
      if (summary) {
        message += ` ｜ 肩/身高百分位 ${summary}`;
        if (fallback) {
          message += ' （僅提供中位參考）';
        }
      } else {
        message += ' ｜ 尚未提供肩/身高百分位資料';
      }
    }
    segments.push({ text: message });
  }
  if (dataset) {
    const name = dataset.name || dataset.id || '—';
    const highlights = datasetInfoHighlights.map(({ key, label }) => {
      const metricData = dataset.metrics?.[key];
      if (!metricData) {
        return { label: `${label}（無）`, status: 'missing' };
      }
      const { summary, fallback } = describePercentiles(metricData);
      if (!summary) {
        return { label: `${label}（無）`, status: 'missing' };
      }
      if (fallback) {
        return { label: `${label}（僅中位）`, status: 'fallback' };
      }
      return { label, status: 'available' };
    });
    segments.push({ text: `資料集：${name}`, highlights });
  } else {
    segments.push({ text: '資料集：未選擇或載入失敗（僅顯示一般人群 PR）' });
  }
  if (segments.length === 0) {
    element.textContent = '';
    element.hidden = true;
    return;
  }
  const fragment = document.createDocumentFragment();
  segments.forEach((segment, index) => {
    if (index > 0) {
      fragment.appendChild(document.createTextNode(' ｜ '));
    }
    const segmentEl = createEl('span', { className: 'dataset-info-segment' });
    segmentEl.appendChild(document.createTextNode(segment.text));
    if (Array.isArray(segment.highlights) && segment.highlights.length > 0) {
      segmentEl.appendChild(document.createTextNode('：'));
      const listEl = createEl('span', { className: 'dataset-info-metrics' });
      segment.highlights.forEach(({ label, status }) => {
        const className = ['dataset-info-chip', status ? `is-${status}` : null]
          .filter(Boolean)
          .join(' ');
        const chip = createEl('span', { className, text: label });
        listEl.appendChild(chip);
      });
      segmentEl.appendChild(document.createTextNode(' '));
      segmentEl.appendChild(listEl);
    }
    fragment.appendChild(segmentEl);
  });
  element.replaceChildren(fragment);
  element.hidden = false;
}

function persistFormValues(values) {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  try {
    const serialized = JSON.stringify(values);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('Failed to persist form values', error);
    return false;
  }
}

function restoreFormValues() {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (error) {
    console.error('Failed to restore form values', error);
    return null;
  }
}

function applyFormValues(form, values) {
  if (!values) return;
  qsa('input, select', form).forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(values, field.name)) {
      const storedValue = values[field.name];
      if (typeof storedValue === 'string') {
        if (field.tagName === 'SELECT') {
          const option = qsa('option', field).find((item) => item.value === storedValue);
          if (option) {
            field.value = storedValue;
          }
        } else {
          field.value = storedValue;
        }
      }
    }
  });
}

function updateStorageMessage(element, message, state = 'info') {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  if (state) {
    element.dataset.state = state;
  } else {
    delete element.dataset.state;
  }
}

function collectFormValues(form) {
  const values = {};
  qsa('input, select', form).forEach((field) => {
    values[field.name] = field.value.trim();
  });
  return values;
}

function computeMetrics(values) {
  const result = {};
  metrics.forEach((metric) => {
    const hasRequirement = metric.requirements.every((key) => values[key] !== '' && values[key] !== null);
    result[metric.key] = hasRequirement ? metric.compute(values) : NaN;
  });
  return result;
}

// modelSelection passes the currently selected option from the model dataset
// picker so that we can render fallback text when it is explicitly set to "off".
function renderResults(
  tbody,
  results,
  dataset,
  reference,
  populationDataset,
  modelDataset,
  modelSelection
) {
  tbody.innerHTML = '';
  const context = {};
  metrics.forEach((metric) => {
    const row = createEl('tr');
    const labelCell = createEl('th', { text: metric.label, attrs: { scope: 'row' } });
    const valueCell = createEl('td');
    const prCell = createEl('td', { text: '—' });
    const flatCell = createEl('td', { text: '—' });
    const runwayCell = createEl('td', { text: '—' });
    const noteCell = createEl('td');
    noteCell.textContent = '';
    const noteSegments = [];
    let percentileBadge = null;

    const value = results[metric.key];
    if (Number.isFinite(value)) {
      valueCell.textContent = metric.formatter ? metric.formatter(value) : value;
    } else {
      valueCell.textContent = '';
    }

    const populationMetricKey = metric.percentileKey ?? metric.key;
    const populationMetric = populationDataset?.metrics?.[populationMetricKey];
    if (Number.isFinite(value) && populationMetric) {
      const prResult = getPopulationPR(populationMetric, value) || {};
      const rawPercentile = Number.isFinite(prResult.rawPercentile) ? prResult.rawPercentile : null;
      const displayPercentile = projectDisplayPercentile(prResult.percentile, populationMetric.betterDirection);
      prCell.textContent = formatPrDisplay(displayPercentile, prResult.clamped);
      if (prResult.clamped === 'low') {
        addNoteSegment(noteSegments, '低於資料範圍');
      } else if (prResult.clamped === 'high') {
        addNoteSegment(noteSegments, '高於資料範圍');
      }
      if (Number.isFinite(rawPercentile)) {
        if (rawPercentile >= 85) {
          addNoteSegment(noteSegments, '原始 PR ≥85：數值高於約 85% 的人，建議持續追蹤相關風險。');
        }
        if (rawPercentile <= 15) {
          addNoteSegment(noteSegments, '原始 PR ≤15：數值低於約 15% 的人，建議與專業人員討論可能的健康影響。');
        }
      }
    }

    const modelMetricKey = metric.percentileKey ?? metric.key;
    const hasModelSelection = modelDataset && modelSelection !== 'off';
    let flatRange = null;
    let runwayRange = null;

    if (!hasModelSelection) {
      const noModelText = '未選擇模特資料';
      flatCell.textContent = noModelText;
      runwayCell.textContent = noModelText;
    } else {
      flatRange = resolveModelRange(modelDataset, 'flat', modelMetricKey);
      runwayRange = resolveModelRange(modelDataset, 'runway', modelMetricKey);
      const flatText = formatModelRange(flatRange, metric.formatter);
      const runwayText = formatModelRange(runwayRange, metric.formatter);
      flatCell.textContent = flatText;
      runwayCell.textContent = runwayText;
      if (flatText === '—' && runwayText === '—') {
        addNoteSegment(noteSegments, '模特資料未提供此指標');
      }
    }

    if (metric.key === 'whr') {
      addNoteSegment(noteSegments, whrReferenceNotes[reference] ?? whrReferenceNotes.neutral);
    }

    if (metric.key === 'bmi' && Number.isFinite(value)) {
      const guide = bmiGuidelines[reference] ?? bmiGuidelines.neutral;
      addNoteSegment(noteSegments, 'WHO 正常 18.5–24.9；亞太建議 <23。');
      if (value < guide.underweight) {
        addNoteSegment(noteSegments, '落在 WHO 體重過低 (<18.5) 區段，需評估營養狀態。');
      } else if (value >= guide.obesity) {
        addNoteSegment(noteSegments, '落在 WHO 肥胖 (≥30) 區段，建議諮詢專業人員。');
      } else if (value >= guide.overweight) {
        addNoteSegment(noteSegments, '落在 WHO 過重 (25–29.9) 區段。');
      } else if (value >= guide.asianRisk) {
        addNoteSegment(noteSegments, '超過亞太建議 23，建議留意代謝指標。');
      } else {
        addNoteSegment(noteSegments, '位於亞太建議 18.5–22.9 正常範圍。');
      }
    }

    if (metric.key === 'bodyfat' && Number.isFinite(value)) {
      addNoteSegment(noteSegments, '手動輸入數值，僅於瀏覽器顯示。');
      const guide = bodyFatGuidelines[reference] ?? bodyFatGuidelines.neutral;
      addNoteSegment(noteSegments, 'ACSM 建議：女性約 20–32%，男性約 10–22%。');
      if (value < guide.low) {
        addNoteSegment(noteSegments, '低於建議下限，請留意荷爾蒙與營養狀態。');
      } else if (value > guide.caution) {
        addNoteSegment(noteSegments, '高於建議上限，建議與專業人員檢視。');
      } else if (value > guide.optimalHi) {
        addNoteSegment(noteSegments, '略高於建議範圍，可規劃體脂管理。');
      } else {
        addNoteSegment(noteSegments, '位於建議範圍內。');
      }
    }

    if (metric.key === 'whtR') {
      const cutValue = Number.isFinite(populationDataset?.whtRCut)
        ? populationDataset.whtRCut
        : Number.isFinite(populationDataset?.metrics?.whtR?.cut)
        ? populationDataset.metrics.whtR.cut
        : null;
      if (Number.isFinite(cutValue)) {
        addNoteSegment(noteSegments, `臨界值 ${formatRatio(cutValue, 2)}`);
      }
    }

    if (metric.key === 'whr') {
      const whrCut =
        reference === 'female'
          ? populationDataset?.whrFemaleCut ?? populationDataset?.metrics?.whrFemale?.cut ?? null
          : reference === 'male'
            ? populationDataset?.whrMaleCut ?? populationDataset?.metrics?.whrMale?.cut ?? null
            : populationDataset?.metrics?.whr?.cut ?? null;
      if (Number.isFinite(whrCut)) {
        addNoteSegment(noteSegments, `臨界值 ${formatRatio(whrCut, 2)}`);
      }
    }

    if (metric.key === 'shoulderHeight' && Number.isFinite(value)) {
      const medians = populationDataset?.shoulderMedians;
      const shoulderNotes = [];
      if (medians && Number.isFinite(medians.cisMale) && medians.cisMale !== 0) {
        const delta = Math.abs(((value - medians.cisMale) / medians.cisMale) * 100);
        if (Number.isFinite(delta)) {
          shoulderNotes.push(`相對 cis-male 中位數 ±${delta.toFixed(1)}%`);
        }
      }
      if (medians && Number.isFinite(medians.cisFemale) && medians.cisFemale !== 0) {
        const delta = Math.abs(((value - medians.cisFemale) / medians.cisFemale) * 100);
        if (Number.isFinite(delta)) {
          shoulderNotes.push(`相對 cis-female 中位數 ±${delta.toFixed(1)}%`);
        }
      }
      if (shoulderNotes.length > 0) {
        addNoteSegment(noteSegments, shoulderNotes.join('；'));
      }
    }

    if (Number.isFinite(value) && hasModelSelection) {
      const modelNotes = [];
      const flatDeviation = evaluateModelDeviation(value, flatRange, '平面模特');
      if (flatDeviation) modelNotes.push(flatDeviation);
      const runwayDeviation = evaluateModelDeviation(value, runwayRange, '伸展台模特');
      if (runwayDeviation) modelNotes.push(runwayDeviation);
      if (modelNotes.length > 0) {
        addNoteSegment(noteSegments, modelNotes.join('；'));
      }
    }

    const datasetMetricKey = metric.percentileKey;
    const datasetMetricData = datasetMetricKey ? dataset?.metrics?.[datasetMetricKey] : null;
    if (dataset && datasetMetricKey && !datasetMetricData) {
      addNoteSegment(noteSegments, '資料集未提供');
    }

    if (datasetMetricData) {
      const { label, state, fallback } = getPercentile(datasetMetricData, value);
      if (label) {
        percentileBadge = formatBadge(label, state);
      }
      if (metric.key === 'whtR' && dataset?.metrics?.whtR?.cut) {
        addNoteSegment(noteSegments, `臨界值 ${dataset.metrics.whtR.cut}`);
      }
      if (fallback) {
        addNoteSegment(noteSegments, '（此指標僅提供中位參考）');
      }
      if (metric.key === 'thighHeight') {
        context.thighPercent = { label, state };
      }
    }

    if (percentileBadge) {
      noteCell.appendChild(percentileBadge);
    }
    if (noteSegments.length > 0) {
      if (noteCell.childNodes.length > 0) {
        noteCell.appendChild(document.createTextNode(' '));
      }
      noteCell.appendChild(document.createTextNode(noteSegments.join(' ')));
    }

    row.append(labelCell, valueCell, prCell, flatCell, runwayCell, noteCell);
    tbody.appendChild(row);
  });
  return context;
}

function summarizeSources(candidate) {
  if (!candidate) return [];
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object') {
          const title = item.title ?? item.name ?? item.label ?? item.source;
          return typeof title === 'string' ? title.trim() : null;
        }
        return null;
      })
      .filter((title) => title && title.length > 0);
  }
  if (typeof candidate === 'object') {
    const title = candidate.title ?? candidate.name ?? candidate.label ?? candidate.source;
    if (typeof title === 'string') {
      const trimmed = title.trim();
      return trimmed ? [trimmed] : [];
    }
  }
  return [];
}

function formatSampleSize(sampleSize) {
  if (sampleSize === null || sampleSize === undefined) return null;
  if (typeof sampleSize === 'number' && Number.isFinite(sampleSize)) {
    return `n=${sampleSize}`;
  }
  if (typeof sampleSize === 'string') {
    const trimmed = sampleSize.trim();
    if (!trimmed) return null;
    if (/^n\s*=\s*/i.test(trimmed)) {
      return trimmed.replace(/\s+/g, ' ');
    }
    return `n=${trimmed}`;
  }
  return null;
}

function extractModelMeta(modelEntry, modelData) {
  const result = {
    name: modelEntry?.name ?? modelData?.name ?? modelEntry?.id ?? null,
    sources: [],
    year: null,
    sampleSize: null
  };
  if (modelData && typeof modelData === 'object') {
    const containers = [modelData, modelData.metadata, modelData.meta, modelData.info, modelData.details];
    const sourceCandidate = modelData.source ?? modelData.sources ?? modelData.references ?? modelData.citations;
    result.sources = summarizeSources(sourceCandidate);
    for (const container of containers) {
      if (!container || typeof container !== 'object') continue;
      if (!result.year) {
        const yearValue = container.year ?? container.dataYear ?? container.releaseYear ?? container.publicationYear;
        if (typeof yearValue === 'number' && Number.isFinite(yearValue)) {
          result.year = yearValue;
        } else if (typeof yearValue === 'string' && yearValue.trim()) {
          const match = yearValue.match(/\d{4}/);
          result.year = match ? match[0] : yearValue.trim();
        }
      }
      if (!result.sampleSize) {
        const sampleValue =
          container.n ??
          container.N ??
          container.sampleSize ??
          container.sample_size ??
          container.sample ??
          container.samples ??
          container.count;
        if (typeof sampleValue === 'number' && Number.isFinite(sampleValue)) {
          result.sampleSize = sampleValue;
        } else if (typeof sampleValue === 'string' && sampleValue.trim()) {
          const numeric = sampleValue.replace(/[^\d.]/g, '');
          if (numeric) {
            const parsed = Number.parseFloat(numeric);
            if (Number.isFinite(parsed)) {
              result.sampleSize = parsed;
            } else {
              result.sampleSize = sampleValue.trim();
            }
          } else {
            result.sampleSize = sampleValue.trim();
          }
        }
      }
    }
  }
  if (!result.sources.length && modelEntry?.source) {
    result.sources = summarizeSources(modelEntry.source);
  }
  if (!result.year && modelEntry?.year) {
    if (typeof modelEntry.year === 'number' && Number.isFinite(modelEntry.year)) {
      result.year = modelEntry.year;
    } else if (typeof modelEntry.year === 'string' && modelEntry.year.trim()) {
      const match = modelEntry.year.match(/\d{4}/);
      result.year = match ? match[0] : modelEntry.year.trim();
    }
  }
  if (!result.sampleSize && modelEntry?.sampleSize) {
    if (typeof modelEntry.sampleSize === 'number' && Number.isFinite(modelEntry.sampleSize)) {
      result.sampleSize = modelEntry.sampleSize;
    } else if (typeof modelEntry.sampleSize === 'string' && modelEntry.sampleSize.trim()) {
      const numeric = modelEntry.sampleSize.replace(/[^\d.]/g, '');
      if (numeric) {
        const parsed = Number.parseFloat(numeric);
        if (Number.isFinite(parsed)) {
          result.sampleSize = parsed;
        } else {
          result.sampleSize = modelEntry.sampleSize.trim();
        }
      } else {
        result.sampleSize = modelEntry.sampleSize.trim();
      }
    }
  }
  return result;
}

function renderFootnotes(container, populationEntry, populationData, modelEntry, modelData) {
  if (!container) return;
  const segments = [
    'PR（Percentile Rank）代表贏過多少比例的一般人群；例如 PR 70 ≈ 贏過 70%。部分指標會倒轉顯示為贏過比例，備註仍以原始 PR 值判斷風險。'
  ];
  if (populationEntry) {
    const pieces = [];
    const populationName = populationEntry.name || populationData?.name || populationEntry.id;
    if (populationName) pieces.push(populationName);
    const meta = populationData?.meta;
    if (populationData && meta) {
      if (Array.isArray(meta.sources) && meta.sources.length > 0) {
        pieces.push(`來源：${meta.sources.join('、')}`);
      }
      if (meta.year) {
        pieces.push(`年份：${meta.year}`);
      }
      const sampleText = formatSampleSize(meta.sampleSize);
      if (sampleText) {
        pieces.push(`樣本：${sampleText}`);
      }
    } else if (populationData == null) {
      pieces.push('資料讀取失敗');
    }
    if (pieces.length > 0) {
      segments.push(`一般人群：${pieces.join('，')}`);
    }
  }

  if (modelEntry && modelEntry.id && modelEntry.id !== 'off') {
    const meta = extractModelMeta(modelEntry, modelData || null);
    const pieces = [];
    if (meta.name) {
      pieces.push(meta.name);
    }
    if (modelEntry.description) {
      pieces.push(modelEntry.description);
    }
    if (meta.sources.length > 0) {
      pieces.push(`來源：${meta.sources.join('、')}`);
    }
    if (meta.year) {
      pieces.push(`年份：${meta.year}`);
    }
    const sampleText = formatSampleSize(meta.sampleSize);
    if (sampleText) {
      pieces.push(`樣本：${sampleText}`);
    }
    if (modelData == null) {
      pieces.push('資料讀取失敗');
    }
    if (pieces.length > 0) {
      segments.push(`模特資料：${pieces.join('，')}`);
    }
  }

  if (segments.length === 0) {
    container.textContent = '';
    container.hidden = true;
    return;
  }
  container.textContent = segments.join(' ｜ ');
  container.hidden = false;
}

function readSelection(key) {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to read selector preference', key, error);
    return null;
  }
}

function writeSelection(key, value) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to persist selector preference', key, error);
  }
}

function clearSelection(key) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear selector preference', key, error);
  }
}

function renderSuggestion(container, results, context, formValues) {
  container.innerHTML = '';
  const rule = suggestionRules.find((item) => item.test(results, context, formValues));
  if (!rule) {
    container.textContent = '尚無特別提示，維持觀察即可。';
    return;
  }
  const title = createEl('h3', { text: '下一步建議' });
  const message = createEl('p', { text: rule.message });
  const linkList = createEl('p');
  rule.links.forEach((link, index) => {
    const anchor = createEl('a', { text: link.text, attrs: { href: link.href } });
    linkList.appendChild(anchor);
    if (index < rule.links.length - 1) {
      linkList.appendChild(document.createTextNode(' · '));
    }
  });
  container.append(title, message, linkList);
}

async function populateDatasets(selectEl) {
  const manifest = await loadDatasetManifest();
  manifest.datasets.forEach((dataset) => {
    const option = document.createElement('option');
    option.value = dataset.id;
    option.textContent = dataset.name;
    selectEl.appendChild(option);
  });
}

function attachCalculator() {
  const calculator = qs('[data-calculator]');
  if (!calculator) return;
  const form = qs('form', calculator);
  const tbody = qs('tbody', calculator);
  const suggestionBox = qs('[data-suggestion]', calculator);
  const populationSelect = qs('[data-population-select]', calculator);
  const modelSelect = qs('[data-model-select]', calculator);
  const datasetSelect = qs('select[name="dataset"]', form);
  const referenceSelect = qs('select[name="reference"]', form);
  const trigger = qs('[data-calc-trigger]', form);
  const datasetInfo = qs('[data-dataset-info]', calculator);
  const footnote = qs('[data-footnote]', calculator);
  const saveButton = qs('[data-save-values]', form);
  const loadButton = qs('[data-load-values]', form);
  const storageInfo = qs('[data-storage-info]', calculator);

  const showStorageMessage = (message, state) => updateStorageMessage(storageInfo, message, state);

  let populationListEntries = [];
  let modelListEntries = [];

  const initializePopulationSelect = async () => {
    if (!populationSelect) return;
    populationSelect.innerHTML = '';
    populationSelect.disabled = true;
    const list = await loadPopulationList();
    populationListEntries = list;
    if (!list.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '無資料';
      populationSelect.appendChild(option);
      populationSelect.disabled = true;
      clearSelection(POPULATION_STORAGE_KEY);
      return;
    }
    list.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.name;
      populationSelect.appendChild(option);
    });
    const storedId = readSelection(POPULATION_STORAGE_KEY);
    const fallbackId = list[0].id;
    if (storedId && list.some((entry) => entry.id === storedId)) {
      populationSelect.value = storedId;
    } else {
      populationSelect.value = fallbackId;
      writeSelection(POPULATION_STORAGE_KEY, fallbackId);
    }
    populationSelect.disabled = false;
  };

  const initializeModelSelect = async () => {
    if (!modelSelect) return;
    modelSelect.innerHTML = '';
    modelSelect.disabled = true;
    const list = await loadModelList();
    modelListEntries = list;
    if (!list.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '無資料';
      modelSelect.appendChild(option);
      clearSelection(MODEL_STORAGE_KEY);
      return;
    }
    const offOption = document.createElement('option');
    offOption.value = 'off';
    offOption.textContent = '—';
    modelSelect.appendChild(offOption);
    list.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.name;
      if (entry.description) {
        option.title = entry.description;
      }
      modelSelect.appendChild(option);
    });
    const storedId = readSelection(MODEL_STORAGE_KEY);
    if (storedId === 'off' || storedId === null) {
      modelSelect.value = 'off';
      writeSelection(MODEL_STORAGE_KEY, 'off');
    } else if (list.some((entry) => entry.id === storedId)) {
      modelSelect.value = storedId;
    } else {
      modelSelect.value = 'off';
      writeSelection(MODEL_STORAGE_KEY, 'off');
    }
    modelSelect.disabled = false;
  };

  populateDatasets(datasetSelect);
  initializePopulationSelect();
  initializeModelSelect();

  trigger.addEventListener('click', async () => {
    const formValues = collectFormValues(form);
    const results = computeMetrics(formValues);
    const populationId = populationSelect?.value ?? '';
    const populationEntry = populationListEntries.find((item) => item.id === populationId) ?? null;
    const modelId = modelSelect?.value ?? 'off';
    const modelEntry = modelId && modelId !== 'off' ? modelListEntries.find((item) => item.id === modelId) ?? null : null;
    const datasetPromise = loadDataset(formValues.dataset);
    const populationPromise = populationEntry ? loadPopulationData(populationEntry.file) : Promise.resolve(null);
    const modelPromise = modelEntry ? loadModelData(modelEntry.file) : Promise.resolve(null);
    const [dataset, populationData, modelData] = await Promise.all([datasetPromise, populationPromise, modelPromise]);
    renderDatasetInfo(datasetInfo, dataset, populationEntry, populationData);
    const context = renderResults(
      tbody,
      results,
      dataset,
      formValues.reference || 'neutral',
      populationData,
      modelData,
      modelId
    );
    renderSuggestion(suggestionBox, results, context, formValues);
    renderFootnotes(footnote, populationEntry, populationData, modelEntry, modelData);
    tbody.dispatchEvent(new CustomEvent('results-updated', { bubbles: false }));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    trigger.click();
  });

  referenceSelect.addEventListener('change', () => {
    trigger.click();
  });

  datasetSelect.addEventListener('change', () => {
    if (populationSelect && !populationSelect.disabled) {
      const selectedDatasetId = datasetSelect.value;
      const matchedPopulation = populationListEntries.find((entry) => entry.id === selectedDatasetId);
      if (matchedPopulation) {
        populationSelect.value = matchedPopulation.id;
        writeSelection(POPULATION_STORAGE_KEY, matchedPopulation.id);
      }
    }
    trigger.click();
  });

  if (populationSelect) {
    populationSelect.addEventListener('change', () => {
      if (!populationSelect.disabled) {
        writeSelection(POPULATION_STORAGE_KEY, populationSelect.value);
        trigger.click();
      }
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      if (!modelSelect.disabled) {
        writeSelection(MODEL_STORAGE_KEY, modelSelect.value);
        trigger.click();
      }
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const formValues = collectFormValues(form);
      if (persistFormValues(formValues)) {
        showStorageMessage('已儲存目前輸入，資料僅存在此瀏覽器。', 'success');
      } else {
        showStorageMessage('無法寫入瀏覽器儲存區，請確認瀏覽器權限設定。', 'error');
      }
    });
  }

  if (loadButton) {
    loadButton.addEventListener('click', () => {
      const storedValues = restoreFormValues();
      if (!storedValues) {
        showStorageMessage('尚未找到可載入的紀錄。', 'info');
        return;
      }
      applyFormValues(form, storedValues);
      showStorageMessage('已載入上次儲存的數值。', 'success');
      trigger.click();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attachCalculator();
});
