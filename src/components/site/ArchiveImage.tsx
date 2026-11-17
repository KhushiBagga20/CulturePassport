"use client";

import { useState } from "react";
import type { MediaAsset, MotifKey } from "@/lib/types";
import { mediaSrcSet, mediaUrl, type MediaWidth } from "@/lib/media";
import { Motif } from "@/components/motifs/Motif";

/**
 * A credited archival photograph. Falls back to the tradition's archive illustration
 * (clearly labelled) if the remote image cannot be loaded.
 */
export function ArchiveImage({
  media,
  fallbackMotif,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  width = 960,
  className = "",
  imgClassName = "",
  priority = false,
  showCredit = true,
  cover = true,
  linkCredit = true,
}: {
  media: MediaAsset;
  fallbackMotif: MotifKey;
  sizes?: string;
  width?: MediaWidth;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  showCredit?: boolean;
  cover?: boolean;
  /** set false when the image sits inside another link */
  linkCredit?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`relative overflow-hidden bg-parchment ${className}`}>
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
          <Motif motif={fallbackMotif} className="w-2/3 max-w-56" />
          <span className="label-sm text-center text-ink-mute">Image unavailable offline · archive illustration shown</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote archival media with explicit srcset and credits
        <img
          src={mediaUrl(media, width)}
          srcSet={mediaSrcSet(media)}
          sizes={sizes}
          alt={media.alt}
          width={media.width}
          height={media.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setFailed(true)}
          className={`h-full w-full ${cover ? "object-cover" : "object-contain"} ${imgClassName}`}
        />
      )}
      {showCredit && (
        <figcaption className="label-sm absolute bottom-0 right-0 max-w-full bg-ink/70 px-2 py-1 text-ivory/90 backdrop-blur-sm">
          {linkCredit ? (
            <a href={media.sourcePage} target="_blank" rel="noreferrer" className="hover:underline">
              {media.credit} · {media.license}
            </a>
          ) : (
            <span>
              {media.credit} · {media.license}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
