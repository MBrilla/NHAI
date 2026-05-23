export const CLASS_LABELS = [
  'acral_lentiginous_melanoma',
  'beau_lines',
  'blue_finger',
  'clubbing',
  'healthy_nails',
  'koilonychia',
  'muehrckes_lines',
  'pitting'
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
  recommendations?: string[];
  validatedSource?: string;
}

export const CONDITION_INFO: Record<DiagnosisLabel, ConditionInfo> = {
  'beau_lines': {
    label: 'beau_lines',
    subtitle: 'Transverse Grooves in Nails',
    description:
      'Horizontal grooves or ridges across the nail plate, caused by a temporary interruption in nail matrix growth due to systemic illness, injury, or severe stress.',
    symptoms: [
      'Horizontal ridges or depressions',
      'Appears across multiple nails',
      'Grows out slowly with nail growth',
    ],
    causes: [
      'Severe systemic infection or illness',
      'High fever',
      'Nail matrix injury',
      'Severe emotional stress',
    ],
    treatment: [
      'There is no direct treatment for Beau’s lines. Treating the underlying illness, injury, stress, or nutritional deficiency allows healthy nails to grow back over time.',
    ],
    riskLevel: 'Moderate',
    riskNote: 'Often resolves on its own as the nail grows, but severe cases warrant identifying the underlying trigger.',
    shapeDetail: 'Horizontal grooves or dents running across the nail plate',
    colorDetail: 'Usually normal in color but may appear uneven depending on the underlying condition',
    textureDetail: 'Indented or ridged nail surface with visible horizontal lines',
    recommendations: [
      'Consult a healthcare provider if the cause is unknown.',
      'Maintain proper nutrition and adequate protein intake.',
      'Avoid nail trauma, harsh nail products, and excessive manicures.',
      'Manage underlying conditions such as diabetes or skin diseases.',
      'Monitor nail changes and overall health regularly.',
    ],
    validatedSource: 'Cleveland Clinic – Beau’s Lines',
  },
  clubbing: {
    label: 'clubbing',
    subtitle: 'Nail & Fingertip Change',
    description:
      'Rounded and enlarged fingertips with downward nail curvature, possibly linked to underlying lung, heart, digestive, or systemic conditions.',
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
      'There is no specific treatment for clubbed fingers. Treatment focuses on managing the underlying disease.',
    ],
    riskLevel: 'High',
    riskNote: 'May indicate underlying systemic health issues.',
    shapeDetail: 'Rounded and enlarged fingertips with downward nail curvature',
    colorDetail: 'May appear pale or slightly discolored near the nail bed',
    textureDetail: 'Smooth nail surface with bulbous fingertip appearance',
    recommendations: [
      'Consult a healthcare provider for proper evaluation.',
      'Monitor symptoms such as cough, breathing difficulty, or digestive issues.',
      'Undergo recommended diagnostic tests.',
      'Follow treatment for the underlying condition causing clubbing.',
    ],
    validatedSource: 'Cleveland Clinic – Clubbed Fingers',
  },
  healthy_nails: {
    label: 'healthy_nails',
    subtitle: 'Normal Nail Appearance',
    description:
      'Healthy nails are typically strong, flexible, and free from discoloration, unusual lines, or nail separation. Proper nail hygiene and nutrition help maintain nail health.',
    symptoms: ['Even color', 'Smooth nail surface', 'No clear visible lesions'],
    causes: [],
    treatment: [
      'Maintain proper nail hygiene, balanced nutrition, hydration, and regular nail care practices to preserve healthy nail condition.',
    ],
    riskLevel: 'Low',
    riskNote: 'Continue standard nail care practices.',
    shapeDetail: 'Smooth and evenly shaped nails with no swelling or deformity',
    colorDetail: 'Light pink nail bed with consistent color appearance',
    textureDetail: 'Smooth nail surface without grooves, dents, or thickening',
    isHealthy: true,
    recommendations: [
      'Keep fingernails clean and dry.',
      'Trim nails regularly and file rough edges.',
      'Avoid biting nails or removing cuticles.',
      'Do not use nails to open objects.',
      'Protect hands and nails from excessive water and harsh chemicals.',
      'Moisturize nails and cuticles regularly.',
      'Consult a dermatologist if nails change color, swell, or become painful.',
    ],
    validatedSource: 'American Academy of Dermatology – Healthy Nail Tips & Mayo Clinic – Fingernail Care',
  },
  pitting: {
    label: 'pitting',
    subtitle: 'Punctate Nail Depressions',
    description:
      'Multiple small pin-like dents scattered across the nail surface that may be associated with psoriasis, autoimmune diseases, or skin conditions affecting nail growth.',
    symptoms: [
      'Pinpoint indentations on nail plate',
      'Rough nail surface texture',
      'Rough and uneven surface',
    ],
    causes: [
      'Psoriasis',
      'Alopecia areata',
      'Eczema / Atopic dermatitis',
      'Systemic autoimmune conditions',
    ],
    treatment: [
      'Treatment focuses on managing the underlying condition causing nail pitting, such as psoriasis or autoimmune diseases. Medications may include topical creams, oral medicines, or injections prescribed by a healthcare provider.',
    ],
    riskLevel: 'Moderate',
    riskNote: 'Commonly linked with psoriasis; consultation with a dermatologist is recommended.',
    shapeDetail: 'Multiple small pin-like dents scattered across the nail surface',
    colorDetail: 'May appear discolored depending on associated nail conditions',
    textureDetail: 'Rough and uneven nail surface with shallow depressions',
    recommendations: [
      'Consult a healthcare provider for proper diagnosis and treatment.',
      'Follow the prescribed treatment plan consistently.',
      'Keep nails short and clean to prevent breaking or splitting.',
      'Moisturize hands and nails regularly.',
      'Wear gloves when cleaning or using chemicals.',
      'Avoid manicures, fake nails, and excessive nail polish.',
      'Do not cut or push back cuticles.',
    ],
    validatedSource: 'Cleveland Clinic – Nail Pitting',
  },
  unidentified: {
    label: 'unidentified',
    subtitle: 'Low Confidence Scan',
    description:
      'The image may be unclear, unsupported, or outside the current detection scope of the application.',
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
      'Retake the scan in bright, natural lighting, moving closer to the nail while avoiding glare, shadows, or blur.',
    ],
    riskLevel: 'Moderate',
    riskNote: 'Diagnosis could not be determined reliably.',
    shapeDetail: 'Unclear',
    colorDetail: 'Unclear',
    textureDetail: 'Unclear',
    recommendations: [
      'Ensure the nail is centered in the frame.',
      'Wipe the camera lens to remove smudges.',
      'Keep the hand steady while capturing.',
    ],
    validatedSource: 'NailScan Quality Protocol',
  },
  'acral_lentiginous_melanoma': {
    label: 'acral_lentiginous_melanoma',
    subtitle: 'Subungual Melanoma',
    description:
      'A serious type of melanoma that may appear as an irregular dark streak or band on the nail and can gradually widen, darken, or spread to nearby skin.',
    symptoms: [
      'Dark vertical line',
      'Pigment spreading to cuticle',
      'Nail thickening, cracking, or distortion',
    ],
    causes: ['Malignant melanoma affecting the nail unit'],
    treatment: [
      'Treatment focuses on early diagnosis and management of the melanoma affecting the nail unit. Medical treatment may include biopsy, surgical removal, immunotherapy, targeted therapy, or other cancer treatments recommended by a healthcare provider.',
    ],
    riskLevel: 'High',
    riskNote: 'Requires immediate evaluation by a dermatologist.',
    shapeDetail: 'Irregular dark streak or band appearing vertically on the fingernail',
    colorDetail: 'Brown, black, or dark uneven pigmentation on the nail plate',
    textureDetail: 'May appear smooth at first but can later cause nail thickening, cracking, or nail distortion',
    recommendations: [
      'Consult a dermatologist immediately for proper diagnosis and evaluation.',
      'Monitor changes in nail color, width, or shape.',
      'Do not ignore persistent dark streaks or nail discoloration.',
      'Follow recommended diagnostic procedures such as biopsy or medical imaging.',
      'Attend regular medical follow-up appointments if diagnosed.',
      'Seek immediate medical attention if the nail becomes painful, damaged, or rapidly changes appearance.',
    ],
    validatedSource: 'DermNet NZ – Acral Lentiginous Melanoma',
  },
  'blue_finger': {
    label: 'blue_finger',
    subtitle: 'Cyanosis',
    description:
      'Bluish discoloration of the nails or fingertips, indicating a lack of oxygen in the blood commonly linked to poor circulation, cold exposure, heart conditions, or lung diseases.',
    symptoms: ['Bluish or purple discoloration on the fingers and nails', 'Skin may feel cold, numb, or clammy'],
    causes: ['Poor circulation', 'Cold exposure', 'Heart conditions', 'Respiratory or lung disease'],
    treatment: [
      'Treatment depends on the cause and may include oxygen therapy, warming the affected area, medications, or treatment of underlying heart or lung conditions.',
    ],
    riskLevel: 'High',
    riskNote: 'Can indicate a medical emergency if sudden or accompanied by shortness of breath.',
    shapeDetail: 'Fingers usually appear normal but may look swollen in severe cases',
    colorDetail: 'Bluish or purple discoloration on the fingers and nails due to low oxygen levels',
    textureDetail: 'Skin may feel cold, numb, or clammy',
    recommendations: [
      'Keep the body and hands warm.',
      'Avoid smoking and excessive caffeine.',
      'Seek medical attention if symptoms persist or occur with breathing difficulty or chest pain.',
    ],
    validatedSource: 'Cleveland Clinic – Cyanosis',
  },
  'koilonychia': {
    label: 'koilonychia',
    subtitle: 'Spoon Nails',
    description:
      'Concave or spoon-shaped nail appearance with inward indentation, commonly associated with iron deficiency anemia or related medical conditions.',
    symptoms: ['Concave nail shape', 'Thin and soft nail plate'],
    causes: ['Iron deficiency anemia', 'Hemochromatosis', 'Systemic conditions'],
    treatment: [
      'Treatment focuses on managing the underlying cause of koilonychia, especially iron deficiency anemia or related medical conditions. Dietary changes, iron-rich foods, and supplements may help improve nail appearance over time.',
    ],
    riskLevel: 'Moderate',
    riskNote: 'Consult a doctor for blood tests to check iron levels.',
    shapeDetail: 'Concave or spoon-shaped nail appearance with inward indentation',
    colorDetail: 'May appear pale or lighter than normal due to iron deficiency',
    textureDetail: 'Soft and thin nail surface with noticeable central depression',
    recommendations: [
      'Consult a healthcare provider for proper diagnosis and evaluation.',
      'Maintain a balanced diet rich in iron and nutrients.',
      'Follow prescribed iron supplements or treatment plans if recommended.',
      'Keep nails clean and moisturized regularly.',
      'Wear gloves when using cleaning chemicals.',
      'Avoid tight footwear that may damage toenails.',
      'Monitor nail changes and underlying health conditions.',
    ],
    validatedSource: 'Cleveland Clinic – Koilonychia (Spoon Nails)',
  },
  'muehrckes_lines': {
    label: 'muehrckes_lines',
    subtitle: "Muehrcke's Lines",
    description:
      'Multiple horizontal white lines running across the fingernails that may be linked to low albumin levels or systemic conditions.',
    symptoms: ['Double white transverse lines', 'Lines disappear under pressure'],
    causes: ['Hypoalbuminemia', 'Kidney disease', 'Liver disease', 'Nutritional deficiencies'],
    treatment: [
      'Treatment focuses on managing the underlying condition causing Muehrcke lines, particularly low albumin levels or related systemic diseases. In some cases, supplemental albumin treatment may be recommended by a healthcare provider.',
    ],
    riskLevel: 'Moderate',
    riskNote: 'May indicate decreased protein synthesis or kidney issues.',
    shapeDetail: 'Multiple horizontal white lines running across the fingernails',
    colorDetail: 'White discoloration appearing in parallel bands across the nail surface',
    textureDetail: 'Smooth nail surface without raised ridges or dents',
    recommendations: [
      'Consult a healthcare provider for proper diagnosis and evaluation.',
      'Follow recommended laboratory tests to check albumin and protein levels.',
      'Maintain proper nutrition and a balanced diet.',
      'Monitor for symptoms such as weakness, swelling, or fatigue.',
      'Follow treatment plans for underlying kidney, liver, or nutritional conditions.',
      'Seek medical attention if nail changes persist or worsen.',
    ],
    validatedSource: 'Cleveland Clinic – Muehrcke Lines',
  },
};

export function isDiagnosisLabel(value: string): value is DiagnosisLabel {
  return value === 'unidentified' || (CLASS_LABELS as readonly string[]).includes(value);
}

export function getConditionInfo(label: string): ConditionInfo {
  const normalized = label.trim();
  const aliasMap: Record<string, DiagnosisLabel> = {
    'Acral Lentiginous Melanoma': 'acral_lentiginous_melanoma',
    'Melanoma': 'acral_lentiginous_melanoma',
    'Beau Lines': 'beau_lines',
    'Beau\'s Lines': 'beau_lines',
    'beau_lines': 'beau_lines',
    'Blue Finger': 'blue_finger',
    'Cyanosis': 'blue_finger',
    'Nail Clubbing': 'clubbing',
    'Clubbing': 'clubbing',
    'Healthy Nails': 'healthy_nails',
    'healthy_nails': 'healthy_nails',
    'Healthy': 'healthy_nails',
    'healthy': 'healthy_nails',
    'Koilonychia': 'koilonychia',
    'Spoon Nails': 'koilonychia',
    'Muehrckes Lines': 'muehrckes_lines',
    'Muehrcke\'s Lines': 'muehrckes_lines',
    'Nail Pitting': 'pitting',
    'Pitting': 'pitting',
    'pitting': 'pitting',
    'Unidentified': 'unidentified',
    'Undefined': 'unidentified',
  };

  const safeLabel = isDiagnosisLabel(normalized) ? normalized : (aliasMap[normalized] ?? 'unidentified');
  return CONDITION_INFO[safeLabel as DiagnosisLabel] || CONDITION_INFO['unidentified'];
}
