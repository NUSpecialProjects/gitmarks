import { toast } from "react-toastify";
import "./styles.css";

// Displays an error toast
export function ErrorToast(text: string, toastId: string) {
  return toast.error(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    toastId: toastId
  });  
}

// Displays a success toast
export function SuccessToast(text: string, toastId: string) {
  return toast.success(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    toastId: toastId
  });
}

// Displays an info toast
export function InfoToast(text: string, toastId: string) {
  return toast.info(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    toastId: toastId
  });
}

type ToastCallback = () => Promise<void>;

/**
 * This hook is used to display a toast when an action is performed.
 * It takes in a toastId, an actionCallback, and a messages object which determines what to display based on the current status of the action.
 * The actionCallback is the function to execute and is expected to return a promise.
 * Typically, executeWithToast will be called within a try, finally block but without a catch block as the toast will handle errors.
 * 
 */
export const useActionToast = () => {
  const executeWithToast = async (
    toastId: string,
    actionCallback: ToastCallback,
    messages: {
      pending: string;
      success: string;
      error: string;
    }
  ) => {
    toast.loading(messages.pending, {
      toastId: toastId
    });
    
    try {
      await actionCallback();
      toast.update(toastId, {
        render: messages.success,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });
    } catch (_) {
      toast.update(toastId, {
        render: messages.error,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });
    }
  };

  return { executeWithToast };
};
