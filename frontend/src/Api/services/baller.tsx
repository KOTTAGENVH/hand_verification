import { apiClient } from "../axios/api";

//Grip model api
export const gripModel = async (image_url: string) => {
  try {
    const response = await apiClient.post("/verify_hand", {
      image_url: image_url,
    });
    if (response.status !== 200) {
      alert("Error: " + response?.data?.error);
      return response;
    } else {
      return response;
    }
  } catch (error) {
    console.error(error);
  }
};

