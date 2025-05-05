---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: <img src="/envarna/img/banner.svg">
  text: Settings managed.
  tagline: Make settings first-class citizens in your application.

  image:
    src: /img/hero.svg
    alt: pointw.com

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
    details: With envarna, every configuration value is strongly typed.  No more <span class="code">process.env.FOO</span> && <span class="code">parseInt(...)</span> littered across your codebase. Instead, you define settings using decorators and envarna handles parsing and coercion automatically.<br/><br/><br/><br/><br/>
    linkText: Learn more
    link: /introduction/quickstart
  - title: Validation and Defaults
    icon: 🛡️
    details: Envarna enforces validation rules at startup, not at some unpredictable failure point in production. If a setting is malformed, envarna will stop the app with a clear, actionable message. You can also declare sane defaults inline, making it easy to boot a service in development without requiring <span class="code">.env</span> setup or manual guards everywhere.<br/><br/><br/>
    linkText: Learn more
    link: /introduction/quickstart
  - title: Centralized, Modular Settings
    icon: 🗂️
    details: In most dotenv-based apps, your config is fragmented across files and buried in conditional logic. Envarna changes that. All environment variables live in clearly defined settings classes, grouped by concern.  For example, <span class="code">DatabaseSettings</span> or <span class="code">EmailSettings</span>. This makes configuration discoverable, traceable, and easy to reason about, especially for new developers and for DevOps.
    linkText: Learn more
    link: /introduction/quickstart
  - title: Injectable and Testable
    icon: 🧪
    details: Unlike dotenv, which pollutes global state, Envarna settings are injectable. This makes testing a breeze.  You can instantiate a settings object with test values or mock data. No need to mutate <span class="code">process.env</span> or reload modules. You can even load settings from alternate sources (e.g., secrets managers or scenario-driven test configs) without changing the rest of your application code.
    linkText: Learn more
    link: /introduction/quickstart
---

This site is under development as we are on the verge of releasing our first major set of products.

Please stay tuned!
for more and more
