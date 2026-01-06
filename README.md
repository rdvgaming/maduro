# The Maduro Games

A collection of browser-based games built with Astro and TypeScript.

Sponsored by **rdvgaming**.

## Games

### Maduro Survivors
A survivor-style action game where you battle waves of enemies, collect upgrades, and try to survive as long as possible.

- **Controls**: WASD or Arrow Keys to move
- **Features**: Multiple characters, various enemy types, upgrade system, wave-based difficulty

Play at: [/games/maduro-survivors/](/games/maduro-survivors/)

## Project Structure

```
├── public/
│   └── assets/maduro-survivors/    # Game image assets
├── src/
│   ├── lib/maduro-survivors/       # Game TypeScript modules
│   ├── components/                 # Astro components (GameEmbed)
│   └── content/docs/               # Game pages (MDX)
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Development

```bash
# Install dependencies
npm install

# Start dev server at localhost:4321
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Astro** with Starlight theme
- **TypeScript** for game logic
- **HTML Canvas** for rendering
- **Vite** for bundling

## License

All rights reserved.
