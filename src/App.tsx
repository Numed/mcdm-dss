import { BarChart3, Database, Download, FileUp, GitCompare, SlidersHorizontal } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { analyze } from '@/core/analysis'
import { articleExample, bankDemo, emptyProject } from '@/core/presets'
import { isProject } from '@/core/validate'
import { CompareTab } from '@/features/CompareTab'
import { DataTab } from '@/features/DataTab'
import { ParamsTab } from '@/features/ParamsTab'
import { ResultsTab } from '@/features/ResultsTab'
import { useProjectStore } from '@/store/projectStore'

function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const project = useProjectStore((state) => state.project)
  const loadProject = useProjectStore((state) => state.loadProject)
  const analysis = useMemo(() => analyze(project), [project])
  const fileInput = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleImport = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isProject(parsed)) {
        setImportError('Файл не схожий на проєкт цієї системи')
        return
      }
      setImportError(null)
      loadProject(parsed)
    } catch {
      setImportError('Не вдалося прочитати JSON')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-medium tracking-wide text-primary uppercase">Система підтримки прийняття рішень</div>
            <h1 className="mt-1 text-xl font-semibold">Багатокритеріальний вибір альтернатив за групами цілей</h1>
            <p className="mt-1 text-sm text-muted-foreground">{project.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => loadProject(bankDemo())}>
              Демо: банки
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadProject(articleExample())}>
              Приклад зі статті
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadProject(emptyProject())}>
              Новий проєкт
            </Button>
            <div className="mx-1 h-6 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={() => downloadJson('project.json', project)}>
              <Download />
              Експорт
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
              <FileUp />
              Імпорт
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleImport(file)
                event.target.value = ''
              }}
            />
          </div>
        </div>
        {importError && <div className="mx-auto max-w-7xl px-6 pb-3 text-sm text-destructive">{importError}</div>}
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Tabs defaultValue="data">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="data">
              <Database />
              Дані
            </TabsTrigger>
            <TabsTrigger value="params">
              <SlidersHorizontal />
              Параметри
            </TabsTrigger>
            <TabsTrigger value="results">
              <BarChart3 />
              Результати
            </TabsTrigger>
            <TabsTrigger value="compare">
              <GitCompare />
              Порівняння методів
            </TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <DataTab />
          </TabsContent>
          <TabsContent value="params">
            <ParamsTab />
          </TabsContent>
          <TabsContent value="results">
            <ResultsTab project={project} analysis={analysis} />
          </TabsContent>
          <TabsContent value="compare">
            <CompareTab project={project} analysis={analysis} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
