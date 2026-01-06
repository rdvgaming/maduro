// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Use base path only in production (GitHub Pages)
const base = process.env.NODE_ENV === "production" ? "/maduro" : "/";

// https://astro.build/config
export default defineConfig({
  site: "https://rdvgaming.github.io",
  base: base,
  integrations: [
    starlight({
      title: "The Maduro Games",
      description: "A collection of games by rdvgaming",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/rdvgaming/maduro",
        },
      ],
      sidebar: [
        {
          label: "Games",
          items: [
            { label: "Maduro Survivors", slug: "games/maduro-survivors" },
          ],
        },
      ],
    }),
  ],
});
