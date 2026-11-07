import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['caption', 'body-sm', 'body', 'title-sm', 'title', 'display'] }],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
