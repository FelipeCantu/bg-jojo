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

export const fetchArticles = async () => {
  const query = '*[_type == "article"]';  // Query to fetch all articles
  const articles = await client.fetch(query);
  return articles;
};

// Fetch a single article by its ID
export const fetchArticleById = async (id) => {
  const query = `*[_type == "article" && _id == $id][0]`;  // Query to fetch the article by ID
  const params = { id };
  const article = await client.fetch(query, params);
  return article;
};
export default client;