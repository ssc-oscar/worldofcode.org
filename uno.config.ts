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
    presetAnimations(),
    presetShadcn({
      color: 'slate',
      // With default setting for SolidUI, you need to set the darkSelector option.
      darkSelector: '[data-kb-theme="dark"]'
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
