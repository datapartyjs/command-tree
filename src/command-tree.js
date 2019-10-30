const Hoek = require('@hapi/hoek')
const Bossy = require('@hapi/bossy')
const Traverse = require('traverse')
const deepSet = require('deep-set')

const debug = require('debug')('command-tree')

const Error = require('./error')
const Command = require('./command')

class CommandTree {
  constructor({context, usage, definition} = {} ){
    this.cmds = {}
    this.usage = usage || ''
    this.context = context

    this.definition = {
      o: {
        alias: 'file',
        description: 'Output to file'
      },
      f: {
        alias: 'format',
        type: 'string',
        description: 'Output format',
        default: 'humanize',
        valid: ['json', 'csv', 'humanize', 'table']
      },
      j: {
        alias: 'json',
        type:'boolean',
        description: 'Short hand for -f=json'
      },
      c: {
        alias: 'csv',
        type:'boolean',
        description: 'Short hand for -f=csv'
      },
      h: {
        alias: 'humanize',
        type:'boolean',
        description: 'Short hand for -f=humanize'
      },
      t: {
        alias: 'table',
        type:'boolean',
        description: 'Short hand for -f=table'
      }
    }

    if(definition){
      this.definition = Object.assign(this.definition, definition)
    }
  }

  addCommand(path, cmd){
    if(typeof path =='function' && !cmd){
      let command = path
      path = command.Command.replace(' ', '.')
      deepSet(this.cmds, path, command)
      return  
    }
    
    debug('addCommand -', cmd.prototype instanceof Command)
    deepSet(this.cmds, path, cmd)
  }

  getHelp(){
    let content =  Bossy.usage(this.definition, this.usage) + '\n\n'

    content += 'Commands:\n\n'

    let leaves = Traverse(this.cmds).reduce(function (acc, x) {
      if (x.prototype instanceof Command){ 
        acc.push({
          path: this.path,
          ...this.node.Definition
        })
      }
      return acc;
    }, [])

    leaves.forEach(info=>{
      content += '\t'.repeat(1) + info.path.join(' ') + '\t' + info.description + '\n'
      //const usage = '\t'.repeat(2) + Bossy.usage(info.definition, info.usage).split('\n').join('\n'+('\t'.repeat(2)))
      //content += usage
    })

    return content
  }

  getCmdHelp(path, err){
    const cmd = Hoek.reach(this.cmds, path)
    const info = cmd.Definition

    let content = ''

    if(err){ content += err.name + ' - ' + err.message + '\n\n'}

    content += Bossy.usage(info.definition, info.usage)

    return content
  }

  async run({argv = process.argv, context}){
    debug('argv', argv)

    let globalArgv = []
    let globalParsed = {}

    globalArgv = [].concat(argv.slice(0,2))

    const args = argv.slice(2)

    if(!args || args.length < 1){
      return this.getCmdHelp(opts.path)
    }
  
    let skipable = true
    let selectedNode = null
    let depth = 1
    let currentNode = this.cmds
    let path = []
    for(let arg of args){

      if(skipable && arg[0] == '-'){
        globalArgv.push(arg)
        continue;
      }
      
      const node = Hoek.reach(currentNode, arg)
      const nodeType = typeof node
      
      if(node && node.prototype instanceof Command){
        skipable=false
        selectedNode = node
        path.push(arg)
        break

      } else if(nodeType == 'object'){

        skipable=false
        currentNode = node
        path.push(arg)

      } else if(nodeType == 'undefined'){
        if(skipable){
          globalArgv.push(arg)
          continue
        }
        break
      }
  
      depth++
    }
  
    if(!selectedNode){ throw new Error.UnknownCommandError(args.join(' ')) }


    const command = new selectedNode(context || this.context)


    const scopedArgv = [].concat(process.argv.slice(0,2)).concat(args.slice(depth))
    const scopedArgs = args.slice(depth)
    

    globalParsed = Bossy.parse(this.definition, {argv:globalArgv})

    if(globalParsed.csv){ globalParsed.format = 'csv' }
    if(globalParsed.json){ globalParsed.format = 'json' }
    if(globalParsed.table){ globalParsed.format = 'table' }
    if(globalParsed.humanize){ globalParsed.format = 'humanize' }

    debug('global', globalParsed)

    debug('global', globalArgv)

    let opts = {
      path: path.join('.'),
      argv: scopedArgv,
      args: scopedArgs,
      context: context || this.context,
      format: globalParsed.format
    }

    debug('opts')
    debug(opts)


      try{
        opts.parsed = await command.parse(opts)

        if(opts.parsed instanceof Error){
          throw new Error.UsageError(opts.path.replace('.', ' '))
        }

        opts.output = await command.run(opts)
        opts.formattedOutput = await command.format(opts)
      }
      catch(err){
        debug('error', err)
        if(
          err instanceof Error.UsageError ||
          err instanceof Error.HelpRequest
        ){
          return this.getCmdHelp(opts.path, err)
        }

        throw err
      }

    
    return opts.formattedOutput ? opts.formattedOutput : opts.output
  }
}

module.exports = CommandTree
