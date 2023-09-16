export type InteractionOption = string | number | boolean

export interface Interaction {
  command: string
  text: string
  subCommands?: string[]
  options: { [name: string]: InteractionOption }
}

export interface OptionChoice {
  name: string
  value: string | number
}

export interface OptionDefinition {
  name: string
  type: OptionType
  description?: string
  options?: OptionDefinition[]
  required?: boolean
  min_value?: number
  max_value?: number
  min_length?: number
  max_length?: number
  choices?: OptionChoice[]
}

export enum OptionType {
  sub_command = 1,
  string = 2,
  integer = 3,
  boolean = 4,
  number = 5,
  attachment = 6,
}

const prefix = '/'

export function isCommand(content: string): boolean {
  try {
    parseCommand(content)
    return true
  } catch {
    return false
  }
}

export function parseCommand(
  content: string,
): { command: string; text: string } {
  if (!content) throw new Error('no content')
  const matchedPrefix = content.toLowerCase().startsWith(prefix.toLowerCase())
  if (!matchedPrefix) throw new Error('no prefix (not a command)')

  let text = content.slice(prefix.length).trim()
  if (!text) throw new Error('no body after prefix')

  const command = text.match(/^[^\s]+/i)?.[0]
  if (!command) throw new Error('invalid command')

  text = text.slice(command.length).trim()

  return { command, text }
}

export function parseSubCommands(
  content: string,
  max = 2,
): { subCommands: string[]; remaining: string } {
  const args = content.split(/ +/).filter((arg) => arg.length > 0)

  const subCommands: string[] = []

  for (let i = 0; i < max; i++) {
    if (!args.length) break
    if (args[0]?.endsWith(':')) break
    if (subCommands.length > i) break
    subCommands.push(args[0])
    args.shift()
  }

  return { subCommands, remaining: args.join(' ') }
}

export function parseOptions(
  content: string,
  template?: OptionDefinition | OptionDefinition[],
): { [name: string]: InteractionOption } {
  const args = content.split(/ +/).filter((arg) => arg.length > 0)
  const options: { [name: string]: InteractionOption } = {}

  let name = ''
  let value = ''

  args.forEach((arg: string) => {
    if (arg.endsWith(':')) {
      if (name) {
        options[name] = value
        value = ''
      }
      name = arg.slice(0, -1)
    } else if (name) {
      if (value.length) value += ' '
      value += arg
    } else {
      throw new Error('Invalid arguments')
    }
  })

  if (name) options[name] = value

  if (template) {
    flattenOptionDefinitions(Array.isArray(template) ? template : [template])
      .forEach((definition: OptionDefinition) => {
        const { name, type, required, choices } = definition
        const value = options[name]
        if (value == null) {
          if (required) throw new Error(`missing required option: ${name}`)
          else return
        }
        const parsedValue = parseOptionValue(value, type)
        if (parsedValue === undefined) {
          throw new Error(`Invalid option ${name}: ${options[name]}`)
        }
        if (choices && !choices.find(({ value }) => value === parsedValue)) {
          throw new Error(
            `Option value ${name}: ${parsedValue} is not one of the choices ${choices}`,
          )
        }
        options[name] = parsedValue
      })
  }

  return options
}

function flattenOptionDefinitions(
  definitions: OptionDefinition[],
): OptionDefinition[] {
  let all_options: OptionDefinition[] = []
  definitions.forEach(({ options, ...def }) => {
    all_options.push(def)
    if (options) {
      all_options = all_options.concat(flattenOptionDefinitions(options))
    }
  })
  return all_options
}

export function parseOptionValue(
  value: InteractionOption,
  type: OptionType,
): InteractionOption | void {
  switch (type) {
    case OptionType.attachment:
    case OptionType.string:
      return value
    case OptionType.integer:
    case OptionType.number:
      return Number(value)
    case OptionType.boolean:
      return value === 'true'
  }
}

export default function parse(
  content: string,
  template?: OptionDefinition | OptionDefinition[],
): Interaction {
  const { command, text } = parseCommand(content)
  const { subCommands, remaining } = parseSubCommands(text)
  const options = parseOptions(remaining, template)

  return { command, text, options, subCommands }
}
