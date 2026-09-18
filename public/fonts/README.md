# Self-hosted fonts

## Cabinet Grotesk (headlines)

Cabinet Grotesk is published by [Fontshare](https://www.fontshare.com/fonts/cabinet-grotesk)
(Indian Type Foundry), not Google Fonts, so it cannot be loaded through
`next/font/google`. It has to be self-hosted.

**To activate it**, download the family and place the variable files here:

```
public/fonts/CabinetGrotesk-Variable.woff2     <- required
public/fonts/CabinetGrotesk-Variable.ttf       <- optional fallback
```

Nothing else needs changing. The `@font-face` rule and the `--f-display` stack
in `app/globals.css` already point at these paths.

### What happens until then

Every headline renders in **Space Grotesk**. A `src` that 404s makes the browser
skip the `@font-face` and continue down the font stack, so the site looks
finished either way — it just isn't using the intended display face yet.

This is why the rule is a plain `@font-face` rather than `next/font/local`:
`next/font/local` resolves paths at build time and fails the build outright when
a file is missing, which would block anyone from building the repo until the
licensed files were committed.

### Licence

Check Fontshare's licence terms before committing the files to a public
repository. The Fontshare licence permits web use, but redistributing the font
binaries in a public repo is a separate question from using them on a site. If
that is a concern, ship the files through the deployment pipeline (or a private
asset store) instead of committing them here.
