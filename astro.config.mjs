// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Use custom ASTRO_BASE_PATH environment variable, default to "/"
const base = process.env.ASTRO_BASE_PATH || "/";

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
