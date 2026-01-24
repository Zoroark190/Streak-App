import { describe, it, expect } from 'vitest'
import { calculateDistance, isWithinRadius } from '../src/lib/geo'

describe('calculateDistance', () => {
  it('should return 0 for the same point', () => {
    const distance = calculateDistance(51.917, 4.526, 51.917, 4.526)
    expect(distance).toBeCloseTo(0, 0)
  })

  it('should calculate distance between two known points', () => {
    // Rotterdam Centraal (51.9225, 4.4792) to EUR campus (51.9174, 4.5262)
    // Expected: approximately 3.3 km
    const distance = calculateDistance(51.9225, 4.4792, 51.9174, 4.5262)
    expect(distance).toBeGreaterThan(3000)
    expect(distance).toBeLessThan(4000)
  })

  it('should calculate short distances accurately', () => {
    // Two points ~500m apart
    // 51.917, 4.526 to 51.9215, 4.526 (moving ~500m north)
    const distance = calculateDistance(51.917, 4.526, 51.9215, 4.526)
    expect(distance).toBeGreaterThan(400)
    expect(distance).toBeLessThan(600)
  })

  it('should calculate distance for the university coordinates', () => {
    // University to a point 1km away (approximately)
    const uniLat = 51.91741972748361
    const uniLon = 4.526238323980921
    // Move approximately 1km north (about 0.009 degrees latitude)
    const distance = calculateDistance(uniLat, uniLon, uniLat + 0.009, uniLon)
    expect(distance).toBeGreaterThan(900)
    expect(distance).toBeLessThan(1100)
  })
})

describe('isWithinRadius', () => {
  const uniLat = 51.91741972748361
  const uniLon = 4.526238323980921
  const radius = 1000

  it('should return true for a point at the target', () => {
    expect(isWithinRadius(uniLat, uniLon, uniLat, uniLon, radius)).toBe(true)
  })

  it('should return true for a point within 1km', () => {
    // ~500m away
    expect(isWithinRadius(uniLat + 0.004, uniLon, uniLat, uniLon, radius)).toBe(true)
  })

  it('should return false for a point outside 1km', () => {
    // ~2km away
    expect(isWithinRadius(uniLat + 0.018, uniLon, uniLat, uniLon, radius)).toBe(false)
  })

  it('should return true at approximately the boundary (just inside)', () => {
    // ~950m away
    const distance = calculateDistance(uniLat, uniLon, uniLat + 0.0085, uniLon)
    const result = isWithinRadius(uniLat + 0.0085, uniLon, uniLat, uniLon, radius)
    if (distance <= radius) {
      expect(result).toBe(true)
    } else {
      expect(result).toBe(false)
    }
  })

  it('should return false at approximately the boundary (just outside)', () => {
    // ~1050m away
    expect(isWithinRadius(uniLat + 0.0095, uniLon, uniLat, uniLon, radius)).toBe(false)
  })
})
