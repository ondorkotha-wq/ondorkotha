import sanitize from "sanitize-html";

// CMS content is admin-entered HTML rendered on public pages. Strip scripts,
// event handlers and javascript: URLs so a CMS editor account can't run code
// in customers' (or super-admins') browsers.
export function sanitizeCmsHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [...sanitize.defaults.allowedTags, "img"],
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
  });
}
