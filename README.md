# ArtLens

React, TypeScript and Vite interface for the Image Recognition laboratory.

## Run

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and creates the production bundle. `npm run lint` checks ESLint.

## API integration

Mock mode is enabled by default. Copy `.env.example` to `.env.local`, then set `VITE_USE_MOCK_API=false` and optionally `VITE_API_BASE_URL=http://localhost:8000`. Restart Vite after changing environment variables. For a different API origin, configure FastAPI CORS to allow the frontend origin.

`src/api/analysisApi.ts` selects the service and implements multipart `POST /api/analyses` and polling `GET /api/analyses/{analysisId}`. Both services implement `AnalysisApi` from `src/types/analysis.ts`. Comparison responses use a result with `model: "comparison"`, `simple_ann`, `cnn`, and `agreement`; each model entry has the same prediction and probabilities fields as a single model response. Failed jobs can return `status: "failed"` and an `error` message.

The mock simulates model-specific stages over four seconds. Its predictions are demonstration data, derived from filename and random seed, not image recognition. Full probability distributions are returned for every result type.

## Structure

- `src/components/`: reusable upload, configuration, progress, results, and export controls.
- `src/types/analysis.ts`: shared settings, request, result, and service contracts.
- `src/api/`: real and mock service implementations, independent of rendering.
- `src/data/styleAssets.ts`: replaceable local artwork mapping. `public/art/` contains original SVG placeholders, not historical artworks.
- `src/utils/file.ts`: image validation, decoding, and metadata.
- `src/utils/exportResult.ts`: rendered-result capture using html-to-image; PNG/JPEG encoding and a 24-bit BMP encoder.
- `src/App.tsx`: separate upload and analysis state, request guard, polling, and cancellation on unmount.

Images are limited to 30 MB. Result exports include the current rendered result cards or probability panels, excluding the uploaded painting and controls. Typography uses Google Fonts with local sans-serif/Georgia fallbacks.
