import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { DEFAULT_ANONYMOUS_AVATAR } from "./constants";

// All Sanity writes go through Cloud Functions — the write token never ships in the browser bundle
const callSanityWrite = async (operation, params = {}) => {
  const functions = getFunctions(getApp(), 'us-central1');
  const api = httpsCallable(functions, 'api');
  const { data } = await api({ endpoint: `sanity/${operation}`, ...params });
  return data;
};

// Initialize Sanity client (read-only — no write token)
export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID,
  dataset: process.env.REACT_APP_SANITY_DATASET || "production",
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: "2023-05-03",
});

// Non-CDN client for real-time critical queries (notifications, etc.)
export const realtimeClient = client.withConfig({ useCdn: false });

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
          photoURL,
          role
        }
      ),
      "commentCount": count(*[_type == "comment" && references(^._id)])
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
          photoURL,
          role
        }
      ),
      "comments": *[_type == "comment" && references(^._id)] | order(_createdAt asc) {
        _id,
        _createdAt,
        content,
        "author": author->{
          _id,
          name,
          photoURL
        }
      }
    }`;

    try {
      return await client.fetch(query, { id });
    } catch (error) {
      console.error(`Error fetching article ${id}:`, error);
      throw new Error("Failed to fetch article");
    }
  },

  /**
   * Create new article with validation — proxied through Cloud Function
   */
  create: async (articleData, userId) => {
    if (!userId) throw new Error("Authentication required");
    if (!articleData?.title || !articleData?.content) {
      throw new Error("Title and content are required");
    }

    try {
      return await callSanityWrite('article.create', {
        title: articleData.title,
        slug: articleData.slug || null,
        content: articleData.content,
        mainImage: articleData.mainImage || null,
        isAnonymous: Boolean(articleData.isAnonymous),
        publishedDate: articleData.publishedDate || new Date().toISOString(),
        readingTime: articleData.readingTime || 5,
      });
    } catch (error) {
      console.error("Error creating article:", error);
      throw new Error("Failed to create article");
    }
  },

  /**
   * Update existing article — proxied through Cloud Function
   */
  update: async (id, updates) => {
    try {
      return await callSanityWrite('article.update', { articleId: id, updates });
    } catch (error) {
      console.error(`Error updating article ${id}:`, error);
      throw new Error("Failed to update article");
    }
  },

  /**
   * Delete article and all its references — proxied through Cloud Function
   */
  delete: async (id) => {
    try {
      return await callSanityWrite('article.delete', { articleId: id });
    } catch (error) {
      console.error(`Error deleting article ${id}:`, error);
      throw new Error("Failed to delete article");
    }
  },

  /**
   * Increment article view count — proxied through Cloud Function
   */
  incrementViews: async (id) => {
    try {
      const result = await callSanityWrite('article.incrementViews', { articleId: id });
      return result.views;
    } catch (error) {
      console.error("View count increment failed:", error);
      throw error;
    }
  },

  /**
   * Toggle like on article — proxied through Cloud Function
   */
  toggleLike: async (articleId, userId) => {
    try {
      return await callSanityWrite('article.toggleLike', { articleId });
    } catch (error) {
      console.error(`Error toggling like for article ${articleId}:`, error);
      throw new Error("Failed to toggle like");
    }
  }
};

// User Operations
export const userAPI = {
  /**
   * Ensure user exists in Sanity (sync from auth provider) — writes proxied through Cloud Function
   */
  ensureExists: async (uid, userData = {}) => {
    try {
      // Read check can stay on the browser — read-only, no token needed
      const existing = await client.getDocument(uid).catch(() => null);
      if (existing) return existing;

      // User doesn't exist yet — create via CF
      return await callSanityWrite('user.sync', {
        uid,
        name: userData.name || 'Anonymous',
        email: userData.email || null,
        photoURL: userData.photoURL || DEFAULT_ANONYMOUS_AVATAR,
        authProvider: userData.primaryProvider || userData.authProvider || 'password',
        emailVerified: Boolean(userData.emailVerified),
      });
    } catch (error) {
      console.error(`Error ensuring user ${uid} exists:`, error);
      throw new Error("Failed to sync user");
    }
  },

  /**
   * Get user by ID with profile data
   */
  get: async (uid) => {
    const query = `*[_type == "user" && _id == $uid][0] {
      ...,
      "articles": *[_type == "article" && author._ref == ^._id] | order(publishedDate desc) {
        _id,
        title,
        publishedDate,
        "commentCount": count(*[_type == "comment" && references(^._id)])
      },
      "comments": *[_type == "comment" && author._ref == ^._id] | order(_createdAt desc) {
        _id,
        _createdAt,
        "article": ^.article->{
          _id,
          title
        }
      }
    }`;

    try {
      return await client.fetch(query, { uid });
    } catch (error) {
      console.error(`Error fetching user ${uid}:`, error);
      return null;
    }
  },

  /**
   * Update user profile — proxied through Cloud Function
   */
  update: async (uid, updates) => {
    try {
      return await callSanityWrite('user.sync', { uid, ...updates });
    } catch (error) {
      console.error(`Error updating user ${uid}:`, error);
      throw new Error("Failed to update profile");
    }
  }
};

// Comment Operations
export const commentAPI = {
  /**
   * Add comment to article — proxied through Cloud Function
   */
  create: async (articleId, userId, content) => {
    if (!content?.trim()) throw new Error("Comment text required");

    try {
      return await callSanityWrite('comment.create', { articleId, content });
    } catch (error) {
      console.error("Error creating comment:", error);
      throw new Error("Failed to post comment");
    }
  },

  /**
   * Delete comment — proxied through Cloud Function
   */
  delete: async (commentId) => {
    try {
      return await callSanityWrite('comment.delete', { commentId });
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw new Error("Failed to delete comment");
    }
  }
};

// Media Operations
export const mediaAPI = {
  /**
   * Upload image with validation — proxied through Cloud Function
   */
  upload: async (file) => {
    if (!file) throw new Error("No file provided");

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
    }

    if (file.size > maxSize) {
      throw new Error(`File exceeds ${maxSize / 1024 / 1024}MB size limit`);
    }

    try {
      // Convert File to base64 for CF transport
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await callSanityWrite('media.upload', {
        base64,
        filename: file.name,
        contentType: file.type,
      });

      return result.asset;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new Error("Failed to upload image");
    }
  }
};

// Default export
export default client;
