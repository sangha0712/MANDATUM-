import { RandomScanImage } from './CharacterScanImage';
import type { ScanPanelImage } from './CharacterScanImage';
import { createRandomWebtoonImage } from '../data/webtoon';

interface WebtoonScanImageProps {
  active: boolean;
}

function createRandomWebtoonPanelImage(excludeUrl?: string): ScanPanelImage {
  return { url: createRandomWebtoonImage(excludeUrl) };
}

export function WebtoonScanImage({ active }: WebtoonScanImageProps) {
  return (
    <RandomScanImage
      active={active}
      createRandomImage={createRandomWebtoonPanelImage}
      placeholderText="WEBTOON VISUAL"
      objectPositionClassName="object-center"
      scanColor="#FFB45E"
    />
  );
}
