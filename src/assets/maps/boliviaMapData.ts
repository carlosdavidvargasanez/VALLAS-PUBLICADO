import boliviaPathsData from './bolivia-paths.json';

export interface BoliviaDepartmentPath {
  id: string;
  name: string;
  d: string;
  center: { x: number; y: number };
  blueColor: string;
  blueHover: string;
  orangeColor: string;
  orangeGlow: string;
}

export const SVG_ID_TO_DEPARTMENT_NAME: Record<string, string> = {
  BOL: 'La Paz',
  BOB: 'Beni',
  BOC: 'Cochabamba',
  BOH: 'Chuquisaca',
  BON: 'Pando',
  BOO: 'Oruro',
  BOP: 'Potosí',
  BOS: 'Santa Cruz',
  BOT: 'Tarija'
};

const CENTERS: Record<string, { x: number; y: number }> = {
  BOL: { x: 195, y: 390 },
  BOB: { x: 430, y: 300 },
  BOC: { x: 365, y: 550 },
  BOH: { x: 470, y: 740 },
  BON: { x: 245, y: 140 },
  BOO: { x: 235, y: 650 },
  BOP: { x: 290, y: 780 },
  BOS: { x: 650, y: 530 },
  BOT: { x: 485, y: 885 }
};

export const DEPARTMENT_TONES: Record<string, {
  blueColor: string;
  blueHover: string;
  orangeColor: string;
  orangeGlow: string;
}> = {
  'Santa Cruz': {
    blueColor: '#2563eb', // Royal Blue
    blueHover: '#3b82f6',
    orangeColor: '#ff6d00', // Vivid Sun Orange
    orangeGlow: 'rgba(255, 109, 0, 0.6)'
  },
  'La Paz': {
    blueColor: '#1e3a8a', // Deep Midnight Navy
    blueHover: '#2563eb',
    orangeColor: '#ff3d00', // Neon Fiery Orange
    orangeGlow: 'rgba(255, 61, 0, 0.6)'
  },
  'Cochabamba': {
    blueColor: '#0284c7', // Sky Azure Blue
    blueHover: '#38bdf8',
    orangeColor: '#ff8c00', // Brand Orange Publi-X
    orangeGlow: 'rgba(255, 140, 0, 0.6)'
  },
  'Beni': {
    blueColor: '#0077b6', // Cerulean Amazon Blue
    blueHover: '#0096c7',
    orangeColor: '#fb8c00', // Amber Gold Orange
    orangeGlow: 'rgba(251, 140, 0, 0.6)'
  },
  'Pando': {
    blueColor: '#008b8b', // Dark Cyan Marine Blue
    blueHover: '#06b6d4',
    orangeColor: '#ff7043', // Coral Tangerine Orange
    orangeGlow: 'rgba(255, 112, 67, 0.6)'
  },
  'Oruro': {
    blueColor: '#3730a3', // Electric Indigo Blue
    blueHover: '#4f46e5',
    orangeColor: '#ea580c', // Terracotta Orange
    orangeGlow: 'rgba(234, 88, 12, 0.6)'
  },
  'Potosí': {
    blueColor: '#1e40af', // Deep Sapphire Blue
    blueHover: '#3b82f6',
    orangeColor: '#d84315', // Magma Deep Orange
    orangeGlow: 'rgba(216, 67, 21, 0.6)'
  },
  'Chuquisaca': {
    blueColor: '#0096c7', // Pacific Ocean Blue
    blueHover: '#38bdf8',
    orangeColor: '#f57c00', // Warm Sunset Orange
    orangeGlow: 'rgba(245, 124, 0, 0.6)'
  },
  'Tarija': {
    blueColor: '#0369a1', // Deep Mediterranean Blue
    blueHover: '#0284c7',
    orangeColor: '#ffa000', // Golden Marigold Orange
    orangeGlow: 'rgba(255, 160, 0, 0.6)'
  }
};

export const BOLIVIA_DEPARTMENT_PATHS: BoliviaDepartmentPath[] = (boliviaPathsData as { id: string; name: string; d: string }[]).map(item => {
  const name = SVG_ID_TO_DEPARTMENT_NAME[item.id] || item.name;
  const tones = DEPARTMENT_TONES[name] || {
    blueColor: '#0284c7',
    blueHover: '#38bdf8',
    orangeColor: '#ff8c00',
    orangeGlow: 'rgba(255, 140, 0, 0.6)'
  };

  return {
    id: item.id,
    name,
    d: item.d,
    center: CENTERS[item.id] || { x: 500, y: 500 },
    ...tones
  };
});
