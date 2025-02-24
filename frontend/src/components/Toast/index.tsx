import { Bounce, toast } from "react-toastify";
import "./styles.css";


export function ErrorToast(text: string): ErrorToastDismisser {
  const toastId = toast.error(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
    transition: Bounce,
  });

  return {
    dismiss: () => toast.dismiss(toastId)
  };
}

export interface ErrorToastDismisser {
  dismiss: () => void;
}

export function SuccessToast(text: string) {
  return toast.success(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
  });
}

export function InfoToast(text: string) {
  return toast.info(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
  });
}

type ToastCallback = () => Promise<void>;

export const useActionToast = () => {
  const executeWithToast = async (
    actionCallback: ToastCallback,
    messages: {
      pending: string;
      success: string;
      error: string;
    }
  ) => {
    const toastId = toast.loading(messages.pending);
    
    try {
      await actionCallback();
      toast.update(toastId, {
        render: messages.success,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });
    } catch (error) {
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
