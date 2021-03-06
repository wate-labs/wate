import {Command, Flags} from '@oclif/core'
import * as Chalk from 'chalk'
import * as indent from 'indent-string'
import * as fs from 'node:fs'
import * as path from 'node:path'

const {bold} = Chalk

export default class RequestsCommand extends Command {
  static description = 'list the available collections and requests'

  static examples = ['$ wate list:requests']

  static dir = 'requests'

  static flags = {
    help: Flags.help({char: 'h'}),
  }

  async run() {
    this.parse(RequestsCommand)
    if (!fs.existsSync(RequestsCommand.dir)) {
      this.error('Could not find requests directory')
    }

    const collectionsAndRequests = this.listCollectionsAndRequests(
      RequestsCommand.dir,
    )
    if (collectionsAndRequests.length === 0) {
      this.error('No collections or requests found')
    }

    const description = 'The following collections and requests were found.'
    const collections = this.listCollections(collectionsAndRequests)

    const requests = this.listRequests(collectionsAndRequests)
    const output = [description, collections, requests].join('\n\n')

    this.log(output)
  }

  listCollectionsAndRequests(currentPath: string): Array<CollectionOrRequest> {
    const entries: Array<CollectionOrRequest> = []
    for (const entry of fs.readdirSync(currentPath)) {
      const collectionOrRequest: CollectionOrRequest =
        this.newCollectionOrRequest()
      const newPath = path.join(currentPath, entry)
      collectionOrRequest.name = entry
      if (fs.lstatSync(newPath).isDirectory()) {
        collectionOrRequest.type = 'collection'
        collectionOrRequest.children = this.listCollectionsAndRequests(newPath)
        if (collectionOrRequest.children.length === 0) {
          collectionOrRequest.type = 'request'
        }

        entries.push(collectionOrRequest)
      }
    }

    return entries
  }

  newCollectionOrRequest(): CollectionOrRequest {
    return {
      name: '',
      type: 'request',
      children: [],
    }
  }

  listCollections(collectionsAndRequests: Array<CollectionOrRequest>): string {
    const collections = this.extractCollections(collectionsAndRequests)

    return [bold('COLLECTIONS'), collections.join('\n')].join('\n')
  }

  extractCollections(
    collectionsAndRequests: Array<CollectionOrRequest>,
    ind = 2,
  ) {
    let collections: Array<string> = []
    for (const entry of collectionsAndRequests) {
      if (entry.type === 'collection') {
        collections.push(indent(entry.name, ind))
      }

      if (entry.children.length > 0) {
        collections = collections.concat(
          this.extractCollections(entry.children, ind + 2),
        )
      }
    }

    return collections
  }

  listRequests(collectionsAndRequests: Array<CollectionOrRequest>): string {
    const requests = this.extractRequests(collectionsAndRequests)

    return [bold('REQUESTS'), requests.join('\n')].join('\n')
  }

  extractRequests(
    collectionsAndRequests: Array<CollectionOrRequest>,
    collection = '',
  ) {
    let requests: Array<string> = []
    for (const entry of collectionsAndRequests) {
      if (entry.type === 'request') {
        requests.push(indent(`${collection}${entry.name}`, 2))
      }

      if (entry.children.length > 0) {
        const parentCollection = collection + `${entry.name}/`
        requests = requests.concat(
          this.extractRequests(entry.children, parentCollection),
        )
      }
    }

    return requests
  }
}

interface CollectionOrRequest {
  type: string;
  name: string;
  children: CollectionOrRequest[];
}
