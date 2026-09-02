# ZOIA Explorer

A browser-based viewer and editor for Empress Effects ZOIA patch files.

## Firmware compatibility

The module catalog and binary parser have been reviewed against ZOIA firmware 5.41 (June 16, 2026). This includes the firmware 4 sampler and expanded sequencer, firmware 5 Reverse Delay and Univibe, firmware 5.30 Granular grain-size options, and firmware 5.40 MIDI Pitch Bend Out and MIDI Pressure Out modules. Firmware 5.41 only updates the factory `1978 Plate` patch and does not change the patch format or module catalog.

ZOIA firmware 4.20 changed the sequencer's saved-data encoding. Patches containing sequencers that were saved on 4.20 or newer do not load correctly on older firmware. ZOIA Explorer preserves this module-owned data when loading and exporting patches.

Official references:

- [Firmware changelog](https://empresseffects.com/cdn/shop/files/zoia_changelog_79fc7e0a-a748-4381-a0df-0f0866ff01d6.txt)
- [Firmware downloads and update instructions](https://empresseffects.com/blogs/support-zoia/updating-firmware-on-the-zoia-and-euroburo-latest-version)
- [ZOIA module index](https://docs.google.com/spreadsheets/d/1a9q2OCo_Sd_IbWsH99wlFvjcTIN20e7wb5Qgn5fLxms/edit?usp=sharing)
- [Firmware 4.0 Sequencer and Sampler Guide](https://cdn.shopify.com/s/files/1/0028/5462/files/ZOIA_4.0_Sequencer_Sampler_Guide_rev3.pdf?v=1727875139)
- [ZOIA User Manual](https://empresseffects.com/cdn/shop/files/ZOIA_User_Manual_rev02_web.pdf?v=9116714327727882529)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
