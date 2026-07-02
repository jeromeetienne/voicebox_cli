# OKF v0.1 rules for browsing

Authoritative source: `okf/SPEC.md` in `github.com/GoogleCloudPlatform/knowledge-catalog`.
OKF is v0.1 and may evolve — if the spec disagrees with anything here, the spec wins.
This file is the detail behind `SKILL.md`; read it when a link does not resolve as
expected, when classifying files, or when reporting hygiene.

## Bundle, concept, Concept ID

- A **bundle** is a directory tree of markdown files. A valid bundle may be a
  subdirectory of a larger repository (e.g. `okf/`), so the *bundle root* is the
  directory you resolve absolute links and Concept IDs against — not the repo root.
- A **concept** is any non-reserved `.md` file.
- A **Concept ID** is the file's path *within the bundle* with `.md` removed:
  `tables/users.md` → `tables/users`. Always identify concepts by Concept ID, never
  by absolute filesystem path.

## Reserved filenames (at every directory level)

Never treat these as concepts; classify them separately in any listing:

- `index.md` — directory listing for progressive disclosure.
- `log.md` — chronological change history, newest first, `## YYYY-MM-DD` headings.

Only the **bundle-root `index.md`** may carry frontmatter, and only to declare
`okf_version: "0.1"`. A directory containing a root `index.md` with `okf_version`
is the surest signal of the bundle root.

## Frontmatter

YAML between `---` delimiters. `type` is the **only required** field. Recommended:
`title`, `description`, `resource`, `tags`, `timestamp`. Arbitrary extra keys are
allowed. **Never reject or warn about** a doc for unknown keys or an unfamiliar
`type` value — tolerate everything; surface what is present.

## Cross-links — the graph

Cross-links are ordinary markdown links. The bundle is a **directed, untyped** graph:
the *meaning* of a link lives in the surrounding prose, not the link. Two forms:

- **Absolute / bundle-relative** — begins with `/`, resolved from the **bundle root**:
  `/tables/customers.md`. The spec's recommended form for stability.
- **Relative** — `./x.md`, `../y/z.md`, resolved from the **current concept's
  directory**. In practice this is the common form in the wild (it renders correctly
  on GitHub and in browsers with no OKF-aware tooling), so expect bundles that are
  entirely relative-linked.

To turn a link into a target Concept ID:

1. Drop any `#anchor` suffix. A pure-anchor link (`#section`) is intra-document — ignore it.
2. Ignore external links (`http://`, `https://`, `mailto:`, any `scheme:` prefix).
3. Ignore targets that are not `.md` (e.g. `.ts`, `.mdx`, `.json` citations of real source).
4. Resolve the path: absolute from the bundle root, relative from the concept's directory.
5. If the resolved path escapes the bundle root (a `../` citation pointing into the
   surrounding repo), it is **not** a bundle concept — ignore it for the graph.
6. Strip `.md` → the target Concept ID.

**Broken links are valid.** A link whose target does not exist may be not-yet-written
knowledge. Never error on one. Only report broken links when the user asks for hygiene,
and only for `.md` targets that resolve *inside* the bundle but point to a missing file.

## Hygiene definitions

- **Orphan** — a concept with no inbound link **from another concept**. Links from
  reserved `index.md` / `log.md` files do **not** rescue a concept from orphan status;
  if they did, every concept listed in an index would count as linked and orphan
  detection would be meaningless. Report orphans as "not referenced by any other
  concept (may still be listed in an index)".
- **Broken link** — see above: an in-bundle `.md` target that does not exist.

## Conventional body headings (informational only)

`# Schema` (fields/shape), `# Examples` (code), `# Citations` (sources). Their presence
or absence is never an error.
