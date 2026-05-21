import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-video bg-muted rounded-xl overflow-hidden group cursor-pointer" onClick={() => setShowFullscreen(true)}>
        <img
          src={images[currentIndex]}
          alt={`${title} - Imagem ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === index ? 'border-primary scale-95' : 'border-transparent hover:border-border'
              }`}
            >
              <img src={image} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={images[currentIndex]}
            alt={`${title} - Fullscreen`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
