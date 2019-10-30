exports.HelpRequest = class HelpRequest extends Error {
  constructor(message) {
    super(message)
    this.name = 'HelpRequest'
  }
}

exports.UsageError = class UsageError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UsageError'
  }
}

exports.UnknownCommandError = class UnknownCommandError extends Error {
  constructor(command) {
    super('No such command [' + command + ']')
    this.name = 'UnknownCommandError'
  }
}

exports.ParseError = class ParseError extends Error {
  constructor(message, parsed) {
    super(message)
    this.name = 'ParseError'
    this.parsed = parsed
  }
}