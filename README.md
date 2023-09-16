# Slash Command Parser

A generic parser for slash command text input. Pulls inspiration from Slack and Discord slash commands.

# Usage

Basic Usage:

```ts
import parse from 'https://deno.land/x/slash_command_parser/mod.ts'

parse('/todos add name: My Todo Name')
```

```ts
{
  text: 'add name: My Todo Name',
  command: 'todos',
  options: { name: 'My Todo Name' },
  subCommands: ['add'],
}
```

Pass in a template to parse options:

```ts
import parse, {
  OptionDefinition,
  OptionType,
} from 'https://deno.land/x/slash_command_parser/mod.ts'

const template: OptionDefinition[] = [
  { name: 'item', type: OptionType.string },
  { name: 'howmany', type: OptionType.integer },
  { name: 'complete', type: OptionType.boolean },
]

parse('/todos add item: lettuce howmany: 2 complete: false', template)
```

```ts
{
  text: 'add item: lettuce howmany: 2 complete: false',
  command: 'todos',
  options: { item: 'lettuce', howmany: 2, complete: false },
  subCommands: ['add'],
}
```

If you want greater control over parsing or error handling, you can call each step individually:

```ts
import {
  parseCommand,
  parseOptions,
  parseSubCommands,
} from 'https://deno.land/x/slash_command_parser/mod.ts'

const content = 'add item: lettuce howmany: 2 complete: false'

// Just parsing command + text can give you a "Slack"-style slashcommand
const { command, text } = parseCommand(content)

// Expand to support 4 sub-commands instead of 2
const { subCommands, remaining } = parseSubCommands(text, 4)
const options = parseOptions(remaining, template)

console.log({ command, text, options, subCommands })
```

See more usage examples in the [test file](./mod.test.ts).