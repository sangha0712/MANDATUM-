import { ImagePlaceholder } from '../components/ImagePlaceholder';
import { BackButton } from '../components/BackButton';
import { WEBTOON_READER_IMAGE_URLS } from '../data/webtoon';

export default function Webtoon() {
  return (
    <div className="relative flex flex-1 flex-col items-center">
      <BackButton />
      <div className="mt-4 flex w-full max-w-3xl flex-col sm:mt-8 md:mt-0">
        <header className="mb-6 border-l-2 pl-4" style={{ borderColor: 'var(--category-accent)' }}>
          <p className="category-route-kicker mb-2 font-mono text-[10px] tracking-[0.22em]">SEQUENTIAL RECORD ONLINE</p>
          <h1 className="category-route-title text-3xl font-bold tracking-widest text-white sm:text-4xl">WEBTOON</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[#8996A3]">Mandatum serialized archive</p>
        </header>

        <div className="category-route-panel -mx-3 border-x border-t bg-[#080B10] sm:mx-0">
          <div className="category-accent-bar h-1 w-full" />
          {WEBTOON_READER_IMAGE_URLS.map((src, index) => (
            <div key={src} className="category-webtoon-page relative w-full bg-[#121A23]">
              <ImagePlaceholder
                src={src}
                loading="lazy"
                alt={`MANDATUM WEBTOON ${index + 1}페이지`}
                text={`WEBTOON PAGE ${index + 1}`}
                className="block h-auto w-full object-contain"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-[#293644] py-20 text-center">
          <p className="mb-4 text-sm uppercase tracking-widest text-[#8996A3]">To be continued...</p>
        </div>
      </div>
    </div>
  );
}

