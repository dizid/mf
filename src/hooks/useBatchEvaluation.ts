'use client'

import { useState, useCallback, useEffect } from 'react'

export interface BatchItem {
  id: string
  name: string
  url: string
  status: 'pending' | 'creating' | 'evaluating' | 'completed' | 'failed'
  projectId?: string
  error?: string
}

interface UseBatchEvaluationReturn {
  queue: BatchItem[]
  isProcessing: boolean
  progress: { completed: number; failed: number; total: number }
  addToQueue: (items: { name: string; url: string }[]) => void
  startProcessing: () => void
  pauseProcessing: () => void
  retryFailed: () => void
  clearQueue: () => void
}

const STORAGE_KEY = 'batch-evaluation-queue'

export function useBatchEvaluation(): UseBatchEvaluationReturn {
  const [queue, setQueue] = useState<BatchItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [shouldProcess, setShouldProcess] = useState(false)

  // Load queue from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Reset any 'creating' or 'evaluating' statuses to 'pending' on reload
        const restored = parsed.map((item: BatchItem) => ({
          ...item,
          status: ['creating', 'evaluating'].includes(item.status) ? 'pending' : item.status,
        }))
        setQueue(restored)
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Save queue to localStorage on changes
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [queue])

  // Process queue
  useEffect(() => {
    if (!shouldProcess || isProcessing) return

    const pendingItem = queue.find(item => item.status === 'pending')
    if (!pendingItem) {
      setShouldProcess(false)
      return
    }

    processItem(pendingItem.id)
  }, [shouldProcess, isProcessing, queue])

  const processItem = async (itemId: string) => {
    setIsProcessing(true)

    try {
      // Update status to creating
      setQueue(prev => prev.map(item =>
        item.id === itemId ? { ...item, status: 'creating' as const } : item
      ))

      const item = queue.find(i => i.id === itemId)
      if (!item) throw new Error('Item not found')

      // Step 1: Create project
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, url: item.url }),
      })

      if (!createRes.ok) {
        const error = await createRes.json()
        throw new Error(error.error?.message || 'Failed to create project')
      }

      const project = await createRes.json()

      // Update with projectId and status
      setQueue(prev => prev.map(i =>
        i.id === itemId ? { ...i, projectId: project.id, status: 'evaluating' as const } : i
      ))

      // Step 2: Run AI evaluation
      const evalRes = await fetch('/api/ai-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (!evalRes.ok) {
        const error = await evalRes.json()
        throw new Error(error.error?.message || 'AI evaluation failed')
      }

      const evalData = await evalRes.json()

      // Step 3: Save evaluation with default personal scores
      const saveRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          scores: {
            ...evalData.scores,
            passion: 5,
            learning: 5,
            pride: 5,
          },
          notes: {
            usability: evalData.reasoning?.usability,
            value: evalData.reasoning?.value,
            features: evalData.reasoning?.features,
            polish: evalData.reasoning?.polish,
            competition: evalData.reasoning?.competition,
            market: evalData.reasoning?.market,
            monetization: evalData.reasoning?.monetization,
            maintenance: evalData.reasoning?.maintenance,
            growth: evalData.reasoning?.growth,
          },
        }),
      })

      if (!saveRes.ok) {
        const error = await saveRes.json()
        throw new Error(error.error?.message || 'Failed to save evaluation')
      }

      // Mark as completed
      setQueue(prev => prev.map(i =>
        i.id === itemId ? { ...i, status: 'completed' as const } : i
      ))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setQueue(prev => prev.map(i =>
        i.id === itemId ? { ...i, status: 'failed' as const, error: message } : i
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  const addToQueue = useCallback((items: { name: string; url: string }[]) => {
    const newItems: BatchItem[] = items.map(item => ({
      id: crypto.randomUUID(),
      name: item.name,
      url: item.url,
      status: 'pending',
    }))
    setQueue(prev => [...prev, ...newItems])
  }, [])

  const startProcessing = useCallback(() => {
    setShouldProcess(true)
  }, [])

  const pauseProcessing = useCallback(() => {
    setShouldProcess(false)
  }, [])

  const retryFailed = useCallback(() => {
    setQueue(prev => prev.map(item =>
      item.status === 'failed' ? { ...item, status: 'pending' as const, error: undefined } : item
    ))
    setShouldProcess(true)
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    setShouldProcess(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const progress = {
    completed: queue.filter(i => i.status === 'completed').length,
    failed: queue.filter(i => i.status === 'failed').length,
    total: queue.length,
  }

  return {
    queue,
    isProcessing,
    progress,
    addToQueue,
    startProcessing,
    pauseProcessing,
    retryFailed,
    clearQueue,
  }
}
