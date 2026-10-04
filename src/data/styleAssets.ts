import type { ArtStyle } from "../types/analysis";
export const styleAssets: Record<
  ArtStyle,
  { image: string; description: string }
> = {
  Baroque: {
    image: "/art/baroque.svg",
    description: "Dramatic light & rich detail",
  },
  Impressionism: {
    image: "/art/impressionism.svg",
    description: "Light, color & fleeting moments",
  },
  Cubism: {
    image: "/art/cubism.svg",
    description: "Geometry & multiple perspectives",
  },
  "Pop Art": {
    image: "/art/pop-art.svg",
    description: "Bold colors & everyday culture",
  },
  "Ukiyo-e": {
    image: "/art/ukiyo-e.svg",
    description: "The art of the floating world",
  },
};
