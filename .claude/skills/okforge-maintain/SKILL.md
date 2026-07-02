---
name: okforge-maintain
description: >-
  Maintain the Open Knowledge Format (OKF) knowledge bundle under .okf/. Use
  whenever the user wants to update, refresh, or regenerate OKF docs, set up an
  OKF bundle, check OKF conformance, or when source code that the bundle
  documents (config schemas, web API routes, CLI commands, runtime subsystems,
  example crews, ADRs) has changed and the docs need to catch up. Three modes:
  scaffold (create the bundle), refresh (regenerate a folder's docs from current
  source), and check (conformance and dead-link lint). Prefer this skill over
  hand-editing .okf/ so the format, the folder<->source mapping, and link
  integrity stay consistent.
---

# Open Knowledge Format (OKF) maintenance

OKF is an open, human- and agent-friendly format for knowledge — the metadata
and curated insight that surrounds a system. This repo's bundle lives at `.okf/`.
Spec: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md

The bundle is **derived** from source. Each folder is generated from specific
files; when those files change, the folder's docs drift. This skill keeps three
things consistent so you can focus on accurate prose: the OKF format, the
folder<->source mapping, and link integrity.

A bundled CLI owns the mechanics; you own the prose. Run it with `npx` from the
project root (Node >= 20.12):

```bash
npx okforge <command>          # map | folders | sources <folder> | stale | check | nudge
```

## Pick the mode from what the user asked

- **"refresh okf", "update the OKF docs for X", "the API changed, update okf"**
  → Refresh mode (the common case).
- **"set up okf", "create an OKF bundle", bundle missing** → Scaffold mode.
- **"check okf", "is the bundle conformant", "any dead links"** → Check mode.

## The folder <-> source mapping

The mapping is **per-repository data**, declared in `.okforge.config.json` at the
project root. okforge ships with none of it. The file shape is:

```json
{
  "folders": {
    "runtime_concepts": ["packages/foo/src/model/", "packages/foo/src/event/"],
    "config_formats": ["packages/foo/data/schemas/thing.schema.json"]
  }
}
```

Each key is an OKF concept folder; each value is the list of source path prefixes
that folder is derived from. `npx okforge map` prints the resolved mapping;
`npx okforge sources <folder>` prints one folder's source paths;
`npx okforge folders` lists the declared folders. Never hardcode the mapping in
docs — read it from the config so there is one source of truth (the hook reads it
too). When the codebase moves, edit `.okforge.config.json`.

## Refresh mode

1. Determine which folder(s) to refresh. If the user named one, use it. If they
   said "whatever changed", run `npx okforge stale` — it lists folders whose
   source changed since HEAD without the folder being edited.
2. For each folder, run `npx okforge sources <folder>` and **READ those real
   files**.
3. Regenerate the affected concept docs from what you read, following the OKF
   authoring rules below. Only rewrite docs whose underlying source actually
   changed; leave correct docs untouched. Preserve existing filenames unless the
   source they document was renamed or removed.
4. If a concept's source was deleted, delete its doc and remove it from the
   folder `index.md`. If a new source appeared, add a new concept doc and link
   it from `index.md`.
5. Update the folder `index.md`, and if folders were added/removed update the
   root `.okf/index.md`, the `.okforge.config.json` mapping, and prepend a dated
   entry to `.okf/log.md`.
6. Run `npx okforge check` and resolve every problem it reports before finishing.

## Scaffold mode

Create `.okforge.config.json` at the project root with the folder<->source
mapping for this repository (ask the user or infer it from the layout). Then
create `.okf/index.md` (the only file with frontmatter: `okf_version: "0.1"` and
`type: Bundle Index`) and `.okf/log.md`. Create the folders from the mapping and
refresh each. Finish with `npx okforge check`.

## Check mode

Run `npx okforge check`. It verifies snake_case names, that every non-index `.md`
has a non-empty frontmatter `type`, that sub-folder `index.md` files carry no
frontmatter, and that bundle-relative `.md` links resolve. Report results; fix
problems if the user asked you to.

## OKF authoring rules (follow exactly when writing docs)

- **File names**: snake_case only. No kebab-case, no spaces.
- **Concept docs**: every non-index `.md` starts with a YAML frontmatter block
  delimited by `---` lines. Required: `type` (non-empty, e.g. `Config Format`,
  `Concept`, `Data Model`, `API Endpoint`, `CLI Command`, `Crew`, `Package`).
  Recommended: `title`, `description` (one sentence), `resource` (path/URI of
  the real underlying asset), `tags`, `timestamp` (ISO 8601 — set to today's
  date on refresh).
- **Body**: favor structural markdown — headings, lists, tables, fenced code —
  over prose. Use conventional sections where they apply: `# Schema` (field/
  shape), `# Examples` (code), `# Citations` (sources).
- **Index files** (reserved): `index.md` has NO frontmatter (except the root
  bundle index). It lists the folder's concepts as bulleted markdown links with
  one-line descriptions, optionally grouped under `#` headings.
- **Links**: cross-link concepts with relative markdown paths from the doc, e.g.
  `[job store](../runtime_concepts/job_store.md)` or `[sibling](./sibling.md)`.
  Never use bundle-root absolute paths (those beginning with `/`, e.g.
  `/runtime_concepts/job_store.md`). Link to real repo source files (in
  `# Citations`) with repo-relative paths from the doc, e.g.
  `../../packages/foo/src/model/job_store.ts`.
- **Grounding (critical)**: every claim must come from the real source you read.
  Do not invent field names, routes, flags, states, or behavior. If uncertain,
  omit. Quote real schema fields and real route paths.
- **Style**: plain English, no slang, no abbreviations.

## Companion hook

A `Stop` hook (`npx okforge nudge`, registered in `.claude/settings.json`) nudges
at session end when mapped source changed but `.okf/` was not updated. It reads the
same `.okforge.config.json` mapping via `npx okforge stale`, so editing the
mapping updates both the skill and the nudge.
