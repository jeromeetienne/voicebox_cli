---
type: Concept
title: EnumOption
description: A Commander option helper that restricts a value to a fixed set, appends the accepted values to help text, and supports 'list' to print them.
resource: src/misc/enum-option.ts
tags: [library, cli, commander]
timestamp: 2026-07-02
---

# EnumOption

Builds Commander options whose value must belong to a fixed set. Used across the
[CLI commands](../cli_commands/index.md) for `--engine`, `--language`, and
`--model`, whose value sets come from
[engines and languages](../data_models/engines_and_languages.md).

# create

```ts
EnumOption.create(flags, description, values, defaultValue?)
```

- Appends `(one of: …; pass 'list' to see options)` to the help text.
- Passing the literal value `list` prints every accepted value and exits with
  status 0.
- Any other value outside the set raises a Commander `InvalidArgumentError`.
- An optional `defaultValue` is applied when provided.

# Example

```bash
# Print the accepted values for an enum option, then exit
voicebox-cli transcribe file.wav --model list
```

# Citations

- [src/misc/enum-option.ts](../../src/misc/enum-option.ts)
