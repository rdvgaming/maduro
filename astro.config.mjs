// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
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
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
