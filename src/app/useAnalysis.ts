import { type AnalysisResult, analyze } from '@/core/analysis'
import type { Project } from '@/core/model'
import { useProjectStore } from '@/store/projectStore'
import { type Issue, validateProject } from './validation'

const cache = new WeakMap<Project, AnalysisResult>()

export function analyzeCached(project: Project): AnalysisResult {
  const cached = cache.get(project)
  if (cached) return cached
  const result = analyze(project)
  cache.set(project, result)
  return result
}

export function useAnalysis(): AnalysisResult {
  const project = useProjectStore((state) => state.project)
  return analyzeCached(project)
}

const issueCache = new WeakMap<Project, Issue[]>()

export function useIssues(): Issue[] {
  const project = useProjectStore((state) => state.project)
  const cached = issueCache.get(project)
  if (cached) return cached
  const issues = validateProject(project, analyzeCached(project))
  issueCache.set(project, issues)
  return issues
}
