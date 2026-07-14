import { useEffect, useMemo } from 'react'
import { createWorldInputController } from './inputController'
import type { WorldInputController } from './types'

export function useWorldInputController(): WorldInputController {
  const controller = useMemo(() => createWorldInputController(), [])

  useEffect(
    () => () => {
      controller.reset()
    },
    [controller],
  )

  return controller
}
