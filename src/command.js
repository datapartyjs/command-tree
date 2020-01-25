const Bossy = require('@hapi/bossy')
const debug = require('debug')('command-tree.command')

/**
 * Interface for commands to extend
 * @interface
 */
class Command {
  constructor({ definition, usage, description, context }){
    this.context = context
    this.usage = usage
    this.description = description
    this.definition = definition
  }

  /**
   * Command invocation
   * @abstract
   * @return {string}
   */
  static get command(){
    throw new Error('not implemented')
  }

  /**
 * A command flag definition map as defined in @hapi/bossy 
 * @typedef {Object} BossyDefinition
 */

  /**
   * A `@hapi/bossy` definition object, see: {@link https://hapi.dev/family/bossy/?v=4.1.3#definition-object|Bossy docs}
   * @abstract
   * @returns {Object} A `@hapi/bossy` definition object
   */
  static get Definition(){
    throw new Error('not implemented')
  }

  
  /**
   * @method
   */
  async parse({argv}){
    return await Bossy.parse(this.definition, {argv})
  }

  /**
   * @abstract
   */
  async run({parsed}){
    throw new Error('not implemented')
  }

  /**
   * Process output into requested format
   * @abstract
   * @returns {string}
   */
  async format({format, output}){
    debug('warn - Command.format default')
    return null
  }

  
}

module.exports = Command
