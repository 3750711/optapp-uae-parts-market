
import * as React from "react"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1500

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
  variant?: "default" | "destructive" | "success"
  open?: boolean
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const clearAllTimeouts = () => {
  toastTimeouts.forEach((timeout) => {
    clearTimeout(timeout)
  })
  toastTimeouts.clear()
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        clearAllTimeouts()
        return {
          ...state,
          toasts: [],
        }
      }
      
      if (toastTimeouts.has(action.toastId)) {
        clearTimeout(toastTimeouts.get(action.toastId)!)
        toastTimeouts.delete(action.toastId)
      }
      
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Стабильная система listeners
const listeners = new Set<(state: State) => void>()
let memoryState: State = { toasts: [] }

// Стабильный dispatch с защитой от ошибок
const dispatch = React.useCallback((action: Action) => {
  try {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => {
      try {
        listener(memoryState)
      } catch (error) {
        console.error('Toast listener error:', error)
        listeners.delete(listener)
      }
    })
  } catch (error) {
    console.error('Toast dispatch error:', error)
  }
}, [])

type Toast = Omit<ToasterToast, "id">

// Стабильная функция toast
const toast = React.useCallback(({ ...props }: Toast) => {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  
  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id })
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      variant: props.variant || "default",
    },
  })

  // Автоматическое закрытие
  setTimeout(() => {
    dismiss()
  }, 4000)

  return {
    id: id,
    dismiss,
    update,
  }
}, [dispatch])

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    const stableListener = (newState: State) => {
      setState(newState)
    }
    
    listeners.add(stableListener)
    
    return () => {
      listeners.delete(stableListener)
      if (listeners.size === 0) {
        clearAllTimeouts()
      }
    }
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({ type: "DISMISS_TOAST", toastId })
  }, [])

  const clear = React.useCallback(() => {
    dispatch({ type: "REMOVE_TOAST" })
  }, [])

  return React.useMemo(() => ({
    ...state,
    toast,
    dismiss,
    clear
  }), [state, dismiss, clear])
}

export { useToast, toast }
