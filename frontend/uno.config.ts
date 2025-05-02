import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local';
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';
import presetAnimations from 'unocss-preset-animations';
import { presetShadcn } from 'unocss-preset-shadcn';

export default defineConfig({
  presets: [
    presetUno(),
    // @ts-ignore
    presetAnimations(), 
    presetShadcn({
      color: 'slate',
      darkSelector: ':root[class~="dark"]'
    }),
    presetIcons({
      warn: true
    }),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono'
      },
      processors: createLocalFontProcessor()
    })
  ],
  transformers: [
    // allows class='hover:(text-xl text-underline)'
    transformerDirectives(),
    transformerVariantGroup()
  ],
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        '(components|src)/**/*.{js,ts}'
      ]
    }
  },
  safelist: 'prose prose-sm m-auto text-left'.split(' ')
});
