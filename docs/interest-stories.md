# Editing the Rabbit Holes section

The Personal tab's **Rabbit Holes** section is intentionally a collection of living drafts.

## Where to edit
- All eight interest cards and stories live in `index.html`, inside `<section id="interests">`.
- Each card is a `<button class="interest-trigger" data-interest="...">`.
- Each story is a matching `<template id="interest-...">`. Keep these IDs paired.
- Edit the paragraphs inside each `<template>` as ideas develop. There is no need to edit `script.js` for copy changes.
- If a story doesn't yet have specifics, leave it brief rather than inventing achievements or claiming an interest is completed.

## Adding personal photos
1. Add your own JPG, PNG, or WebP to a new `assets/interests/` folder.
2. Inside the corresponding story template (ideally between the story title and the first section), insert:

```html
<figure>
  <img class="interest-photo" src="assets/interests/your-photo.webp"
       alt="Describe what the photograph actually shows" loading="lazy">
  <figcaption>One sentence about why this image matters.</figcaption>
</figure>
```

3. Keep the image optional. The site is designed to look complete without photos. Prefer one meaningful photograph to a generic gallery.
4. Avoid pictures revealing private details you wouldn't want public on the internet.

## Narrative idea
- **The rabbit hole:** What sparked a period of intense curiosity?
- **What changed or became second nature:** What did repeated practice teach you?
- **What stayed with me:** What skill, perspective, taste, or connection remains now?

These are flexible prompts, not a mandatory maturity scale. Interests can cycle back into active exploration later.

## What the implementation does
The visible cards stay compact. When a visitor selects a card, JavaScript clones its existing story template into the detail panel. Only one story opens at a time. The color and typography automatically follow the site's active theme.
