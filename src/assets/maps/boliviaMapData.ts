import boliviaPathsData from './bolivia-paths.json';

export interface BoliviaDepartmentPath {
  id: string;
  name: string;
  d: string;
  center: { x: number; y: number };
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

export const BOLIVIA_DEPARTMENT_PATHS: BoliviaDepartmentPath[] = (boliviaPathsData as { id: string; name: string; d: string }[]).map(item => ({
  id: item.id,
  name: SVG_ID_TO_DEPARTMENT_NAME[item.id] || item.name,
  d: item.d,
  center: CENTERS[item.id] || { x: 500, y: 500 }
}));
