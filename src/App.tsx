import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/app/AppShell'
import { ReplaceProjectDialog } from '@/app/ReplaceProjectDialog'
import { type RouteId, routeMeta, useRoute } from '@/app/routes'
import { useApplyTheme } from '@/app/theme'
import { useAnalysis } from '@/app/useAnalysis'
import { useUndoShortcuts } from '@/app/useUndoShortcuts'
import { CompareTab } from '@/features/CompareTab'
import { AlternativesPage } from '@/pages/alternatives/AlternativesPage'
import { GoalsPage } from '@/pages/goals/GoalsPage'
import { ParamsPage } from '@/pages/params/ParamsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ResultsPage } from '@/pages/results/ResultsPage'
import { useProjectStore } from '@/store/projectStore'
import { useEffect } from 'react'

type PageProps = {
  route: RouteId
}

function Page(props: PageProps) {
  const project = useProjectStore((state) => state.project)
  const analysis = useAnalysis()
  switch (props.route) {
    case 'alternatives':
      return <AlternativesPage />
    case 'goals':
      return <GoalsPage />
    case 'params':
      return <ParamsPage />
    case 'results':
      return <ResultsPage />
    case 'compare':
      return <CompareTab project={project} analysis={analysis} />
    default:
      return <PlaceholderPage title={routeMeta(props.route).title} />
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
      <AppShell route={route}>
        <Page route={route} />
      </AppShell>
      <ReplaceProjectDialog />
      <Toaster />
    </TooltipProvider>
  )
}
