'use client'

import dynamic from 'next/dynamic'

const SubmitViewInner = dynamic(() => import('./SubmitViewInner'), { ssr: false })

export default function SubmitView() {
  return <SubmitViewInner />
}
