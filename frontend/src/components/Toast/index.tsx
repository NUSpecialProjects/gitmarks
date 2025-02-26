import { toast } from "react-toastify";
import "./styles.css";


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

export function SuccessToast(text: string, toastId: string) {
  return toast.success(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    toastId: toastId
  });
}

export function InfoToast(text: string, toastId: string) {
  return toast.info(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    toastId: toastId
  });
}

type ToastCallback = () => Promise<void>;

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
