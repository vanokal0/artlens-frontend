# ArtLens

React, TypeScript and Vite interface for the Image Recognition laboratory.

## Run

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`npm run build` checks TypeScript and creates the production bundle. `npm run lint` checks ESLint.

## API integration

The FastAPI backend is enabled by default at `http://127.0.0.1:8000`. Copy `.env.example` to `.env.local` to make the local configuration explicit. Set `VITE_USE_MOCK_API=true` only when the standalone demonstration API is needed. Restart Vite after changing environment variables. For a different API origin, configure FastAPI CORS to allow the frontend origin.

`src/api/analysisApi.ts` selects the service and implements multipart `POST /api/analyses` and polling `GET /api/analyses/{analysisId}`. `src/api/trainingApi.ts` implements optional JSON-based model retraining with `POST /api/training`, `GET /api/training/status`, and `POST /api/training/cancel`. Comparison responses use a result with `model: "comparison"`, `simple_ann`, `cnn`, and `agreement`; each model entry has the same prediction and probabilities fields as a single model response. Failed jobs can return `status: "failed"` and an `error` message.

The optional mock uses fixed Cubism demonstration predictions and simulated processing stages. Full probability distributions are returned for every result type.

## Structure

- `src/components/`: reusable upload, configuration, progress, results, and export controls.
- `src/types/analysis.ts`: shared settings, request, result, and service contracts.
- `src/api/`: real and mock service implementations, independent of rendering.
- `src/data/styleAssets.ts`: replaceable local artwork mapping. `public/art/` contains original SVG placeholders, not historical artworks.
- `src/utils/file.ts`: image validation, decoding, and metadata.
- `src/utils/exportResult.ts`: rendered-result capture using html-to-image; PNG/JPEG encoding and a 24-bit BMP encoder.
- `src/App.tsx`: upload, analysis, and training state; request guards; status polling; and cancellation on unmount.

Images are limited to 30 MB. Result exports include the uploaded painting and the current rendered result cards or probability panels, while excluding unrelated controls. Typography uses Google Fonts with local sans-serif/Georgia fallbacks.
