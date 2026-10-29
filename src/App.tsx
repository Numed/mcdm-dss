import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/app/AppShell'
import { ReplaceProjectDialog } from '@/app/ReplaceProjectDialog'
import { type RouteId, routeMeta, useRoute } from '@/app/routes'
import { useApplyTheme } from '@/app/theme'
import { useUndoShortcuts } from '@/app/useUndoShortcuts'
import { AlternativesPage } from '@/pages/alternatives/AlternativesPage'
import { GoalsPage } from '@/pages/goals/GoalsPage'
import { ParamsPage } from '@/pages/params/ParamsPage'
import { ComparePage } from '@/pages/compare/ComparePage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { SensitivityPage } from '@/pages/sensitivity/SensitivityPage'
import { ResultsPage } from '@/pages/results/ResultsPage'
import { useEffect } from 'react'

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
