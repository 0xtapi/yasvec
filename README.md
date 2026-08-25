# Vectorapp

A tiny, custom website for presenting one interactive 3D model. Visitors can rotate,
zoom, and pan around the model on desktop or mobile.

## Run it locally

You need a current version of [Node.js](https://nodejs.org/) installed.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally <http://localhost:5173>.

Do not double-click `index.html` or open it with a basic static-file server. The source
uses Vite to resolve Three.js and its model loaders, so it must be started with
`npm run dev`. If port 5173 is already occupied, Vite prints a different port; open
that exact URL instead.

## Set the public model

Put your final model at:

```text
public/models/model.glb
```

The app opens that file immediately. This is the model visitors will see after the site
is built and hosted.

## Lighting

The viewer uses a bundled CC0 Studio HDR environment to create directional light and
reflections while keeping a dark, clean background. Neutral tone mapping and an exposure
of `0.20` are the defaults. Visitors can use the **Lighting** panel to adjust brightness
or switch tone-mapping methods. The light-direction slider rotates the HDR studio light
and a matching directional light around the stationary model. That light casts soft
self-shadows and a soft shadow onto the invisible ground plane beneath the model.

The environment is Poly Haven's
[Studio Small 03](https://polyhaven.com/a/studio_small_03) by Greg Zaal, released under
CC0. Asset provenance is recorded in `public/environments/README.md`.

## Prepare the Vectorworks model

The recommended pipeline is:

1. In Vectorworks, export the visible or selected geometry as **FBX**.
2. Import the FBX into [Blender](https://www.blender.org/).
3. Check scale, orientation, normals, materials, and texture paths.
4. Remove geometry that will never be visible and reduce excessive polygon counts.
5. Export from Blender as **glTF 2.0**, choosing the single-file **GLB** format.

Procedural Vectorworks shaders may need to be baked or replaced with ordinary image
textures. For faster loading, resize unnecessarily large textures before exporting.

## Production build

```bash
npm run build
npm run preview
```

The deployable static site is generated in `dist/`. It can be hosted on any static
host, including Cloudflare Pages, Netlify, Vercel, or GitHub Pages. No server or
database is required.

## Project structure

```text
index.html                  Page markup
src/main.js                 Three.js viewer, lighting, shadows, and controls
src/styles.css              Site design
public/models/model.glb     Your public model (add this file)
```
