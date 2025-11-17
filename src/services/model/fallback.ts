import { callModel } from "./callModel";

const PRIMARY = "claude-sonnet-4.5";
const SECONDARY = "claude-sonnet-3.7";
const TERTIARY = "gpt-4.1-mini";

export async function runModel(input: string) {
  try {
    console.log("🔥 Using primary model:", PRIMARY);
    return await callModel(PRIMARY, input);
  } catch (err1) {
    console.warn("⚠️ Primary failed. Falling back:", SECONDARY);

    try {
      return await callModel(SECONDARY, input);
    } catch (err2) {
      console.warn("⚠️ Secondary failed. Trying:", TERTIARY);

      try {
        return await callModel(TERTIARY, input);
      } catch (err3) {
        console.error("❌ All models failed.");
        throw new Error("All model fallback attempts failed.");
      }
    }
  }
}
