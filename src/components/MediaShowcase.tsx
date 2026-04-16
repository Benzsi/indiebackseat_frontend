import { useEffect, useMemo, useRef, useState } from 'react';
 
interface MediaFile {
  path: string;
  type: 'image' | 'video';
}

interface ShowcaseProps {
  gameTitle: string;
}

const mediaModules = import.meta.glob('../../MediaFiles/**/*.{png,jpg,jpeg,webp,gif,mp4,webm,mov,ogg}', {
  eager: true,
  import: 'default',
});

const navButtonClass =
  'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#87BAC3]/70 bg-transparent text-2xl font-black text-[#D6F4ED] transition hover:scale-105 hover:border-[#D6F4ED] hover:text-[#87BAC3]';

const videoExtensions = new Set(['mp4', 'webm', 'mov', 'ogg']);

function normalizeGameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractFolderName(modulePath: string): string {
  const segments = modulePath.split('/');
  return segments[3] ?? '';
}

function extractExtension(modulePath: string): string {
  const fileName = modulePath.split('/').pop() ?? '';
  const extension = fileName.split('.').pop() ?? '';
  return extension.toLowerCase();
}

function buildMediaFiles(gameTitle: string): MediaFile[] {
  const normalizedTitle = normalizeGameKey(gameTitle);

  return Object.entries(mediaModules)
    .filter(([modulePath]) => normalizeGameKey(extractFolderName(modulePath)) === normalizedTitle)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, undefined, { sensitivity: 'base' }))
    .map(([modulePath, assetPath]) => ({
      path: String(assetPath),
      type: videoExtensions.has(extractExtension(modulePath)) ? 'video' : 'image',
    }));
}
 
export function Showcase({ gameTitle }: ShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const mediaFiles = useMemo(() => buildMediaFiles(gameTitle), [gameTitle]);
  const currentFile = mediaFiles[currentIndex] ?? null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [gameTitle]);

  useEffect(() => {
    if (!currentFile || currentFile.type !== 'video' || !videoRef.current) {
      return;
    }

    void videoRef.current.play().catch(() => {
      // Autoplay can still be blocked in some browsers.
    });
  }, [currentFile]);

  useEffect(() => {
    if (!currentFile || currentFile.type !== 'image') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleNext();
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentFile, mediaFiles.length]);

  if (mediaFiles.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-[#53629E]/60 bg-[#2A1F45] px-6 text-center text-sm text-[#87BAC3]/75">
          Ehhez a játékhoz még nincs média a MediaFiles mappában.
        </div>
      </section>
    );
  }
 
  return (
    <section className="mb-6 space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#53629E]/60 bg-[#2A1F45] shadow-xl shadow-black/20">
        <button
          type="button"
          onClick={handlePrevious}
          aria-label="Previous"
          className={`${navButtonClass} left-3`}
        >
          <span aria-hidden="true">‹</span>
        </button>
 
        <div className="aspect-video w-full overflow-hidden bg-[#1a1228]">
          {currentFile.type === 'video' ? (
            <video
              key={currentFile.path}
              ref={videoRef}
              src={currentFile.path}
              onEnded={handleNext}
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={currentFile.path}
              alt="Game media"
              className="h-full w-full object-cover"
            />
          )}
        </div>
 
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next"
          className={`${navButtonClass} right-3`}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
 
      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-[#53629E]/50 bg-[#473472]/60 px-4 py-3">
          {mediaFiles.map((file, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to media ${index + 1}`}
              aria-pressed={currentIndex === index}
              className={`flex h-3 w-3 rounded-full border transition ${
                currentIndex === index
                  ? 'scale-125 border-[#D6F4ED] bg-[#D6F4ED]'
                  : 'border-[#87BAC3]/80 bg-transparent hover:bg-[#87BAC3]/60'
              }`}
              title={`${file.type === 'video' ? 'Video' : 'Image'} ${index + 1}`}
            >
              <span className="sr-only">Media {index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}