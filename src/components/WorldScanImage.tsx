import { RandomScanImage } from './CharacterScanImage';
import type { ScanPanelImage } from './CharacterScanImage';
import { WORLD_PANEL_IMAGE_URLS } from '../data/backgrounds';

interface WorldScanImageProps {
  active: boolean;
}

function createRandomWorldImage(excludeUrl?: string): ScanPanelImage {
  const candidates = WORLD_PANEL_IMAGE_URLS.filter((url) => url !== excludeUrl);

  return { url: candidates[Math.floor(Math.random() * candidates.length)] };
}

export function WorldScanImage({ active }: WorldScanImageProps) {
  return (
    <RandomScanImage
      active={active}
      createRandomImage={createRandomWorldImage}
      placeholderText="WORLD VISUAL"
      objectPositionClassName="object-center"
      scanColor="#2DD4FF"
    />
  );
}
