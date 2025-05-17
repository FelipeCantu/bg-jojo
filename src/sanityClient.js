import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const DEFAULT_ANONYMOUS_AVATAR = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';

// Initialize Sanity client
export const client = createClient({
  projectId: "wssoiuia",
  dataset: "production",
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: "2023-05-03",
  token: process.env.REACT_APP_SANITY_API_TOKEN,
  ignoreBrowserTokenWarning: true,
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
   * Create new article with validation
   */
  create: async (articleData, userId) => {
    if (!userId) throw new Error("Authentication required");
    if (!articleData?.title || !articleData?.content) {
      throw new Error("Title and content are required");
    }

    const doc = {
      _type: 'article',
      title: articleData.title,
      slug: { current: articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-') },
      content: articleData.content,
      mainImage: articleData.mainImage,
      author: { _type: 'reference', _ref: userId },
      isAnonymous: Boolean(articleData.isAnonymous),
      publishedDate: articleData.publishedDate || new Date().toISOString(),
      readingTime: articleData.readingTime || 5,
      likes: 0,
      views: 0,
      lastViewDate: null
    };

    try {
      await userAPI.ensureExists(userId);
      return await client.create(doc);
    } catch (error) {
      console.error("Error creating article:", error);
      throw new Error("Failed to create article");
    }
  },

  /**
   * Update existing article
   */
  update: async (id, updates) => {
    try {
      return await client
        .patch(id)
        .set({
          ...updates,
          _updatedAt: new Date().toISOString()
        })
        .commit();
    } catch (error) {
      console.error(`Error updating article ${id}:`, error);
      throw new Error("Failed to update article");
    }
  },

  /**
   * Delete article and all its references
   */
  delete: async (id) => {
    try {
      // First delete all comments
      await client.delete({
        query: `*[_type == "comment" && references($id)]`,
        params: { id }
      });
      
      // Then delete the article
      return await client.delete(id);
    } catch (error) {
      console.error(`Error deleting article ${id}:`, error);
      throw new Error("Failed to delete article");
    }
  },

  /**
   * Increment article view count with daily tracking
   */
 // Add this to your articleAPI methods
incrementViews: async (id) => {
  try {
    // Simply increment without any checks
    const result = await client
      .patch(id)
      .setIfMissing({ views: 0 })
      .inc({ views: 1 })
      .commit();

    return result.views;
  } catch (error) {
    console.error("View count increment failed:", error);
    throw error;
  }
},

  /**
   * Toggle like on article
   */
  toggleLike: async (articleId, userId) => {
    try {
      const article = await client.getDocument(articleId);
      const isLiked = article.likedBy?.some(ref => ref._ref === userId);

      const patch = client
        .patch(articleId)
        .setIfMissing({ likedBy: [], likes: 0 });

      if (isLiked) {
        patch
          .insert('replace', 'likedBy[ref($userId)]', [])
          .dec({ likes: 1 });
      } else {
        patch
          .insert('after', 'likedBy[-1]', [{
            _type: 'reference',
            _ref: userId
          }])
          .inc({ likes: 1 });
      }

      const result = await patch.commit({ userId });

      // Create notification if liked
      if (!isLiked && article.author?._ref && article.author._ref !== userId) {
        await client.create({
          _type: "notification",
          user: { 
            _type: "reference", 
            _ref: article.author._ref
          },
          sender: { 
            _type: "reference", 
            _ref: userId
          },
          type: "like",
          relatedArticle: { 
            _type: "reference", 
            _ref: articleId
          },
          seen: false,
          createdAt: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error(`Error toggling like for article ${articleId}:`, error);
      throw new Error("Failed to toggle like");
    }
  }
};

// User Operations
export const userAPI = {
  /**
   * Ensure user exists in Sanity (sync from auth provider)
   */
  ensureExists: async (uid, userData = {}) => {
    try {
      let user = await client.getDocument(uid).catch(() => null);
      
      if (!user) {
        user = await client.create({
          _type: 'user',
          _id: uid,
          uid: uid,
          name: userData.name || 'Anonymous',
          email: userData.email || '',
          photoURL: userData.photoURL || DEFAULT_ANONYMOUS_AVATAR,
          role: 'user',
          providerData: userData.providerData || [],
          primaryProvider: userData.primaryProvider || 'password',
          emailVerified: Boolean(userData.emailVerified),
          lastLogin: new Date().toISOString()
        });
      }
      
      return user;
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
   * Update user profile
   */
  update: async (uid, updates) => {
    try {
      return await client
        .patch(uid)
        .set({
          ...updates,
          _updatedAt: new Date().toISOString()
        })
        .commit();
    } catch (error) {
      console.error(`Error updating user ${uid}:`, error);
      throw new Error("Failed to update profile");
    }
  }
};

// Comment Operations
export const commentAPI = {
  /**
   * Add comment to article
   */
  create: async (articleId, userId, content) => {
    if (!content?.trim()) throw new Error("Comment text required");

    try {
      await userAPI.ensureExists(userId);
      
      return await client.create({
        _type: 'comment',
        article: { _type: 'reference', _ref: articleId },
        author: { _type: 'reference', _ref: userId },
        content: content.trim(),
        _createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      throw new Error("Failed to post comment");
    }
  },

  /**
   * Delete comment
   */
  delete: async (commentId) => {
    try {
      return await client.delete(commentId);
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw new Error("Failed to delete comment");
    }
  }
};

// Media Operations
export const mediaAPI = {
  /**
   * Upload image with validation
   */
  upload: async (file) => {
    if (!file) throw new Error("No file provided");
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
    }

    if (file.size > maxSize) {
      throw new Error(`File exceeds ${maxSize/1024/1024}MB size limit`);
    }

    try {
      const result = await client.assets.upload('image', file, {
        filename: file.name,
        contentType: file.type,
      });

      return { 
        _type: "image", 
        asset: { 
          _type: "reference", 
          _ref: result._id 
        } 
      };
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new Error("Failed to upload image");
    }
  }
};

// Default export
export default client;