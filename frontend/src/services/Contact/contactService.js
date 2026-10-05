import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// { name, email, phone, topic, orderNumber, message, website (honeypot) }
export const sendContactMessage = async (data) => {
    const response = await AxiosInstance.post(API_ROUTES.CONTACT.SEND, data);
    return response.data;
};
