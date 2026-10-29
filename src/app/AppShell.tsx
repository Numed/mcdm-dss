import type { ReactNode } from 'react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { AppSidebar } from './AppSidebar'
import type { RouteId } from './routes'
import { Topbar } from './Topbar'
import { useMediaQuery } from './useMediaQuery'

type AppShellProps = {
  route: RouteId
  children: ReactNode
}

export function AppShell(props: AppShellProps) {
  const { route, children } = props
  const wide = useMediaQuery('(min-width: 1280px)')
  const tablet = useMediaQuery('(min-width: 768px)')
  const expandedPreference = useUiStore((state) => state.sidebarExpanded)
  const setSidebarExpanded = useUiStore((state) => state.setSidebarExpanded)
  const [sheetOpen, setSheetOpen] = useState(false)
  const expanded = wide && expandedPreference
  const showRail = tablet

  const toggle = () => {
    if (wide) setSidebarExpanded(!expandedPreference)
    else setSheetOpen(true)
  }

  return (
    <div className="flex min-h-svh">
      {showRail && (
        <aside
          className={cn(
            'sticky top-0 h-svh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 print:hidden',
            expanded ? 'w-60' : 'w-14',
          )}
        >
          <AppSidebar route={route} collapsed={!expanded} />
        </aside>
      )}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle className="sr-only">Навігація</SheetTitle>
          <AppSidebar route={route} collapsed={false} onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar route={route} wide={wide} onToggleSidebar={toggle} />
        <main id="main" className="mx-auto w-full max-w-[1400px] min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
