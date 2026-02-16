import { useState, useCallback } from 'react'
import { StatementOrchestrator } from '../orchestrators/StatementOrchestrator'

export function useStatements() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<any[]>([])

  const renderStatement = useCallback(async (entityId: string, periodId: string, type: string) => {
    setLoading(true)
    setError(null)

    try {
      return await StatementOrchestrator.renderStatement(entityId, periodId, type)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStatementLines = useCallback(async (snapshotId: string) => {
    setLoading(true)
    setError(null)

    try {
      const rows = await StatementOrchestrator.getStatementLines(snapshotId)
      setLines(rows)
      return rows
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const finalizeSnapshot = useCallback(async (snapshotId: string) => {
    setLoading(true)
    setError(null)

    try {
      await StatementOrchestrator.finalizeSnapshot(snapshotId)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    renderStatement,
    loadStatementLines,
    finalizeSnapshot,
    lines,
    loading,
    error
  }
}
