import { useState, useCallback } from 'react'
import { ComplianceOrchestrator } from '../orchestrators/ComplianceOrchestrator'

export function useCompliance() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vatReport, setVatReport] = useState<any | null>(null)
  const [auditLog, setAuditLog] = useState<any[]>([])

  const postDeferredTax = useCallback(async (entityId: string, year: number) => {
    setLoading(true)
    setError(null)
    try {
      return await ComplianceOrchestrator.postDeferredTax(entityId, year)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const postECL = useCallback(async (entityId: string, year: number) => {
    setLoading(true)
    setError(null)
    try {
      return await ComplianceOrchestrator.postECL(entityId, year)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateVATReport = useCallback(async (entityId: string, start: string, end: string) => {
    setLoading(true)
    setError(null)
    try {
      const report = await ComplianceOrchestrator.generateVATReport(entityId, start, end)
      setVatReport(report)
      return report
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAuditLog = useCallback(async (limit = 200) => {
    setLoading(true)
    setError(null)
    try {
      const rows = await ComplianceOrchestrator.fetchAuditLog(limit)
      setAuditLog(rows)
      return rows
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    postDeferredTax,
    postECL,
    generateVATReport,
    loadAuditLog,
    vatReport,
    auditLog,
    loading,
    error
  }
}
