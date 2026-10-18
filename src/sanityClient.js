import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { DEFAULT_ANONYMOUS_AVATAR } from "./constants";

// Initialize Sanity client (read-only — no write token)
export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID,
  dataset: process.env.REACT_APP_SANITY_DATASET || "production",
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: "2023-05-03",
});

// Initialize the image URL builder
const builder = imageUrlBuilder(client);

/**
 * Generates URL for images stored in Sanity with fallback
 * @param {Object} source - Sanity image reference
 * @returns {string} Image URL
 */
export function urlFor(source) {
  if (!source) {
    console.warn("No image source provided, using default avatar");
    return DEFAULT_ANONYMOUS_AVATAR;
  }

  try {
    return builder.image(source)
      .auto('format')
      .fit('max')
      .quality(80);
  } catch (error) {
    console.error("Image URL generation failed:", error);
    return DEFAULT_ANONYMOUS_AVATAR;
  }
}

// Article Operations
export const articleAPI = {
  /**
   * Fetch all articles with optimized query
   */
  fetchAll: async () => {
    const query = `*[_type == "article"] | order(publishedDate desc) {
      _id,
      title,
      slug,
      excerpt,
      "mainImage": mainImage.asset->{
        url,
        metadata
      },
      publishedDate,
      readingTime,
      isAnonymous,
      likes,
      views,
      lastViewDate,
      "author": select(
        isAnonymous == true => {
          "name": "Anonymous",
          "photoURL": "${DEFAULT_ANONYMOUS_AVATAR}",
          "_id": "anonymous"
        },
        author->{
          _id,
          name,
          photoURL
        }
      )
    }`;

    try {
      return await client.fetch(query);
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw new Error("Failed to fetch articles");
    }
  },

  /**
   * Fetch single article by ID with all related data
   */
  fetchById: async (id) => {
    const query = `*[_type == "article" && _id == $id][0] {
      ...,
      "mainImage": mainImage.asset->{
        url,
        metadata,
        "dimensions": metadata.dimensions
      },
      isAnonymous,
      "author": select(
        isAnonymous == true => {
          "name": "Anonymous",
          "photoURL": "${DEFAULT_ANONYMOUS_AVATAR}",
          "_id": "anonymous"
        },
        author->{
          _id,
          name,
          photoURL
        }
      )
    }`;

    try {
      return await client.fetch(query, { id });
    } catch (error) {
      console.error(`Error fetching article ${id}:`, error);
      throw new Error("Failed to fetch article");
    }
  },
};

// Default export
export default client;
