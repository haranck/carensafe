import { useMutation } from "@tanstack/react-query";
import { sendContactMessage } from "../../services/Contact/contactService";

export const useSendContactMessage = () => useMutation({ mutationFn: sendContactMessage });
