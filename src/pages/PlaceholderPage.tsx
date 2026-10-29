import { Hammer } from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { PageHeader } from '@/components/app/PageHeader'
import { Card } from '@/components/ui/card'

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage(props: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={props.title} />
      <Card>
        <EmptyState icon={Hammer} title="Розділ у розробці" />
      </Card>
    </div>
  )
}
