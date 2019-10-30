
const debug = require('debug')('command-tree.command')

class Command {
  constructor({ definition, usage, description, context }){
    this.context = context
    this.usage = usage
    this.description = description
    this.definition = definition
  }

  static get command(){
    throw new Error('not implemented')
  }

  static get Definition(){
    throw new Error('not implemented')
  }

  async parse({argv}){
    return await Bossy.parse(this.definition, {argv})
  }

  async run({parsed}){
    throw new Error('not implemented')
  }

  async format({format, output}){
    debug('warn - Command.format default')
    return null
  }

  
}

module.exports = Command