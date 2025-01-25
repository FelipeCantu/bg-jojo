import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "wssoiuia",
  dataset: "production",
  useCdn: true,  // Switch to false if data isn't updating
  apiVersion: "2023-01-01",
});

const builder = imageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);  // Ensure this is correct
