import * as assert from 'node:assert'
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
    const matchingCapture = Asserter.matchingCapture(definition, caseName, captures)
    const expected = Asserter.expectedValue(definition, captures)

    return {
      caseName: caseName,
      name: definition.name,
      expected,
      actual: matchingCapture.value,
      matched: Asserter.isMatching(matchingCapture.value, expected),
    }
  }

  private static matchingCapture(definition: AssertionDefinition, caseName: string, captures: Capture[]): any {
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

    return matchingCaptures.pop()
  }

  private static expectedValue(definition: AssertionDefinition, captures: Capture[]): any {
    const expected = definition.expected
    if (Asserter.isCaptureAssertion(definition.expected)) {
      const captureName = definition.expected.replace('$captures.', '')
      const captureValues = captures.filter(capture => capture.name === captureName && definition.name !== capture.name)
      if (captureValues.length === 1) {
        return captureValues.pop()?.value
      }

      return (typeof definition.expected === 'string' || definition.expected instanceof String) ? '###' : definition.expected
    }

    return expected
  }

  private static isCaptureAssertion(expected: any): boolean {
    if (typeof expected === 'string' || expected instanceof String) {
      if (expected.startsWith('$captures.')) {
        return true
      }

      return false
    }

    return false
  }

  private static isMatching(actual: any, expected: any): boolean {
    if (expected === '###') {
      return true
    }

    try {
      assert.deepStrictEqual(actual, expected)
      return true
    } catch {
      return false
    }
  }
}
