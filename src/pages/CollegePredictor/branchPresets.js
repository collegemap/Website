/**
 * Branch groups for preference filtering (entry.branch substring match, case-insensitive).
 */
export const BRANCH_PRESETS = [
  {
    id: 'cse_it',
    label: 'Computer Science / IT / AI',
    keywords: [
      'Computer Science',
      'Information Technology',
      'Data Science',
      'Artificial Intelligence',
    ],
  },
  {
    id: 'ece',
    label: 'Electronics & Communication',
    keywords: ['Electronics and Communication', 'Electronics & Communication'],
  },
  {
    id: 'ee',
    label: 'Electrical / EEE',
    keywords: ['Electrical Engineering', 'Electrical and Electronics', 'Electronics and Instrumentation'],
  },
  {
    id: 'mech',
    label: 'Mechanical',
    keywords: ['Mechanical Engineering'],
  },
  {
    id: 'civil',
    label: 'Civil',
    keywords: ['Civil Engineering'],
  },
  {
    id: 'chem',
    label: 'Chemical / Metallurgy',
    keywords: ['Chemical Engineering', 'Metallurgical', 'Materials Science'],
  },
  {
    id: 'math_comp',
    label: 'Math / Computational',
    keywords: ['Mathematics', 'Computational', 'Statistics'],
  },
  {
    id: 'bio',
    label: 'Biotech / Biomedical',
    keywords: ['Bio Technology', 'Biotechnology', 'Bioinformatics', 'Biomedical'],
  },
  {
    id: 'integrated',
    label: 'Integrated / dual / MBA',
    keywords: ['Integrated', 'Dual Degree', 'MBA', 'M. Tech'],
  },
  {
    id: 'architecture',
    label: 'Architecture / Planning',
    keywords: ['Architecture', 'Planning'],
  },
];

export function branchMatchesPresets(branchName, selectedIds) {
  if (!selectedIds?.length) return true;
  const b = String(branchName || '').toLowerCase();
  for (const id of selectedIds) {
    const preset = BRANCH_PRESETS.find((p) => p.id === id);
    if (!preset) continue;
    if (preset.keywords.some((kw) => b.includes(kw.toLowerCase()))) return true;
  }
  return false;
}
