import { toast } from "react-toastify";
import "./styles.css";


export function ErrorToast(text: string, givenToastId?: string): ErrorToastDismisser {
  const generatedToastId = toast.error(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    toastId: givenToastId
  });

  const toastId = givenToastId || generatedToastId;

  return {
    dismiss: () => toast.dismiss(toastId)
  };
}

export interface ErrorToastDismisser {
  dismiss: () => void;
}

export function SuccessToast(text: string, givenToastId?: string) {
  const generatedToastId = toast.success(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    toastId: givenToastId
  });

  const toastId = givenToastId || generatedToastId;

  return toastId;
}

export function InfoToast(text: string, givenToastId?: string) {
  const generatedToastId = toast.info(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    toastId: givenToastId
  });

  const toastId = givenToastId || generatedToastId;

  return toastId;
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
