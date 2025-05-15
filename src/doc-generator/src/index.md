---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: <img src="/envarna/img/banner.svg">
  text: Settings managed.
  tagline: Make settings first-class citizens in your application.

  image:
    src: /img/hero.svg
    alt: envarna

  actions:
    - theme: brand
      text: What is envarna?
      link: /introduction/what-is
    - theme: alt
      text: Quickstart
      link: /introduction/quickstart

features:
  - title: Type Safety
    icon: 🧷
    details: With envarna, every configuration value is strongly typed.  No more <span class="code">parseInt(process.env.FOO)</span>. Instead, you define settings using decorators and envarna handles parsing and coercion automatically.<br/><br/><br/><br/><br/>
    linkText: Learn more
    link: /introduction/quickstart
  - title: Validation and Defaults
    icon: 🛡️
    details: Envarna enforces validation rules at startup so you know immediately whether your app has all the settings it needs in the right format. You can also declare sensible defaults inline, making it easy to boot a service in development without requiring <span class="code">.env</span>.<br/><br/><br/><br/>
    linkText: Learn more
    link: /introduction/quickstart
  - title: Centralized, Modular Settings
    icon: 🗂️
    details: In most dotenv-based apps, your config is fragmented across files and buried in conditional logic. Envarna changes that. All environment variables live in clearly defined settings classes, grouped by concern.  For example, <span class="code">DatabaseSettings</span> or <span class="code">EmailSettings</span>. This makes configuration discoverable.<br/><br/>
    linkText: Learn more
    link: /introduction/quickstart
  - title: Injectable and Testable
    icon: 🧪
    details: Envarna settings are injectable. This makes testing a breeze.  You can instantiate a settings object with test values or mock data. No need to mutate <span class="code">process.env</span>. You can even load settings from alternate sources (e.g., secrets managers or scenario-driven test configs) without changing the rest of your application code.
    linkText: Learn more
    link: /introduction/quickstart
---

This site is under development.