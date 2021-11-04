import * as assert from 'assert'
import AssertionDefinition, {Assertion} from '../assertion'
import {Capture} from '../capture'

export default class Asserter {
  public static assert(
    assertions: AssertionDefinition[],
    captures: Capture[],
  ): Assertion[] {
    return assertions.map(definition => Asserter.apply(definition, captures))
  }

  private static apply(
    definition: AssertionDefinition,
    captures: Capture[],
  ): Assertion {
    const matchingCaptures = captures.filter(
      capture => capture.name === definition.name,
    )
    if (matchingCaptures.length !== 1) {
      throw new Error(
        `Capture "${definition.name}" does not exist or is ambiguous for asserting`,
      )
    }

    const matchingCapture = matchingCaptures.pop()

    return {
      name: definition.name,
      expected: definition.expected,
      actual: matchingCapture!.value,
      matched: Asserter.isMatching(matchingCapture!.value, definition.expected),
    }
  }

  private static isMatching(actual: any, expected: any): boolean {
    try {
      assert.deepStrictEqual(actual, expected)
      return true
    } catch (error) {
      return false
    }
  }
}
