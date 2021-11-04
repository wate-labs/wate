import {Command, flags} from '@oclif/command'
import * as Chalk from 'chalk'
import * as indent from 'indent-string'
import * as fs from 'fs'
import * as path from 'path'

const {bold} = Chalk

export default class EnvironmentsCommand extends Command {
  static description = 'list the available environments'

  static examples = ['$ wate list:environments']

  static dir = 'environments'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(EnvironmentsCommand)
    if (!fs.existsSync(EnvironmentsCommand.dir)) {
      this.error('Could not find environments directory')
    }

    const collectionsAndEnvironments = this.listCollectionsAndEnvironments(
      EnvironmentsCommand.dir,
    )
    if (collectionsAndEnvironments.length === 0) {
      this.error('No collections or environments found')
    }
    const description = 'The following collections and environments were found.'
    const collections = this.listCollections(collectionsAndEnvironments)

    const environments = this.listEnvironments(collectionsAndEnvironments)
    const output = [description, collections, environments].join('\n\n')

    this.log(output)
  }

  listCollectionsAndEnvironments(
    currentPath: string,
  ): Array<CollectionOrEnvironments> {
    const entries: Array<CollectionOrEnvironments> = []
    fs.readdirSync(currentPath).forEach(entry => {
      const collectionOrEnvironment: CollectionOrEnvironments =
        this.newCollectionOrEnvironment()
      const newPath = path.join(currentPath, entry)
      collectionOrEnvironment.name = path.basename(entry, '.json')
      if (fs.lstatSync(newPath).isDirectory()) {
        collectionOrEnvironment.type = 'collection'
        collectionOrEnvironment.children =
          this.listCollectionsAndEnvironments(newPath)
      }
      entries.push(collectionOrEnvironment)
    })

    return entries
  }

  newCollectionOrEnvironment(): CollectionOrEnvironments {
    return {
      name: '',
      type: 'environment',
      children: [],
    }
  }

  listCollections(
    collectionsAndEnvironments: Array<CollectionOrEnvironments>,
  ): string {
    const collections = this.extractCollections(collectionsAndEnvironments)

    return [bold('COLLECTIONS'), collections.join('\n')].join('\n')
  }

  extractCollections(
    collectionsAndEnvironments: Array<CollectionOrEnvironments>,
    ind = 2,
  ) {
    let collections: Array<string> = []
    collectionsAndEnvironments.forEach(entry => {
      if (entry.type === 'collection') {
        collections.push(indent(entry.name, ind))
      }
      if (entry.children.length > 0) {
        collections = collections.concat(
          this.extractCollections(entry.children, ind + 2),
        )
      }
    })

    return collections
  }

  listEnvironments(
    collectionsAndEnvironments: Array<CollectionOrEnvironments>,
  ): string {
    const environments = this.extractEnvironments(collectionsAndEnvironments)

    return [bold('ENVIRONMENTS'), environments.join('\n')].join('\n')
  }

  extractEnvironments(
    collectionsAndEnvironments: Array<CollectionOrEnvironments>,
    collection = '',
  ) {
    let environments: Array<string> = []
    collectionsAndEnvironments.forEach(entry => {
      if (entry.type === 'environment') {
        environments.push(indent(`${collection}${entry.name}`, 2))
      }
      if (entry.children.length > 0) {
        const parentCollection = collection + `${entry.name}/`
        environments = environments.concat(
          this.extractEnvironments(entry.children, parentCollection),
        )
      }
    })

    return environments
  }
}

interface CollectionOrEnvironments {
  type: string;
  name: string;
  children: CollectionOrEnvironments[];
}
