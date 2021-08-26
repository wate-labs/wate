import {Command, flags} from '@oclif/command'
import * as Chalk from 'chalk'
import * as indent from 'indent-string'
import * as fs from 'fs'
import * as path from 'path'

const {bold} = Chalk

export default class Suites extends Command {
  static description = 'list the available suites'

  static examples = ['$ artes list:suites']

  static dir = 'suites'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(Suites)
    if (!fs.existsSync(Suites.dir)) {
      this.error('Could not find suites directory.')
    }

    const collectionsAndSuites = this.listCollectionsAndSuites(Suites.dir)
    if (collectionsAndSuites.length === 0) {
      this.error('No collections or suites found.')
    }
    const description = 'The following collections and suites were found.'
    const collections = this.listCollections(collectionsAndSuites)

    const suites = this.listSuites(collectionsAndSuites)
    const output = [description, collections, suites].join('\n\n')

    this.log(output)
  }

  listCollectionsAndSuites(currentPath: string): Array<CollectionOrSuites> {
    const entries: Array<CollectionOrSuites> = []
    fs.readdirSync(currentPath).forEach(entry => {
      const collectionOrSuite: CollectionOrSuites = this.newCollectionOrSuite()
      const newPath = path.join(currentPath, entry)
      collectionOrSuite.name = entry
      if (fs.lstatSync(newPath).isDirectory()) {
        collectionOrSuite.type = 'collection'
        collectionOrSuite.children = this.listCollectionsAndSuites(newPath)
      }
      entries.push(collectionOrSuite)
    })

    return entries
  }

  newCollectionOrSuite(): CollectionOrSuites {
    return {
      name: '',
      type: 'suite',
      children: [],
    }
  }

  listCollections(collectionsAndSuites: Array<CollectionOrSuites>): string {
    const collections = this.extractCollections(collectionsAndSuites)

    return [bold('COLLECTIONS'), collections.join('\n')].join('\n')
  }

  extractCollections(collectionsAndSuites: Array<CollectionOrSuites>, ind = 2) {
    let collections: Array<string> = []
    collectionsAndSuites.forEach(entry => {
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

  listSuites(collectionsAndSuites: Array<CollectionOrSuites>): string {
    const suites = this.extractSuites(collectionsAndSuites)

    return [bold('SUITES'), suites.join('\n')].join('\n')
  }

  extractSuites(
    collectionsAndSuites: Array<CollectionOrSuites>,
    collection = '',
  ) {
    let suites: Array<string> = []
    collectionsAndSuites.forEach(entry => {
      if (entry.type === 'suite') {
        suites.push(indent(`${collection}${entry.name}`, 2))
      }
      if (entry.children.length > 0) {
        const parentCollection = collection + `${entry.name}/`
        suites = suites.concat(
          this.extractSuites(entry.children, parentCollection),
        )
      }
    })

    return suites
  }
}

interface CollectionOrSuites {
  type: string;
  name: string;
  children: CollectionOrSuites[];
}
