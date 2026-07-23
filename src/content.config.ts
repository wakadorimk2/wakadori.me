import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const localizedText = z.object({
  ja: z.string(),
  en: z.string(),
});

const image = z.object({
  src: z.string(),
  alt: z.string(),
  caption: localizedText.optional(),
});

const works = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/works" }),
  schema: z.object({
    slug: z.string(),
    type: z.enum(["illustration", "software"]),
    title: localizedText,
    year: z.number().int(),
    summary: localizedText,
    cover: image,
    shape: z.enum(["portrait", "landscape", "square", "wide"]),
    externalLinks: z.array(
      z.object({
        label: z.string(),
        href: z.string().url(),
      }),
    ),
    process: z.array(image).optional(),
    details: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
    note: z.string().optional(),
    layer: z.string().optional(),
  }),
});

export const collections = { works };
