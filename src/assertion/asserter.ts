import * as assert from 'assert'
import AssertionDefinition, {Assertion} from '../assertion'
import {Capture} from '../capture'

export default class Asserter {
  public static assert(
    caseName: string,
    assertions: AssertionDefinition[],
    captures: Capture[],
  ): Assertion[] {
    return assertions.map(definition =>
      Asserter.apply(caseName, definition, captures),
    )
  }

  private static apply(
    caseName: string,
    definition: AssertionDefinition,
    captures: Capture[],
  ): Assertion {
    const matchingCaptures = captures.filter(
      capture =>
        capture.caseName === caseName && capture.name === definition.name,
    )
    if (matchingCaptures.length !== 1) {
      throw new Error(
        `Capture "${
          definition.name
        }" does not exist or is ambiguous for asserting: ${JSON.stringify(
          captures,
        )}`,
      )
    }

    const matchingCapture = matchingCaptures.pop()

    return {
      caseName: caseName,
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
