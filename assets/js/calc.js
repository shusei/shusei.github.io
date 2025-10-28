import { qs, qsa, createEl, safeNumber, formatRatio, formatBadge } from './dom.js';
import { loadDatasetManifest, loadDataset, getPercentile } from './datasets.js';

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
    requirements: ['height', 'weight']
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
    requirements: ['shoulder', 'hip']
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
    requirements: ['bust', 'waist']
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
    requirements: ['bust', 'height']
  },
  {
    key: 'bodyfat',
    label: '體脂 %',
    compute: ({ bodyfat }) => {
      const bf = safeNumber(bodyfat);
      return Number.isFinite(bf) ? bf : NaN;
    },
    formatter: (value) => (Number.isFinite(value) ? `${value.toFixed(1)}%` : ''),
    requirements: ['bodyfat']
  }
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

function renderDatasetInfo(element, dataset) {
  if (!element) return;
  if (!dataset) {
    element.textContent = '';
    element.hidden = true;
    return;
  }
  const name = dataset.name || dataset.id || '—';
  const metricData = dataset.metrics?.shoulderHeightRatio;
  if (!metricData) {
    element.textContent = `資料集：${name} ｜ 尚未提供肩/身高百分位資料`;
    element.hidden = false;
    return;
  }
  const { summary, fallback } = describePercentiles(metricData);
  if (!summary) {
    element.textContent = `資料集：${name} ｜ 尚未提供肩/身高百分位資料`;
    element.hidden = false;
    return;
  }
  let message = `資料集：${name} ｜ 肩/身高百分位 ${summary}`;
  if (fallback) {
    message += ' （此資料集僅提供中位數參考）';
  }
  element.textContent = message;
  element.hidden = false;
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

function renderResults(tbody, results, dataset, reference) {
  tbody.innerHTML = '';
  const context = {};
  metrics.forEach((metric) => {
    const row = createEl('tr');
    const labelCell = createEl('th', { text: metric.label, attrs: { scope: 'row' } });
    const valueCell = createEl('td');
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

    if (metric.key === 'whr') {
      noteSegments.push(whrReferenceNotes[reference] ?? whrReferenceNotes.neutral);
    } else if (metric.key === 'bodyfat' && Number.isFinite(value)) {
      noteSegments.push('手動輸入數值，僅於瀏覽器顯示。');
    }

    if (dataset && metric.percentileKey) {
      const metricData = dataset.metrics?.[metric.percentileKey];
      const { label, state, fallback } = getPercentile(metricData, value);
      if (label) {
        percentileBadge = formatBadge(label, state);
      }
      if (metric.key === 'whtR' && dataset.metrics?.whtR?.cut) {
        noteSegments.push(`臨界值 ${dataset.metrics.whtR.cut}`);
      }
      if (fallback) {
        noteSegments.push('（此指標僅提供中位參考）');
      }
      if (metric.key === 'thighHeight') {
        context.thighPercent = { label, state };
      }
    }

    if (percentileBadge) {
      noteCell.appendChild(percentileBadge);
    }
    if (noteSegments.length > 0) {
      if (percentileBadge) {
        noteCell.appendChild(document.createTextNode(' '));
      }
      noteCell.appendChild(document.createTextNode(noteSegments.join(' ')));
    }

    row.append(labelCell, valueCell, noteCell);
    tbody.appendChild(row);
  });
  return context;
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
  const datasetSelect = qs('select[name="dataset"]', form);
  const referenceSelect = qs('select[name="reference"]', form);
  const trigger = qs('[data-calc-trigger]', form);
  const datasetInfo = qs('[data-dataset-info]', calculator);

  populateDatasets(datasetSelect);

  trigger.addEventListener('click', async () => {
    const formValues = collectFormValues(form);
    const results = computeMetrics(formValues);
    const dataset = await loadDataset(formValues.dataset);
    renderDatasetInfo(datasetInfo, dataset);
    const context = renderResults(tbody, results, dataset, formValues.reference || 'neutral');
    renderSuggestion(suggestionBox, results, context, formValues);
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
    trigger.click();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachCalculator();
});
