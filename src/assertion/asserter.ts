import * as assert from 'node:assert'
import AssertionDefinition, {Assertion} from '../assertion'
import {Capture} from '../capture'

export default class Asserter {
  public static assert(
    assertions: AssertionDefinition[],
    captures: Capture[],
    metadata: {case: string, order?: number},
  ): Assertion[] {
    return assertions.map(definition =>
      Asserter.apply(metadata, definition, captures),
    )
  }

  private static apply(
    metadata: {case: string, order?: number},
    definition: AssertionDefinition,
    captures: Capture[],
  ): Assertion {
    const matchingCapture = Asserter.matchingCapture(definition, captures, metadata)
    const expected = Asserter.expectedValue(definition, captures)

    return {
      caseName: metadata.case,
      name: definition.name,
      expected,
      actual: matchingCapture.value,
      matched: Asserter.isMatching(matchingCapture.value, expected),
    }
  }

  private static matchingCapture(definition: AssertionDefinition, captures: Capture[], metadata: {case: string, order?: number}): any {
    const matchingCaptures = captures.filter(
      capture =>
        capture.caseName === metadata.case && capture.name === definition.name && (metadata.order === undefined || capture.order === undefined || capture.order === metadata.order),
    )
    if (matchingCaptures.length !== 1) {
      throw new Error(
        `Capture "${definition.name}" does not exist or is ambiguous for asserting:\n${JSON.stringify(captures)}\n${JSON.stringify(matchingCaptures)}`,
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
