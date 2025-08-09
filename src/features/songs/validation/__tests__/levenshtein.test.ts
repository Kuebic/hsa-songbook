import { describe, it, expect } from 'vitest'
import { levenshteinDistance } from '../utils/levenshtein'

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('test', 'test')).toBe(0)
    expect(levenshteinDistance('', '')).toBe(0)
    expect(levenshteinDistance('hello world', 'hello world')).toBe(0)
  })

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', 'test')).toBe(4)
    expect(levenshteinDistance('test', '')).toBe(4)
  })

  it('should calculate distance for single character differences', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1) // substitution
    expect(levenshteinDistance('cat', 'cart')).toBe(1) // insertion
    expect(levenshteinDistance('cart', 'cat')).toBe(1) // deletion
  })

  it('should calculate distance for multiple differences', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
    expect(levenshteinDistance('saturday', 'sunday')).toBe(3)
    expect(levenshteinDistance('book', 'back')).toBe(2)
  })

  it('should be case sensitive', () => {
    expect(levenshteinDistance('Test', 'test')).toBe(1)
    expect(levenshteinDistance('HELLO', 'hello')).toBe(5)
  })

  it('should handle special characters', () => {
    expect(levenshteinDistance('café', 'cafe')).toBe(1)
    expect(levenshteinDistance('test!', 'test?')).toBe(1)
    expect(levenshteinDistance('hello-world', 'hello_world')).toBe(1)
  })

  it('should handle completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3)
    expect(levenshteinDistance('hello', 'world')).toBe(4)
  })

  it('should handle strings of different lengths', () => {
    expect(levenshteinDistance('short', 'a very long string')).toBe(16)
    expect(levenshteinDistance('x', 'xyz')).toBe(2)
    expect(levenshteinDistance('xyz', 'x')).toBe(2)
  })

  it('should handle unicode characters', () => {
    expect(levenshteinDistance('😀', '😃')).toBe(1)
    expect(levenshteinDistance('你好', '您好')).toBe(1)
    expect(levenshteinDistance('αβγ', 'abc')).toBe(3)
  })

  it('should be symmetric', () => {
    expect(levenshteinDistance('first', 'second')).toBe(levenshteinDistance('second', 'first'))
    expect(levenshteinDistance('test', 'best')).toBe(levenshteinDistance('best', 'test'))
  })
})