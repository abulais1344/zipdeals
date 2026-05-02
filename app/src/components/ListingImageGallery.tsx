"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  imageUrls: string[];
  title: string;
  mainWrapperClassName?: string;
  thumbnailsWrapperClassName?: string;
  thumbnailClassName?: string;
  sizes?: string;
  imageClassName?: string;
  enableLightbox?: boolean;
}

export default function ListingImageGallery({
  imageUrls,
  title,
  mainWrapperClassName = "aspect-[4/3] relative bg-gray-100",
  thumbnailsWrapperClassName = "flex gap-2 p-3 overflow-x-auto",
  thumbnailClassName = "relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border transition-colors",
  sizes = "(max-width: 768px) 100vw, 768px",
  imageClassName = "object-contain",
  enableLightbox = false,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <>
      <div className={mainWrapperClassName}>
        {enableLightbox ? (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label={`Enlarge image ${activeIndex + 1}`}
            className="absolute inset-0 h-full w-full"
          >
            <Image
              src={imageUrls[activeIndex]}
              alt={`${title} image ${activeIndex + 1}`}
              fill
              sizes={sizes}
              className={imageClassName}
              priority={activeIndex === 0}
            />
          </button>
        ) : (
          <Image
            src={imageUrls[activeIndex]}
            alt={`${title} image ${activeIndex + 1}`}
            fill
            sizes={sizes}
            className={imageClassName}
            priority={activeIndex === 0}
          />
        )}
      </div>
      {imageUrls.length > 1 && (
        <div className={thumbnailsWrapperClassName}>
          {imageUrls.map((url, idx) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Open image ${idx + 1}`}
              className={`${thumbnailClassName} ${
                idx === activeIndex
                  ? "border-orange-500 ring-2 ring-orange-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Image src={url} alt={`${title} thumbnail ${idx + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      {enableLightbox && isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 p-4 sm:p-8 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} enlarged image preview`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close enlarged image preview"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={18} />
          </button>
          <div
            className="relative h-[80vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={imageUrls[activeIndex]}
              alt={`${title} enlarged image ${activeIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}