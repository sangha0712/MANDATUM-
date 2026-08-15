export type Organization = 'PACTUM' | 'LADER' | 'UNKNOWN' | 'EASTER' | 'ORIA' | 'SOLARIA' | 'NIVALI';

export interface Pulse {
  name: string;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: number | string;
  grade: number | string;
  organization: Organization;
  pulse: Pulse;
  personality: string;
  features: string;
  image?: string;
}

export interface Island {
  id: string;
  name: string;
  climate: string;
  cityLevel: string;
  description: string;
  securityNote: string;
  organization: Organization | 'LADER & PACTUM';
  position: [number, number, number]; // For 3D map
}

export interface HeroOrganizationDetail {
  name: Exclude<Organization, 'UNKNOWN'>;
  status: '국가 공인' | '민간 조직';
  leader: string;
  jurisdiction: string;
  role: string;
  response: string;
  operationsNote: string;
}

export interface Incident {
  id: string;
  title: string;
  image?: string;
  location: string;
  summary: string;
  relatedCharacters: string[];
  result: string;
}

export interface Relationship {
  source: string;
  target: string;
  description: string;
}

