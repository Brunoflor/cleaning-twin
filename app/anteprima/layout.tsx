import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.ENABLE_UI_PREVIEW !== '1') notFound()
  return children
}
