import { assertEquals, assertThrows } from 'std/testing/asserts.ts'
import parse, { isCommand, OptionType, parseCommand } from './mod.ts'

Deno.test('isCommand == true', () => {
  assertEquals(isCommand('/hello this is a command'), true)
})

Deno.test('isCommand == false', () => {
  assertEquals(isCommand('hello this is not a command'), false)
})

Deno.test('parseCommand', () => {
  assertEquals(parseCommand('/hello this is a slack-style command'), {
    command: 'hello',
    text: 'this is a slack-style command',
  })
})

Deno.test('command without options', () => {
  assertEquals(parse('/hello'), {
    text: '',
    command: 'hello',
    options: {},
    subCommands: [],
  })
})

Deno.test('command with named options', () => {
  assertEquals(
    parse('/hello message: hello this is my message'),
    {
      command: 'hello',
      text: 'message: hello this is my message',
      options: { message: 'hello this is my message' },
      subCommands: [],
    },
  )
})

Deno.test('command with multiple named options', () => {
  assertEquals(
    parse('/hello message: hello this is my message custom: -O.O-'),
    {
      command: 'hello',
      text: 'message: hello this is my message custom: -O.O-',
      options: { message: 'hello this is my message', custom: '-O.O-' },
      subCommands: [],
    },
  )
})

Deno.test('command with subcommand', () => {
  assertEquals(parse('/todos add name: My Todo Name'), {
    text: 'add name: My Todo Name',
    command: 'todos',
    options: { name: 'My Todo Name' },
    subCommands: ['add'],
  })
})

Deno.test('command with multiple subcommands', () => {
  assertEquals(parse('/todos add shopping veggie: lettuce'), {
    text: 'add shopping veggie: lettuce',
    command: 'todos',
    options: { veggie: 'lettuce' },
    subCommands: ['add', 'shopping'],
  })
})

Deno.test('command with option definition', () => {
  const interaction = parse(
    '/todos add item: lettuce howmany: 2 complete: false',
    [
      { name: 'item', type: OptionType.string },
      { name: 'howmany', type: OptionType.integer },
      { name: 'complete', type: OptionType.boolean },
    ],
  )
  assertEquals(interaction, {
    text: 'add item: lettuce howmany: 2 complete: false',
    command: 'todos',
    options: { item: 'lettuce', howmany: 2, complete: false },
    subCommands: ['add'],
  })
})

Deno.test('command with nested option definition', () => {
  const interaction = parse(
    '/todos add item: lettuce howmany: 2 complete: false',
    [
      {
        name: 'item',
        type: OptionType.string,
        options: [
          { name: 'howmany', type: OptionType.integer },
          { name: 'complete', type: OptionType.boolean },
        ],
      },
    ],
  )
  assertEquals(interaction, {
    text: 'add item: lettuce howmany: 2 complete: false',
    command: 'todos',
    options: { item: 'lettuce', howmany: 2, complete: false },
    subCommands: ['add'],
  })
})

Deno.test('command with single option definition', () => {
  const interaction = parse(
    '/todos add item: lettuce',
    { name: 'item', type: OptionType.string },
  )
  assertEquals(interaction, {
    text: 'add item: lettuce',
    command: 'todos',
    options: { item: 'lettuce' },
    subCommands: ['add'],
  })
})

Deno.test('Error: no content', () => {
  const fn = () => parse('')
  assertThrows(fn, Error, 'no content')
})

Deno.test('Error: no prefix', () => {
  const fn = () => parse('message without a command')
  assertThrows(fn, Error, 'no prefix (not a command)')
})

Deno.test('Error: no body after prefix', () => {
  const fn = () => parse('/')
  assertThrows(fn, Error, 'no body after prefix')
})
