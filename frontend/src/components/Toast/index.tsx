import { Bounce, toast } from "react-toastify";
import "./styles.css";


export function ErrorToast(text: string) {
  return toast.error(text, {
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
}
