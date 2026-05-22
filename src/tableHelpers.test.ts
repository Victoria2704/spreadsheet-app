import { describe, expect, it } from 'vitest'
import { calculateFormula, getCellText, getCellType } from '@/tableHelpers'
import type { CellData } from '@/types'

describe('tableHelpers', () => {
  it('определяет тип ячейки', () => {
    expect(getCellType('123')).toBe('number')
    expect(getCellType('true')).toBe('boolean')
    expect(getCellType('=A1+B1')).toBe('formula')
    expect(getCellType('hello')).toBe('string')
  })

  it('считает простые формулы', () => {
    const cells: Record<string, CellData> = {
      '1-0': { value: '10', type: 'number' },
      '1-1': { value: '5', type: 'number' },
    }

    expect(calculateFormula('=A1+B1', cells)).toBe('15')
    expect(calculateFormula('=A1*2', cells)).toBe('20')
  })

  it('считает SUM и AVERAGE', () => {
    const cells: Record<string, CellData> = {
      '1-0': { value: '10', type: 'number' },
      '2-0': { value: '=5+5', type: 'formula' },
      '3-0': { value: '20', type: 'number' },
    }

    expect(calculateFormula('=SUM(A1:A3)', cells)).toBe('40')
    expect(calculateFormula('=AVERAGE(A1:A3)', cells)).toBe(String(40 / 3))
  })

  it('показывает результат формулы в ячейке', () => {
    const cells: Record<string, CellData> = {
      '1-0': { value: '2', type: 'number' },
      '1-1': { value: '=A1*2', type: 'formula' },
    }

    expect(getCellText(cells['1-1'], cells)).toBe('4')
  })
})
