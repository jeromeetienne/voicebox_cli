---
name: okforge-query
description: >-
  Read-only browser for any Open Knowledge Format (OKF) knowledge bundle — a tree
  of markdown concept files. Use it whenever the user wants to browse, explore, map,
  or navigate a knowledge bundle; asks "what concepts are in <bundle>", "what links
  to X" / "what does X link to", "show me the OKF graph", "find orphan or broken
  concepts", or "summarize recent changes"; or points at a directory of markdown docs
  with frontmatter and `index.md` / `log.md` files — even when they never say "OKF".
  Prefer this skill for any read-only question about such a bundle's structure,
  concepts, links, or history. It never edits the bundle.
---

# Browse an OKF knowledge bundle

OKF is a plain-markdown knowledge format: a **bundle** is a directory tree, a
**concept** is any non-reserved `.md` file, and its **Concept ID** is the
bundle-relative path minus `.md` (`tables/users.md` → `tables/users`). `index.md`
and `log.md` are reserved at every level (listing and change-history). Concepts
cross-link with markdown links, forming a directed, untyped graph.

This skill is **strictly read-only**: never create, edit, move, or delete bundle
files. Identify every concept by its Concept ID. The format details — link
resolution, frontmatter, reserved files, hygiene definitions — live in
[references/okf-rules.md](references/okf-rules.md); consult it whenever a link does
not resolve as expected or you are classifying files or reporting hygiene.

## Tools: deterministic script first, built-ins as fallback

The graph-heavy queries (neighbors, orphans, broken links, shortest path, hub
ranking, the overview) are answered deterministically by:

```bash
npx okforge graph <op> --bundle <bundle-root>     # JSON on stdout
#   overview | concept <id> | neighbors <id> [--hops N] | orphans | broken | path <a> <b>
```

**Prefer the script** for anything graph-wide (overview, orphans, broken, neighbors,
path) — it parses every doc once and resolves both link forms correctly. If `npx
okforge graph` is unavailable (older okforge, offline, non-Node repo), fall back to
built-in tools: **Glob** to enumerate, **Grep** to find links/fields, **Read** for
content. Always grep before reading whole files, and lean on `index.md` for
progressive disclosure rather than reading everything.

## Locate the bundle root

If the user gives a path, use it. Otherwise find the directory holding a root
`index.md` (ideally with `okf_version: "0.1"` in frontmatter): `Glob **/index.md`,
then prefer the shallowest, or grep for `okf_version`. A common location is `.okf/` (or `okf/`).

## Operations

1. **Overview / map** — `graph overview`. Report concept count, per-group counts,
   the top hub concepts (most inbound), and orphan/broken counts. Fallback: read the
   root `index.md`, count concepts with `Glob`, descend into nested `index.md` only
   as needed.
2. **Open concept** — `graph concept <id>`. Show a one-line frontmatter summary
   (type · title · description · tags), then the body (Read the file), then its
   **outbound** and **inbound** links. Fallback: Read the file for body + outbound;
   `Grep` the bundle for links resolving to it for inbound.
3. **Neighbors** — `graph neighbors <id> [--hops N]` (default 1 hop = inbound +
   outbound). Grouped by distance.
4. **Search** — match a term/tag across frontmatter and/or bodies. Use `Grep`
   (`-i`, `output_mode: files_with_matches` first, then targeted reads). Return
   Concept ID + title + one-line description per hit.
5. **Filter** — list concepts whose `type:` or `tags:` match. `Grep` for
   `^type:` / `tags:.*<value>` across the bundle, then summarize.
6. **Hygiene** — `graph orphans` and `graph broken`. Orphans = concepts with no
   inbound link from another concept (an index listing does not count); broken =
   in-bundle `.md` targets that do not exist. Broken links are valid in OKF — only
   report them, never treat them as errors.
7. **Recent changes** — Read `log.md` files (root and nested). Respect newest-first
   order and ISO `## YYYY-MM-DD` headings; summarize the most recent entries.
8. **Path** *(optional)* — `graph path <from> <to>` for the shortest directed link
   path between two concepts.

## Output conventions

- Identify every concept by its **Concept ID**, with title + one-line description
  where it aids reading.
- Keep listings compact; group by directory or `type`.
- Clearly separate reserved files (`index.md`, `log.md`) from concepts.
- Never modify the bundle, and never fabricate frontmatter, links, or counts — if
  the script is unavailable and a query is expensive, say what you sampled.
