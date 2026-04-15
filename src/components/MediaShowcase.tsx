import { useEffect, useRef, useState } from 'react';
 
interface MediaFile {
  path: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

const navButtonClass =
  'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#87BAC3]/70 bg-transparent text-2xl font-black text-[#D6F4ED] transition hover:scale-105 hover:border-[#D6F4ED] hover:text-[#87BAC3]';
 
export function Showcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
 
  const screenshotImage = new URL('../../MediaFiles/dead-cells6.jpg', import.meta.url).href;
  const trailerVideo = new URL('../../MediaFiles/Dead Cells - Launch Trailer _ PS4.mp4', import.meta.url).href;
  const reviewImage = new URL('../../MediaFiles/dead-cells-review-3.jpg', import.meta.url).href;
  const coverImage = new URL('../../MediaFiles/dead-cells-yiml8.png', import.meta.url).href;
 
  // Media files from MediaFiles folder
  const mediaFiles: MediaFile[] = [
    {
      path: trailerVideo,
      type: 'video',
      thumbnail: reviewImage,
    },
    {
      path: screenshotImage,
      type: 'image',
      thumbnail: screenshotImage,
    },
    {
      path: reviewImage,
      type: 'image',
      thumbnail: reviewImage,
    },
    {
      path: coverImage,
      type: 'image',
      thumbnail: coverImage,
    },
  ];
 
  const currentFile = mediaFiles[currentIndex];

  useEffect(() => {
    if (currentFile.type !== 'video' || !videoRef.current) {
      return;
    }

    void videoRef.current.play().catch(() => {
      // Autoplay can still be blocked in some browsers.
    });
  }, [currentFile]);
 
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };
 
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };
 
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