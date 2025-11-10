import { defineConfig, withBase } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
const pkg = require('../../../package.json')

const hostname = 'https://pointw-dev.github.io'
const basePath = 'envarna'
const seoLogo = 'https://pointw-dev.github.io/envarna/img/envarna-card.png'
const title = 'envarna'
const tagline = 'Settings managed.'

const calculatedBasePath = (basePath? `/${basePath}/` : '/')
const siteUrl = hostname + calculatedBasePath

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: title,
  description: tagline,

  themeConfig: {
    siteTitle: title,
    stackOverflowTags: ['envarna', 'settings', 'validation'],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/pointw-dev/envarna' }
    ],
    logo: '/img/hero.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quickstart', link: '/introduction/quickstart' },
      { text: pkg.version, link: null }
    ],

    outline: 'deep',
    sidebar: getSidebar(),
    search: {
        provider: 'local',
        options: {
            detailedView: true
        }
    },
    footer:{
      message: 'Released under the <a target="_blank" class="link" href="https://raw.githubusercontent.com/pointw-dev/envarna/refs/heads/main/LICENSE">MIT License</a>.',
      copyright: 'Copyright © 2025 Michael Ottoson (pointw.com)'
    }
  },

  appearance: 'dark',
  base: calculatedBasePath,
  head: [
    ['link', { rel: 'icon', href: `${calculatedBasePath}favicon.ico` }],

    // test with https://www.opengraph.xyz/url/
    ['meta', {property: 'og:image', content: seoLogo}],
    ['meta', {property: "og:url", content: siteUrl}],
    ['meta', {property: "og:description", content: tagline}],
    ['meta', {property: 'og:type', content: 'website'}],

    ['meta', {name: "twitter:card", content: "summary_large_image"}],
    ['meta', {name: 'twitter:image', content: seoLogo}],
    ['meta', {property: "twitter:domain", content: "pointw.com"}],
    ['meta', {property: "twitter:url", content: siteUrl}],
    ['meta', {name: "twitter:title", content: title}],
    ['meta', {name: "twitter:description", content: tagline}]

  ],
  srcDir: 'src',
  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPFeature\.vue$/,
          replacement: fileURLToPath(new URL('./overrides/VPFeature.vue', import.meta.url))
        }
      ]
    }
  },
  sitemap: {
    hostname: siteUrl
  },
  transformPageData(pageData) {
    const canonicalUrl = siteUrl + `${pageData.relativePath}`
        .replace(/index\.md$/, '')
        .replace(/\.md$/, '.html')

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push([
      'link',
      { rel: 'canonical', href: canonicalUrl }
    ])
  }
})


function getSidebar() {
    return [
      {
        text: 'Introduction',
        items: [
          { text: 'What is envarna?', link: '/introduction/what-is' },
          { text: 'Getting started', link: '/introduction/quickstart' }
        ]
      },
      {
        text: 'How-to',
        items: [
          { text: 'Settings classes', link: '/how-to/settings-classes' },
          { text: 'The <code>settings</code> object',  link: '/how-to/settings-object' },
          { text: 'Decorators',  link: '/how-to/decorators' },
          { text: 'Async loading', link: '/how-to/async-loading' },
          { text: 'Command line', link: '/how-to/command-line' },
          { text: 'Testing',  link: '/how-to/testing' },
          { text: 'Module Format Compatibility',  link: '/how-to/module-compatibility' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Decorators', link: '/reference/decorators' },
          { text: 'Validation with v', link: '/reference/validation' },
          { text: 'Naming & aliases', link: '/reference/naming-aliases' },
          { text: 'Security & redaction', link: '/reference/security-redaction' },
          { text: 'Command line', link: '/reference/command-line' },
          { text: 'Error handling', link: '/reference/error-handling' },
        ]
      }
    ]
}
