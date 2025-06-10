
import * as React from "react"

const TOAST_LIMIT = 3 // Увеличено с 1 до 3
const TOAST_REMOVE_DELAY = 5000

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
    console.log('⏭️ Toast already in remove queue:', toastId);
    return
  }

  console.log('⏰ Adding toast to remove queue:', toastId);
  const timeout = setTimeout(() => {
    console.log('⏳ Remove timeout triggered for toast:', toastId);
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      console.log('➕ Adding toast:', action.toast.id);
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      console.log('📝 Updating toast:', action.toast.id);
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action
      console.log('🗑️ Dismissing toast:', toastId);

      // Очистить существующий таймаут если есть
      if (toastId && toastTimeouts.has(toastId)) {
        console.log('🚫 Clearing existing timeout for toast:', toastId);
        clearTimeout(toastTimeouts.get(toastId));
        toastTimeouts.delete(toastId);
      }

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        // Закрыть все toast'ы
        console.log('🗑️ Dismissing all toasts');
        state.toasts.forEach((toast) => {
          if (toastTimeouts.has(toast.id)) {
            clearTimeout(toastTimeouts.get(toast.id));
            toastTimeouts.delete(toast.id);
          }
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
      console.log('✖️ Removing toast from state:', action.toastId);
      if (action.toastId === undefined) {
        console.log('✖️ Removing all toasts from state');
        // Очистить все таймауты
        toastTimeouts.forEach((timeout) => clearTimeout(timeout));
        toastTimeouts.clear();
        return {
          ...state,
          toasts: [],
        }
      }
      
      // Убедиться что таймаут удален
      if (toastTimeouts.has(action.toastId)) {
        clearTimeout(toastTimeouts.get(action.toastId));
        toastTimeouts.delete(action.toastId);
      }
      
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  console.log('🔄 Dispatching action:', action.type, action);
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()
  console.log('🍞 Creating toast:', id, props);

  const update = (props: ToasterToast) => {
    console.log('📝 Updating toast via function:', id, props);
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  }
  
  const dismiss = () => {
    console.log('👆 Toast dismiss called for:', id);
    dispatch({ type: "DISMISS_TOAST", toastId: id });
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

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    console.log('🔌 Adding toast listener');
    listeners.push(setState)
    return () => {
      console.log('🔌 Removing toast listener');
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, []) // Убрал state из зависимостей

  const dismiss = React.useCallback((toastId?: string) => {
    console.log('🎯 Manual toast dismiss called for:', toastId);
    dispatch({ type: "DISMISS_TOAST", toastId });
  }, [])

  return {
    ...state,
    toast,
    dismiss,
  }
}

export { useToast, toast }
