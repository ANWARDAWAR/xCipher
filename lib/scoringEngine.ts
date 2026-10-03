export interface ScoreItem {
  tab?: string; // "Camera" | "Display" | "Performance" | "Battery" | "Charging" | "Software" | "Design" | "Audio" | "Connectivity" | "Value" | string
  subCategory?: string; // e.g. "Photo", "Video"
  group?: string; // alias/fallback for subCategory
  metric: string; // e.g. "Main Lens", "Wireless Charging"
  rawValue?: string; // real-world native units e.g. "18h 30m", "4500 nits", "120W"
  score: number | string; // 0-200 or "N/A"
  topScore?: number | string; // 0-200 or "N/A"
  weight?: number;
  isUseCase?: boolean;
  useCaseDescription?: string;
  isNA?: boolean;
}

export interface GroupScoreResult {
  group: string;
  score: number;
  topScore: number;
  weight: number;
  metrics: ScoreItem[];
}

export interface SubCategoryResult {
  name: string;
  score: number;
  topScore: number;
  weight: number;
  metrics: ScoreItem[];
}

export interface UseCaseScoreResult {
  label: string;
  score: number;
  topScore: number;
  description?: string;
}

export interface TabBreakdownResult {
  tab: string;
  score: number;
  topScore: number;
  scaleMax: number;
  subCategories: SubCategoryResult[];
  useCases: UseCaseScoreResult[];
}

export interface CalculatedBreakdown {
  activeTab: string;
  overallScore: number;
  overallTopScore: number;
  scaleMax: number;
  // groups provided for backward compatibility with 1D/group consumers
  groups: GroupScoreResult[];
  subCategories: SubCategoryResult[];
  useCases: UseCaseScoreResult[];
  tabs: Record<string, TabBreakdownResult>;
  categories: Record<string, TabBreakdownResult>;
  groupedData: Record<string, TabBreakdownResult>;
  availableTabs: string[];
}

export const BENCHMARK_TABS = [
  'Camera',
  'Display',
  'Performance',
  'Battery',
  'Charging',
  'Software',
  'Design',
  'Audio',
  'Connectivity',
  'Value',
  'Selfie',
] as const;

export type BenchmarkTab = (typeof BENCHMARK_TABS)[number] | string;

export function isNAScore(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    if (
      trimmed === 'n/a' ||
      trimmed === 'na' ||
      trimmed === '-' ||
      trimmed === 'none' ||
      trimmed === ''
    ) {
      return true;
    }
  }
  return isNaN(Number(val));
}

const DEFAULT_USE_CASE_DESCRIPTIONS: Record<string, string> = {
  lowlight: 'Photos and videos captured in challenging low-light conditions',
  night: 'Photos and videos captured in challenging low-light conditions',
  outdoor: 'High dynamic range and color vibrance under bright direct sunlight',
  sunlight: 'Screen legibility and peak nit brightness in direct outdoor sunlight',
  portrait: 'Depth estimation, bokeh separation, and natural skin tone rendition',
  bokeh: 'Natural optical blur and subject separation against backgrounds',
  cinema: 'HDR color reproduction and video contrast fidelity',
  video: '4K motion tracking, optical stabilization, and audio pickup',
  gaming: 'Frame rate consistency and thermal stability under heavy 3D load',
  multitasking: 'Speed and memory persistence when switching active apps',
  autonomy: 'All-day battery longevity across mixed 5G and Wi-Fi networks',
  charging: 'Fast-charging rate from 0 to 50% capacity',
  recording: 'Multi-microphone spatial audio clarity and wind noise isolation',
  playback: 'Stereo balance, acoustic timbre, and bass response accuracy',
};

function getUseCaseDescription(metric: string, customDesc?: string): string {
  if (customDesc && customDesc.trim()) return customDesc.trim();
  const lower = metric.toLowerCase();
  for (const [key, desc] of Object.entries(DEFAULT_USE_CASE_DESCRIPTIONS)) {
    if (lower.includes(key)) return desc;
  }
  return 'Standardized laboratory and real-world benchmark evaluation';
}

function calculateScaleMax(peakScore: number): number {
  if (peakScore <= 0) return 200;
  if (peakScore <= 10) return 10;
  if (peakScore <= 100) return 100;
  if (peakScore <= 160) return 160;
  if (peakScore <= 200) return 200;
  return Math.ceil(peakScore / 10) * 10;
}

/**
 * Pure mathematical scoring engine for xSypher multi-category benchmarking.
 * Supports hierarchical aggregation (Category -> Sub-Category -> Metric),
 * custom metric weights, dynamic 0-200 point scaling, strict N/A safety,
 * and edge runtime safety.
 */
export function calculateXSypherScore(rawItems: any[], requestedTab?: string): CalculatedBreakdown {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      activeTab: requestedTab || 'Camera',
      overallScore: 0,
      overallTopScore: 0,
      scaleMax: 100,
      groups: [],
      subCategories: [],
      useCases: [],
      tabs: {},
      categories: {},
      groupedData: {},
      availableTabs: [],
    };
  }

  // Normalize items with strict N/A detection
  const normalizedItems: ScoreItem[] = rawItems.map((item) => {
    const rawScoreVal = item.score ?? item.value;
    const isScoreNA = isNAScore(rawScoreVal);
    const rawScore = isScoreNA ? 0 : Number(rawScoreVal);

    const rawTopVal = item.topScore;
    const isTopScoreNA = rawTopVal !== undefined && isNAScore(rawTopVal);
    const rawTopScore = isTopScoreNA
      ? (isScoreNA ? 0 : rawScore)
      : (rawTopVal !== undefined ? Number(rawTopVal) : rawScore);

    const rawWeight = item.weight !== undefined && Number(item.weight) > 0 ? Number(item.weight) : 1.0;

    const rawTab = item.tab ? String(item.tab).trim() : '';
    const rawSub = item.subCategory ? String(item.subCategory).trim() : (item.group ? String(item.group).trim() : '');

    const isUseCase = Boolean(
      item.isUseCase ||
      rawSub.toLowerCase().includes('use case') ||
      rawSub.toLowerCase().includes('usecase') ||
      rawTab.toLowerCase().includes('use case')
    );

    const rawValueStr = item.rawValue !== undefined && item.rawValue !== null ? String(item.rawValue).trim() : undefined;

    return {
      tab: rawTab || 'Camera',
      subCategory: rawSub || 'General',
      group: rawSub || 'General',
      metric: item.metric ? String(item.metric).trim() : (item.label ? String(item.label).trim() : 'Metric'),
      rawValue: rawValueStr && rawValueStr !== '' ? rawValueStr : undefined,
      score: isScoreNA ? 'N/A' : (isNaN(rawScore) ? 0 : rawScore),
      topScore: isTopScoreNA && isScoreNA ? 'N/A' : (isNaN(rawTopScore) ? rawScore : Math.max(rawTopScore, rawScore)),
      weight: isNaN(rawWeight) ? 1.0 : rawWeight,
      isUseCase,
      useCaseDescription: item.useCaseDescription,
      ...(isScoreNA ? { isNA: true } : {}),
    };
  });

  // Group items by category/tab
  const tabItemMap = new Map<string, ScoreItem[]>();
  for (const item of normalizedItems) {
    const tabName = item.tab || 'Camera';
    if (!tabItemMap.has(tabName)) {
      tabItemMap.set(tabName, []);
    }
    tabItemMap.get(tabName)!.push(item);
  }

  const availableTabs = Array.from(tabItemMap.keys());

  // Determine active tab if requested
  let activeTab = requestedTab || (availableTabs.length > 0 ? availableTabs[0] : 'Camera');
  const matchedTab = availableTabs.find((t) => t.toLowerCase() === activeTab.toLowerCase());
  if (matchedTab) {
    activeTab = matchedTab;
  } else if (availableTabs.length > 0) {
    activeTab = availableTabs[0];
  }

  const computedTabs: Record<string, TabBreakdownResult> = {};

  for (const [tName, items] of tabItemMap.entries()) {
    const useCases: UseCaseScoreResult[] = [];
    const subCatMap = new Map<string, ScoreItem[]>();

    let tabPeak = 0;

    for (const item of items) {
      const isNA = item.isNA || isNAScore(item.score);
      if (!isNA) {
        const numScore = Number(item.score);
        const numTop = isNAScore(item.topScore) ? numScore : Number(item.topScore);
        if (numScore > tabPeak) tabPeak = numScore;
        if (numTop > tabPeak) tabPeak = numTop;
      }

      if (item.isUseCase) {
        useCases.push({
          label: item.metric,
          score: isNA ? 0 : Math.round(Number(item.score)),
          topScore: isNA
            ? 0
            : Math.round(isNAScore(item.topScore) ? Number(item.score) : Number(item.topScore)),
          description: getUseCaseDescription(item.metric, item.useCaseDescription),
        });
      } else {
        const subName = item.subCategory || item.group || 'General';
        if (!subCatMap.has(subName)) {
          subCatMap.set(subName, []);
        }
        subCatMap.get(subName)!.push(item);
      }
    }

    const subCategories: SubCategoryResult[] = [];

    for (const [subName, metrics] of subCatMap.entries()) {
      let weightedScoreSum = 0;
      let weightedTopScoreSum = 0;
      let totalWeight = 0;
      let validMetricsCount = 0;

      for (const m of metrics) {
        const isNA = m.isNA || isNAScore(m.score);
        if (isNA) {
          m.isNA = true;
          continue; // strictly omit N/A from weighted average
        }

        const scoreNum = Number(m.score);
        const topNum = isNAScore(m.topScore) ? scoreNum : Number(m.topScore);
        const w = m.weight !== undefined && Number(m.weight) > 0 ? Number(m.weight) : 1.0;

        weightedScoreSum += scoreNum * w;
        weightedTopScoreSum += Math.max(topNum, scoreNum) * w;
        totalWeight += w;
        validMetricsCount++;
      }

      const subScore = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 0;
      const subTopScore = totalWeight > 0 ? Math.round(weightedTopScoreSum / totalWeight) : subScore;

      subCategories.push({
        name: subName,
        score: subScore,
        topScore: Math.max(subTopScore, subScore),
        weight: validMetricsCount > 0 ? totalWeight / validMetricsCount : 0,
        metrics,
      });
    }

    // Calculate category overall score
    let tabScore = 0;
    let tabTopScore = 0;

    if (subCategories.length > 0) {
      let totalWeightedScore = 0;
      let totalWeightedTopScore = 0;
      let totalSubWeight = 0;

      for (const sub of subCategories) {
        if (sub.weight > 0) {
          totalWeightedScore += sub.score * sub.weight;
          totalWeightedTopScore += sub.topScore * sub.weight;
          totalSubWeight += sub.weight;
        }
      }

      tabScore = totalSubWeight > 0 ? Math.round(totalWeightedScore / totalSubWeight) : 0;
      tabTopScore = totalSubWeight > 0 ? Math.round(totalWeightedTopScore / totalSubWeight) : tabScore;
    } else if (useCases.length > 0) {
      const validUC = useCases.filter((u) => !isNAScore(u.score) && u.score > 0);
      if (validUC.length > 0) {
        const sum = validUC.reduce((acc, u) => acc + u.score, 0);
        const topSum = validUC.reduce((acc, u) => acc + u.topScore, 0);
        tabScore = Math.round(sum / validUC.length);
        tabTopScore = Math.round(topSum / validUC.length);
      }
    }

    computedTabs[tName] = {
      tab: tName,
      score: tabScore,
      topScore: Math.max(tabTopScore, tabScore),
      scaleMax: calculateScaleMax(tabPeak),
      subCategories,
      useCases,
    };
  }

  const activeResult: TabBreakdownResult = computedTabs[activeTab] || {
    tab: activeTab,
    score: 0,
    topScore: 0,
    scaleMax: 200,
    subCategories: [],
    useCases: [],
  };

  // Groups alias maps to subCategories with `group` property for backward compatibility
  const groups: GroupScoreResult[] = activeResult.subCategories.map((sub) => ({
    group: sub.name,
    score: sub.score,
    topScore: sub.topScore,
    weight: sub.weight,
    metrics: sub.metrics,
  }));

  return {
    activeTab,
    overallScore: activeResult.score,
    overallTopScore: activeResult.topScore,
    scaleMax: activeResult.scaleMax,
    groups,
    subCategories: activeResult.subCategories,
    useCases: activeResult.useCases,
    tabs: computedTabs,
    categories: computedTabs,
    groupedData: computedTabs,
    availableTabs,
  };
}
