import { defineConfig, withBase } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
// const pkg = require('../../version_stamp.json')


const hostname = 'https://pointw-dev.github.io/envarna'
const basePath = 'envarna'
const seoLogo = 'https://pointw-dev.github.io/envarna/img/envarna-card.png'
const title = 'envarna'
const tagline = 'Settings managed'

const calculatedBasePath = (basePath? `/${basePath}/` : '/')
const siteUrl = hostname + (basePath? `/${basePath}/` : '')

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: title,
  description: tagline,

  themeConfig: {
    siteTitle: title,
    stackOverflowTags: ['envarna', 'settings', 'validation'],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/pointw-dev' }
    ],
    logo: '/img/hero.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quickstart', link: '/introduction/quickstart' },
      // { text: pkg.version, link: null }
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
      message: 'Released under the <a target="_blank" class="link" href="https://raw.githubusercontent.com/pointw-dev/hypermea/refs/heads/main/LICENSE">MIT License</a>.',
      copyright: 'Copyright © 2019-2025 Michael Ottoson (pointw.com)'
    }
  },

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
          { text: 'What is pointw?', link: '/introduction/what-is' },
          { text: 'Getting started', link: '/introduction/quickstart' }
        ]
      }
    ]
}
