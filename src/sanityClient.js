import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const DEFAULT_ANONYMOUS_AVATAR = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';

// Initialize Sanity client
export const client = createClient({
  projectId: "wssoiuia",
  dataset: "production",
  useCdn: false,
  apiVersion: "2023-01-01",
  token: process.env.REACT_APP_SANITY_API_TOKEN,
});

// Initialize the image URL builder
const builder = imageUrlBuilder(client);

// Generate URL for images stored in Sanity
export function urlFor(source) {
  if (!source) {
    console.error("Invalid image reference: source is null or undefined");
    return DEFAULT_ANONYMOUS_AVATAR;
  }

  const ref = source._ref || source.asset?._ref;

  if (!ref) {
    console.error("Invalid image reference:", source);
    return DEFAULT_ANONYMOUS_AVATAR;
  }

  return builder.image({ _ref: ref });
}

// Fetch all articles with anonymous handling
export const fetchArticles = async () => {
  const query = `*[_type == "article"]{
    _id,
    title,
    content,
    "mainImage": mainImage.asset->url,
    publishedDate,
    readingTime,
    isAnonymous,
    likes,
    "authorDisplay": select(
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
    ),
    "comments": count(comments)
  } | order(publishedDate desc)`;

  try {
    const articles = await client.fetch(query);
    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

// Fetch a single article by ID with full anonymous handling
export const fetchArticleById = async (id) => {
  const query = `*[_type == "article" && _id == $id][0]{
    ...,
    "mainImage": mainImage.asset->url,
    isAnonymous,
    "authorDisplay": select(
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
    ),
    "comments": comments[]->{
      ...,
      "author": author->{
        _id,
        name,
        photoURL
      }
    }
  }`;

  try {
    const article = await client.fetch(query, { id });
    return article;
  } catch (error) {
    console.error("Error fetching article:", error);
    throw error;
  }
};

// Submit an article to Sanity with anonymous support
export const submitArticle = async (articleData, user) => {
  if (!user?.uid) throw new Error("User authentication required");

  const article = {
    _type: 'article',
    title: articleData.title,
    content: articleData.portableContent || articleData.content,
    mainImage: articleData.mainImage,
    author: {
      _type: 'reference',
      _ref: user.uid
    },
    isAnonymous: articleData.isAnonymous || false,
    publishedDate: articleData.publishedDate || new Date().toISOString(),
    readingTime: articleData.readingTime || 5,
  };

  try {
    // Ensure user exists first
    await ensureUserExistsInSanity(
      user.uid,
      user.displayName || user.name,
      user.photoURL
    );
    
    return await client.create(article);
  } catch (error) {
    console.error("Error submitting article:", error);
    throw error;
  }
};

// Upload image to Sanity
export const uploadImageToSanity = async (file) => {
  if (!file) throw new Error("No file provided");
  if (!client.config().token) throw new Error("Missing Sanity API token");

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.");
  }

  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSize/1024/1024}MB`);
  }

  try {
    const result = await client.assets.upload("image", file, {
      filename: file.name,
      contentType: file.type,
    });

    if (!result?._id) {
      throw new Error("Invalid response from Sanity");
    }

    return { _type: "image", asset: { _type: "reference", _ref: result._id } };
  } catch (error) {
    console.error("Image upload failed:", error);
    throw error;
  }
};

// User management functions
export const ensureUserExistsInSanity = async (uid, displayName, photoURL) => {
  try {
    // First try to get the user by _id (must match Firebase UID exactly)
    let userDoc = await client.fetch(`*[_type == "user" && _id == $uid][0]`, { uid });

    if (!userDoc) {
      // Create with _id matching Firebase UID
      userDoc = await client.create({
        _type: "user",
        _id: uid,  // MUST match Firebase UID exactly
        uid: uid,   // Additional field for querying
        name: displayName || "Anonymous",
        photoURL: photoURL || DEFAULT_ANONYMOUS_AVATAR,
        role: "user",
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString()
      });
    }
    return userDoc;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    throw error;
  }
};
// Get user from Sanity
export const getUserFromSanity = async (uid) => {
  const query = `*[_type == "user" && _id == $uid][0]`;
  try {
    const user = await client.fetch(query, { uid });
    if (!user) {
      throw new Error(`User with UID: ${uid} not found in Sanity`);
    }
    return user;
  } catch (error) {
    console.error("Error fetching user from Sanity:", error);
    return null;
  }
};

// Delete article with comprehensive reference handling
export const deleteArticle = async (articleId) => {
  try {
    const referencesQuery = `*[references($articleId)]{
      _id,
      _type,
      "references": *[references(^._id)]{_id, _type}
    }`;
    
    const referencingDocs = await client.fetch(referencesQuery, { articleId });
    const transactions = client.transaction();

    for (const doc of referencingDocs) {
      try {
        if (doc._type === 'comment') {
          transactions.delete(doc._id);
          if (doc.references && doc.references.length > 0) {
            doc.references.forEach(ref => {
              transactions.delete(ref._id);
            });
          }
        } else {
          const fullDoc = await client.getDocument(doc._id);
          Object.keys(fullDoc).forEach(key => {
            const value = fullDoc[key];
            if (value?._ref === articleId) {
              transactions.patch(doc._id, { set: { [key]: null } });
            }
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                if (item?._ref === articleId) {
                  transactions.patch(doc._id, {
                    set: { [`${key}[${index}]`]: null }
                  });
                }
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error processing document ${doc._id}:`, error);
        transactions.delete(doc._id);
      }
    }

    transactions.delete(articleId);
    await transactions.commit();
    return true;
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
};

// Update article (including anonymous status)
export const updateArticle = async (articleId, updates) => {
  try {
    return await client
      .patch(articleId)
      .set({
        ...updates,
        _updatedAt: new Date().toISOString()
      })
      .commit();
  } catch (error) {
    console.error("Error updating article:", error);
    throw error;
  }
};

// Like/unlike an article
export const toggleArticleLike = async (articleId, userId) => {
  try {
    const article = await client.getDocument(articleId);
    const isLiked = article.likedBy?.some(ref => ref._ref === userId);

    if (isLiked) {
      // Unlike
      return await client
        .patch(articleId)
        .setIfMissing({ likedBy: [] })
        .insert('replace', 'likedBy[ref($userId)]', [])
        .dec({ likes: 1 })
        .commit({ userId });
    } else {
      // Like
      return await client
        .patch(articleId)
        .setIfMissing({ likedBy: [] })
        .insert('after', 'likedBy[-1]', [{
          _type: 'reference',
          _ref: userId
        }])
        .inc({ likes: 1 })
        .commit();
    }
  } catch (error) {
    console.error("Error toggling article like:", error);
    throw error;
  }
};

// Notification system (unchanged)
export const getNotificationsForUser = async (userId, options = {}) => {
  const { limit = 20, offset = 0, unreadOnly = false } = options;
  
  const query = `*[_type == "notification" && user._ref == $userId${
    unreadOnly ? " && seen == false" : ""
  }] | order(_createdAt desc) [${offset}...${offset + limit}] {
    _id,
    _createdAt,
    type,
    message,
    link,
    seen,
    "sender": sender->{_id, name, photoURL},
    "relatedArticle": relatedArticle->{_id, title}
  }`;

  try {
    return await client.fetch(query, { userId });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const createNotification = async (notificationData) => {
  try {
    return await client.create({
      _type: 'notification',
      ...notificationData,
      seen: false,
      _createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const markNotificationsAsRead = async (notificationIds) => {
  try {
    const transaction = client.transaction();
    
    notificationIds.forEach(id => {
      transaction.patch(id, {
        set: { 
          seen: true,
          readAt: new Date().toISOString() 
        }
      });
    });
    
    await transaction.commit();
    return true;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

// Default export
export default client;