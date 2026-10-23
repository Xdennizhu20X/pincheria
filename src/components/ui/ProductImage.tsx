"use client";

import React, { useState } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ProductImage({
  src,
  alt,
  className,
  containerClassName,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center",
        containerClassName
      )}
    >
      {/* Resplandor cálido de brasas de fondo */}
      <div className="absolute inset-0 bg-radial from-orange-600/15 via-transparent to-transparent pointer-events-none" />

      {src && !hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
            className
          )}
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-orange-500/80">
          <Flame className="w-8 h-8 animate-pulse text-orange-500" />
          <span className="text-[10px] font-bold text-zinc-500 mt-1">Pinchos</span>
        </div>
      )}
    </div>
  );
}
