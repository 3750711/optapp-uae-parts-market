
import * as React from "react";
import { Dispatch, SetStateAction } from 'react';

const TOAST_LIMIT = 20;
const TOAST_REMOVE_DELAY = 1000000;

export type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick: () => void;
}>;

export type ToasterToast = {
  id: string;
  group?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success";
  open?: boolean;
  duration?: number;
};

export type Toast = Omit<ToasterToast, "id"> & {
  id?: string;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
      group?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
      group?: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, timeout = TOAST_REMOVE_DELAY) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId));
  }

  const timeoutId = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  }, timeout);

  toastTimeouts.set(toastId, timeoutId);
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      // If there's already a toast with the same group, replace it
      if (action.toast.group) {
        const existingGroupIndex = state.toasts.findIndex(
          (t) => t.group === action.toast.group
        );
        if (existingGroupIndex !== -1) {
          const updatedToasts = [...state.toasts];
          updatedToasts[existingGroupIndex] = action.toast;
          return {
            ...state,
            toasts: updatedToasts,
          };
        }
      }
      
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
      
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
      
    case actionTypes.DISMISS_TOAST:
      // Dismiss all toasts if no ID/group specified
      if (!action.toastId && !action.group) {
        return {
          ...state,
          toasts: state.toasts.map((toast) => ({
            ...toast,
            open: false,
          })),
        };
      }

      // Dismiss toasts matching the ID or group
      return {
        ...state,
        toasts: state.toasts.map((toast) => {
          const matchesId = action.toastId && toast.id === action.toastId;
          const matchesGroup = action.group && toast.group === action.group;
          
          if (matchesId || matchesGroup) {
            return {
              ...toast,
              open: false,
            };
          }
          return toast;
        }),
      };
      
    case actionTypes.REMOVE_TOAST:
      // Remove all toasts if no ID/group specified
      if (!action.toastId && !action.group) {
        return {
          ...state,
          toasts: [],
        };
      }
      
      // Remove toasts matching the ID or group
      return {
        ...state,
        toasts: state.toasts.filter((toast) => {
          const matchesId = action.toastId && toast.id === action.toastId;
          const matchesGroup = action.group && toast.group === action.group;
          
          return !(matchesId || matchesGroup);
        }),
      };
  }
};

// Create context
type ToastContextType = {
  toasts: ToasterToast[];
  addToast: (toast: Toast) => void;
  updateToast: (toast: Partial<ToasterToast>) => void;
  dismissToast: (toastId: string) => void;
  dismissToastGroup: (group: string) => void;
  removeToast: (toastId: string) => void;
  removeToastGroup: (group: string) => void;
} | null;

const ToastContext = React.createContext<ToastContextType>(null);

const initialState: State = {
  toasts: [],
};

let dispatch: Dispatch<Action>;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatchAction] = React.useReducer(reducer, initialState);

  // Assign the dispatch function to the module-level variable
  React.useEffect(() => {
    dispatch = dispatchAction;
  }, [dispatchAction]);

  const addToast = React.useCallback((toast: Toast) => {
    const id = toast.id || genId();

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...toast,
        id,
        open: true,
      },
    });

    addToRemoveQueue(id);
  }, []);

  const updateToast = React.useCallback((toast: Partial<ToasterToast>) => {
    if (!toast.id) {
      return;
    }

    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast,
    });
  }, []);

  const dismissToast = React.useCallback((toastId: string) => {
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId,
    });
  }, []);

  const dismissToastGroup = React.useCallback((group: string) => {
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      group,
    });
  }, []);

  const removeToast = React.useCallback((toastId: string) => {
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  }, []);

  const removeToastGroup = React.useCallback((group: string) => {
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      group,
    });
  }, []);

  return React.createElement(
    ToastContext.Provider,
    {
      value: {
        toasts: state.toasts,
        addToast,
        updateToast,
        dismissToast,
        dismissToastGroup,
        removeToast,
        removeToastGroup,
      }
    },
    children
  );
}

// Create a hook to use the toast context
export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    toasts: context.toasts,
    toast: (props: Toast) => {
      context.addToast(props);
    },
    dismiss: (toastId: string) => context.dismissToast(toastId),
    dismissGroup: (group: string) => context.dismissToastGroup(group),
  };
}

// Create a standalone function for using toasts outside of React components
export const toast = (props: Toast) => {
  if (dispatch) {
    const id = props.id || genId();
    
    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...props,
        id,
        open: true,
      },
    });
    
    // Use custom duration if provided or default
    const duration = props.duration !== undefined ? props.duration : TOAST_REMOVE_DELAY;
    addToRemoveQueue(id, duration);
  }
};

toast.dismiss = (toastId: string) => {
  if (dispatch) {
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId,
    });
  }
};

toast.dismissGroup = (group: string) => {
  if (dispatch) {
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      group,
    });
  }
};
