export const CLASS_LABELS = [
  'Acral Lentiginous Melanoma',
  'clubbing',
  'healthy',
  'onychogryphosis',
] as const;

export type DiagnosisLabel = (typeof CLASS_LABELS)[number] | 'unidentified';

export interface ConditionInfo {
  label: DiagnosisLabel;
  subtitle?: string;
  description: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  riskLevel: 'Low' | 'Moderate' | 'High';
  riskNote?: string;
  shapeDetail?: string;
  colorDetail?: string;
  textureDetail?: string;
  isHealthy?: boolean;
}

export const CONDITION_INFO: Record<DiagnosisLabel, ConditionInfo> = {
  'Acral Lentiginous Melanoma': {
    label: 'Acral Lentiginous Melanoma',
    subtitle: 'Nail Melanoma Subtype',
    description:
      'A rare and aggressive melanoma subtype affecting the nail unit, often seen as a dark vertical streak under the nail.',
    symptoms: [
      'Dark brown or black streak under the nail',
      'Pigment spreading into skin',
      'Nail splitting or deformity',
    ],
    causes: [
      'Genetic mutations',
      'Possible repeated trauma',
      'Family history of melanoma',
    ],
    treatment: [
      'Urgent dermatology evaluation',
      'Surgical excision if confirmed',
      'Oncology follow-up',
    ],
    riskLevel: 'High',
    riskNote: 'Melanoma is a serious condition requiring immediate medical attention.',
    shapeDetail: 'Linear streaks',
    colorDetail: 'Dark brown/black',
    textureDetail: 'Nail splitting',
  },
  clubbing: {
    label: 'clubbing',
    subtitle: 'Nail & Fingertip Change',
    description:
      'A nail and fingertip shape change where nails curve downward and fingertips enlarge, often linked to systemic disease.',
    symptoms: [
      'Increased nail curvature',
      'Rounded enlarged fingertip',
      'Softening of the nail bed',
    ],
    causes: [
      'Chronic lung conditions',
      'Cardiac disease',
      'Systemic conditions',
    ],
    treatment: [
      'Manage underlying condition',
      'Pulmonary/Cardiac assessment',
      'Periodic monitoring',
    ],
    riskLevel: 'High',
    riskNote: 'May indicate underlying systemic health issues.',
    shapeDetail: 'Downward curve',
    colorDetail: 'Normal/Pale',
    textureDetail: 'Spongy/Soft',
  },
  healthy: {
    label: 'healthy',
    subtitle: 'Normal Nail Appearance',
    description: 'Nail appearance is within normal visual characteristics for color, texture, and shape.',
    symptoms: ['Even color', 'Smooth nail surface', 'No clear visible lesions'],
    causes: [],
    treatment: [
      'Maintain regular hygiene',
      'Avoid prolonged moisture',
      'Use protective gloves',
    ],
    riskLevel: 'Low',
    riskNote: 'Continue standard nail care practices.',
    shapeDetail: 'Flat or slight curve',
    colorDetail: 'Translucent pink',
    textureDetail: 'Smooth surface',
    isHealthy: true,
  },
  onychogryphosis: {
    label: 'onychogryphosis',
    subtitle: 'Claw-like Thickening',
    description:
      'A nail dystrophy characterized by thickened, curved, and claw-like nails that can progress over time.',
    symptoms: [
      'Marked nail thickening',
      'Claw-like appearance',
      'Nail discoloration',
    ],
    causes: [
      'Chronic trauma',
      'Aging changes',
      'Poor circulation',
    ],
    treatment: [
      'Podiatry evaluation',
      'Regular debridement',
      'Footwear adjustment',
    ],
    riskLevel: 'Moderate',
    riskNote: 'Requires regular maintenance to prevent pain.',
    shapeDetail: 'Thick & distorted',
    colorDetail: 'Yellow/Opaque',
    textureDetail: 'Rough/Uneven',
  },
  unidentified: {
    label: 'unidentified',
    subtitle: 'Low confidence scan',
    description:
      'The model confidence is too low for a reliable diagnosis. Capture a clearer close-up image and rescan.',
    symptoms: [
      'Low confidence score',
      'Image quality issues',
    ],
    causes: [
      'Low image quality',
      'Poor lighting/glare',
      'Small nail region',
    ],
    treatment: [
      'Retake in bright lighting',
      'Move closer to nail',
      'Avoid glare/blur',
    ],
    riskLevel: 'Moderate',
    riskNote: 'Diagnosis could not be determined reliably.',
    shapeDetail: 'Unclear',
    colorDetail: 'Unclear',
    textureDetail: 'Unclear',
  },
};

export function isDiagnosisLabel(value: string): value is DiagnosisLabel {
  return value === 'unidentified' || (CLASS_LABELS as readonly string[]).includes(value);
}

export function getConditionInfo(label: string): ConditionInfo {
  const normalized = label.trim();
  const aliasMap: Record<string, DiagnosisLabel> = {
    Healthy: 'healthy',
    'Nail Clubbing': 'clubbing',
    Onychogryphosis: 'onychogryphosis',
    Unidentified: 'unidentified',
    Undefined: 'unidentified',
  };

  const safeLabel = isDiagnosisLabel(normalized) ? normalized : (aliasMap[normalized] ?? 'unidentified');
  return CONDITION_INFO[safeLabel as DiagnosisLabel] || CONDITION_INFO['unidentified'];
}
