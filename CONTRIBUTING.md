# Development

Use Node.js 22 or newer. Install the lockfile versions and start the app:

```sh
npm ci
npm run dev
```

Before a pull request:

```sh
npm run format
npm run check
```

Keep the height-field solver independent of the DOM and Three.js. Solver changes
should be checked against a known surface or a geometric invariant. Shader changes
should be inspected in a real WebGL 2 browser with the grid background and both
ordinary and strongly refracted presets.

Check shape switching, text input, draw/erase/undo, zero height, mask import,
comparison mode and PNG export when changing interactions. Include screenshots
for visible changes. Do not add external test artwork, dependency directories,
build output, credentials or personal paths to commits.

The CI workflow runs formatting, numerical tests and a production build. It does
not claim cross-browser or GPU rendering coverage.

On `main`, the workflow also fetches checksum-verified reference images and deploys
the checked build to GitHub Pages. Pull requests cannot publish the site. The Vite
build uses relative asset paths, so JavaScript, CSS and the height-field Worker must
continue to work under the `/waterdrop-lab/` project path.
