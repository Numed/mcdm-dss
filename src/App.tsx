import { Suspense, lazy, useEffect } from 'react'
import { AppShell } from '@/app/AppShell'
import { ReplaceProjectDialog } from '@/app/ReplaceProjectDialog'
import { type RouteId, routeMeta, useRoute } from '@/app/routes'
import { useApplyTheme } from '@/app/theme'
import { useUndoShortcuts } from '@/app/useUndoShortcuts'
import { PageSkeleton } from '@/components/app/PageSkeleton'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { OverviewPage } from '@/pages/overview/OverviewPage'

const AlternativesPage = lazy(() => import('@/pages/alternatives/AlternativesPage').then((module) => ({ default: module.AlternativesPage })))
const GoalsPage = lazy(() => import('@/pages/goals/GoalsPage').then((module) => ({ default: module.GoalsPage })))
const ParamsPage = lazy(() => import('@/pages/params/ParamsPage').then((module) => ({ default: module.ParamsPage })))
const ResultsPage = lazy(() => import('@/pages/results/ResultsPage').then((module) => ({ default: module.ResultsPage })))
const SensitivityPage = lazy(() => import('@/pages/sensitivity/SensitivityPage').then((module) => ({ default: module.SensitivityPage })))
const ComparePage = lazy(() => import('@/pages/compare/ComparePage').then((module) => ({ default: module.ComparePage })))
const MethodPage = lazy(() => import('@/pages/method/MethodPage').then((module) => ({ default: module.MethodPage })))
const PresentationPage = lazy(() => import('@/pages/present/PresentationPage').then((module) => ({ default: module.PresentationPage })))
const ReportPage = lazy(() => import('@/pages/report/ReportPage').then((module) => ({ default: module.ReportPage })))

type PageProps = {
  route: RouteId
}

function Page(props: PageProps) {
  switch (props.route) {
    case 'alternatives':
      return <AlternativesPage />
    case 'goals':
      return <GoalsPage />
    case 'params':
      return <ParamsPage />
    case 'results':
      return <ResultsPage />
    case 'sensitivity':
      return <SensitivityPage />
    case 'compare':
      return <ComparePage />
    case 'method':
      return <MethodPage />
    default:
      return <OverviewPage />
  }
}

export default function App() {
  const route = useRoute()
  useApplyTheme(route === 'report')
  useUndoShortcuts()

  useEffect(() => {
    document.title = `${routeMeta(route).title} · СППР: вибір альтернатив за групами цілей`
    window.scrollTo({ top: 0 })
  }, [route])

  return (
    <TooltipProvider delayDuration={300}>
      {route === 'report' && (
        <Suspense fallback={null}>
          <ReportPage />
        </Suspense>
      )}
      {route === 'present' && (
        <Suspense fallback={null}>
          <PresentationPage />
        </Suspense>
      )}
      {route !== 'report' && route !== 'present' && (
        <AppShell route={route}>
          <Suspense fallback={<PageSkeleton />}>
            <Page route={route} />
          </Suspense>
        </AppShell>
      )}
      <ReplaceProjectDialog />
      <Toaster />
    </TooltipProvider>
  )
}
