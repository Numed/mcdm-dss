import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react'
import { type ComponentType, useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { navigate, readRouteParam } from '@/app/routes'
import { useAnalysis } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import {
  CompareSlide,
  ConclusionSlide,
  MatrixSlide,
  PipelineSlide,
  RankingSlide,
  RobustnessSlide,
  type SlideProps,
  SpaceSlide,
  TaskSlide,
  TitleSlide,
} from './slides'

type SlideDef = {
  title: string
  component: ComponentType<SlideProps>
}

const SLIDES: SlideDef[] = [
  { title: 'Титул', component: TitleSlide },
  { title: 'Постановка задачі', component: TaskSlide },
  { title: 'Етапи ІТ', component: PipelineSlide },
  { title: 'Метод множення матриць', component: MatrixSlide },
  { title: 'Простір цілей', component: SpaceSlide },
  { title: 'Ранжування', component: RankingSlide },
  { title: 'Стійкість', component: RobustnessSlide },
  { title: 'Порівняння методів', component: CompareSlide },
  { title: 'Висновки', component: ConclusionSlide },
]

function initialSlide(): number {
  const param = Number(readRouteParam())
  if (!Number.isInteger(param) || param < 1) return 0
  return Math.min(param, SLIDES.length) - 1
}

function subscribeFullscreen(callback: () => void): () => void {
  document.addEventListener('fullscreenchange', callback)
  return () => document.removeEventListener('fullscreenchange', callback)
}

function isFullscreen(): boolean {
  return document.fullscreenElement !== null
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
}

export function PresentationPage() {
  const project = useProjectStore((state) => state.project)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const [index, setIndex] = useState(initialSlide)
  const fullscreen = useSyncExternalStore(subscribeFullscreen, isFullscreen, () => false)
  const slide = SLIDES[index] ?? SLIDES[0]
  const Slide = slide.component

  const go = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, 0), SLIDES.length - 1)
    setIndex(clamped)
    window.history.replaceState(null, '', `#present/${clamped + 1}`)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      const keys: Record<string, () => void> = {
        ArrowRight: () => go(index + 1),
        PageDown: () => go(index + 1),
        ' ': () => go(index + 1),
        ArrowLeft: () => go(index - 1),
        PageUp: () => go(index - 1),
        Home: () => go(0),
        End: () => go(SLIDES.length - 1),
        f: toggleFullscreen,
        Escape: () => {
          if (!document.fullscreenElement) navigate('results')
        },
      }
      const action = keys[event.key]
      if (!action) return
      if (event.target instanceof SVGElement && event.key.startsWith('Arrow')) return
      event.preventDefault()
      action()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go, index, toggleFullscreen])

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="h-1 w-full bg-muted" aria-hidden>
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
      </div>
      <header className="flex h-12 shrink-0 items-center gap-3 px-6 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{slide.title}</span>
        <span className="num">
          {index + 1} / {SLIDES.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen} aria-label={fullscreen ? 'Вийти з повного екрана' : 'Повний екран (F)'}>
            {fullscreen ? <Minimize /> : <Maximize />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('results')} aria-label="Закрити презентацію (Esc)">
            <X />
          </Button>
        </div>
      </header>

      <main key={index} className="animate-slide-in mx-auto flex min-h-0 w-full max-w-[1360px] flex-1 flex-col overflow-y-auto px-12 pt-6 pb-4">
        <Slide project={project} analysis={analysis} meta={meta} />
      </main>

      <footer className="flex h-16 shrink-0 items-center gap-4 px-6">
        <Button variant="outline" size="sm" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Попередній слайд">
          <ChevronLeft />
          Назад
        </Button>
        <nav aria-label="Слайди" className="flex flex-1 items-center justify-center gap-1.5">
          {SLIDES.map((item, slideIndex) => (
            <button
              key={item.title}
              type="button"
              onClick={() => go(slideIndex)}
              aria-label={`${slideIndex + 1}. ${item.title}`}
              aria-current={slideIndex === index ? 'step' : undefined}
              title={item.title}
              className={cn(
                'h-2 cursor-pointer rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/50',
                slideIndex === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60',
              )}
            />
          ))}
        </nav>
        <span className="hidden text-xs text-muted-foreground lg:inline">← → гортати · F повний екран · Esc вихід</span>
        <Button size="sm" onClick={() => go(index + 1)} disabled={index === SLIDES.length - 1} aria-label="Наступний слайд">
          Далі
          <ChevronRight />
        </Button>
      </footer>
    </div>
  )
}
