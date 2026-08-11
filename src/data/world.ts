import { Island } from '../types';

export const islands: Island[] = [
  {
    id: 'center',
    name: '중앙섬',
    climate: '다양함',
    cityLevel: '대도시형',
    organization: 'LADER & PACTUM',
    position: [0, 0, 0],
  },
  {
    id: 'north',
    name: '북쪽 섬',
    climate: '한랭 기후',
    cityLevel: '지방 도시와 시골의 중간',
    organization: 'NIVALI',
    position: [0, 0, -36],
  },
  {
    id: 'south',
    name: '남쪽 섬',
    climate: '온난 기후',
    cityLevel: '지방 도시와 시골의 중간',
    organization: 'SOLARIA',
    position: [0, 0, 36],
  },
  {
    id: 'east',
    name: '동쪽 섬',
    climate: '사계절 기후',
    cityLevel: '지방 도시와 시골의 중간',
    organization: 'EASTER',
    position: [36, 0, 0],
  },
  {
    id: 'west',
    name: '서쪽 섬',
    climate: '사계절 기후',
    cityLevel: '지방 도시와 시골의 중간',
    organization: 'ORIA',
    position: [-36, 0, 0],
  },
];
