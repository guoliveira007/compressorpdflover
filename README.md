# Paper Squeeze

Build a 100% client-side PDF Compressor web application based on the user's editorial/paper design:
- 100% in-browser processing using pdfjs-dist and pdf-lib. No files sent to any server.
- Visual style: Paper/editorial aesthetic with warm paper background (#EEF0EC), dark ink text (#1C2321), hairline borders, and terracotta/stamp accents (#A83232), serif headings and mono metrics.
- Upload: Drag-and-drop zone and file picker.
- Controls: Compression level slider with 3 presets (Qualidade, Equilíbrio, Compacto) adjusting canvas resolution and JPEG compression quality per page. Explicit note explaining that pages are re-rendered as compressed images.
- Execution: Interactive progress bar showing page processing progress.
- Results: Before vs after file size comparison, percentage saved, download button for the compressed PDF, and a reset button.
- SEO content block below the fold explaining how browser-side privacy and PDF compression work.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://compressorpdflover.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39febc63-f50e-41c6-9d86-0c0bf4fd2868).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
