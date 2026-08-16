import { Incident, Relationship } from '../types';

export const archiveCategories = [
  { id: 'storyline', title: 'STORYLINE' },
  { id: 'world', title: 'WORLD' },
  { id: 'pulse', title: 'PULSE' },
  { id: 'history', title: 'HISTORY' },
  { id: 'incidents', title: 'INCIDENTS' },
  { id: 'society', title: 'SOCIETY' },
  { id: 'relationships', title: 'RELATIONSHIPS' },
];

export const incidents: Incident[] = [];

export const relationships: Relationship[] = [
  {
    source: 'kim-jihyun',
    target: 'aira',
    description: '김지현이 아이라를 구했으며, 아이라는 이후 이스터에 들어가 김지현을 돕고 있다.',
  },
  {
    source: 'sora',
    target: 'setsuna',
    description: '친한 관계. 세츠나는 소라를 매우 좋아한다.',
  },
  {
    source: 'setsuna',
    target: 'sora',
    description: '친한 관계. 세츠나는 소라를 매우 좋아한다.',
  },
  {
    source: 'sui',
    target: 'setsuna',
    description: '솔라리아의 리더로서, 니발리의 인력이 부족할 때 스이가 세츠나를 니발리로 파견하기도 한다.',
  },
];
