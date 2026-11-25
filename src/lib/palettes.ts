export const COLOURWAYS = [
  {id:'marchand63',label:'Marchand 63',hex:'#a87936'},{id:'panther',label:'Panther Red',hex:'#bd3542'},
  {id:'architect',label:'Architect',hex:'#426b69'},{id:'blackgold',label:'Black & Gold',hex:'#826b3c'},
  {id:'coastal',label:'Coastal',hex:'#237a8f'},{id:'city',label:'City',hex:'#5565a1'}
] as const;

export type Palette = typeof COLOURWAYS[number]['id'];

const legacy = new Map<string, Palette>([
  ['cobalt', 'city'], ['copper', 'marchand63'], ['forest', 'architect'],
  ['plum', 'city'], ['slate', 'architect'], ['rose', 'panther'],
]);

export function restorePalette(value: unknown): Palette {
  if (typeof value !== 'string') return 'marchand63';
  return COLOURWAYS.find(item => item.id === value)?.id ?? legacy.get(value) ?? 'marchand63';
}
