import axios from "axios";

export async function callModel(model: string, input: string) {
  const url = process.env.MODEL_API_URL!;
  const key = process.env.MODEL_API_KEY!;

  const response = await axios.post(
    url,
    {
      model,
      input
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );

  return response.data;
}
