import { Toaster as Sonner } from 'sonner'
import { useResolvedTheme } from '@/app/theme'

function Toaster() {
  const theme = useResolvedTheme()
  return (
    <Sonner
      theme={theme === 'light' ? 'light' : 'dark'}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: '!rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-lg !text-[13px]',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground !font-medium',
        },
      }}
    />
  )
}

export { Toaster }
