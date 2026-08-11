import type { CSSProperties } from 'react';

export const CHARACTER_IMAGE_IDS = {
  'song-seoyeon': 1,
  'yu-haein': 2,
  'ha-siyeon': 3,
  'han-yuna': 4,
  'lim-harin': 5,
  'chae-nahyeon': 6,
  'chae-ina': 7,
  tabi: 8,
  'han-jiwon': 9,
  sage: 10,
  'yoon-seha': 11,
  'yoon-hyunah': 12,
  iruha: 13,
  setsuna: 14,
  sui: 15,
  'kim-jihyun': 16,
  aira: 17,
  sora: 18,
  'geum-hana': 19,
  oharu: 20,
  chris: 21,
} as const;

export type CharacterImageKey = keyof typeof CHARACTER_IMAGE_IDS;
export type BattleImageNumber = 14 | 15;

export interface CharacterBattleImage {
  characterId: number;
  imageNumber: BattleImageNumber;
  url: string;
}

const CHARACTER_IMAGE_BASE_URL = 'https://igx.kr/r/t8';
const BATTLE_IMAGE_NUMBERS: readonly BattleImageNumber[] = [14, 15];
const RIGHT_SHIFTED_CHARACTER_IDS = new Set([4, 18, 19]);
const IMAGE_SPECIFIC_RIGHT_SHIFT = new Map<string, number>([
  ['10:15', 3.5],
  ['19:15', 5.5],
]);

function getBattleImageCharacterId(url?: string) {
  if (!url) return undefined;

  const match = url.match(/\/t8\/(\d+)\/(?:14|15)(?:[?#].*)?$/);
  if (!match) return undefined;

  const characterId = Number(match[1]);
  return characterId >= 1 && characterId <= 21
    ? characterId
    : undefined;
}

export function getCharacterImageUrl(characterKey: string, imageNumber = 0) {
  const characterId = CHARACTER_IMAGE_IDS[characterKey as CharacterImageKey];
  return characterId
    ? `${CHARACTER_IMAGE_BASE_URL}/${characterId}/${imageNumber}`
    : undefined;
}

export function getCharacterImageStyleById(
  characterId?: number,
  imageNumber = 0,
): CSSProperties | undefined {
  if (!characterId) return undefined;

  const imageSpecificShift = IMAGE_SPECIFIC_RIGHT_SHIFT.get(`${characterId}:${imageNumber}`);
  if (imageSpecificShift !== undefined) {
    return {
      transform: `translateX(${imageSpecificShift}%) scale(1.055)`,
      transformOrigin: 'center top',
      imageRendering: 'auto',
    };
  }

  if (!RIGHT_SHIFTED_CHARACTER_IDS.has(characterId)) {
    return { imageRendering: 'auto' };
  }

  return {
    objectPosition: '53.5% top',
    imageRendering: 'auto',
  };
}

export function getCharacterImageStyle(
  characterKey: string,
  imageNumber = 0,
): CSSProperties | undefined {
  return getCharacterImageStyleById(
    CHARACTER_IMAGE_IDS[characterKey as CharacterImageKey],
    imageNumber,
  );
}

export function createRandomBattleImage(excludeUrl?: string): CharacterBattleImage {
  const excludedCharacterId = getBattleImageCharacterId(excludeUrl);
  const availableCharacterCount = excludedCharacterId ? 20 : 21;
  const randomCharacterIndex = Math.floor(Math.random() * availableCharacterCount);
  const characterId = excludedCharacterId && randomCharacterIndex >= excludedCharacterId - 1
    ? randomCharacterIndex + 2
    : randomCharacterIndex + 1;
  const imageNumber = BATTLE_IMAGE_NUMBERS[
    Math.floor(Math.random() * BATTLE_IMAGE_NUMBERS.length)
  ];

  return {
    characterId,
    imageNumber,
    url: `${CHARACTER_IMAGE_BASE_URL}/${characterId}/${imageNumber}`,
  };
}
