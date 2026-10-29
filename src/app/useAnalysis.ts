import { type AnalysisResult, analyze } from '@/core/analysis'
import type { Project } from '@/core/model'
import { type RobustnessResult, robustnessAnalysis } from '@/core/robustness'
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

export const ROBUSTNESS_RUNS = 1000
const robustnessCache = new WeakMap<Project, Map<number, RobustnessResult>>()

export function robustnessCached(project: Project, noise: number): RobustnessResult {
  const byNoise = robustnessCache.get(project) ?? new Map<number, RobustnessResult>()
  robustnessCache.set(project, byNoise)
  const cached = byNoise.get(noise)
  if (cached) return cached
  const result = robustnessAnalysis(project, { noise, runs: ROBUSTNESS_RUNS })
  byNoise.set(noise, result)
  return result
}

export function useRobustness(noise: number): RobustnessResult {
  const project = useProjectStore((state) => state.project)
  return robustnessCached(project, noise)
}
