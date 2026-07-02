import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function posterUrl(path: string | null, size = "original"): string {
  if (!path)return "/placeholder-poster.svg";
  if (path.startsWith("http")) return path;
  console.log(`https://image.tmdb.org/t/p/${size}/${path}`);
  return `https://image.tmdb.org/t/p/${size}/${path}`;
}
