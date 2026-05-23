# Documentation Workflow

The project documentation is built with `mdbook v0.5.2`.

## Install mdBook

On macOS with Homebrew:

```bash
brew install mdbook
```

With Cargo:

```bash
cargo install mdbook --version 0.5.2 --locked
```

Confirm the installed version:

```bash
mdbook --version
```

## Build The Book

```bash
npm run docs:build
```

The generated HTML is written to `book/`, which is ignored by Git.

## Serve Locally

```bash
npm run docs:serve
```

This starts a local mdBook server for browsing the documentation while editing.
