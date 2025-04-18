import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// Initialize Sanity client
export const client = createClient({
  projectId: "wssoiuia", // Replace with your project ID
  dataset: "production", // Ensure your dataset is correct
  useCdn: false, // Use CDN for faster responses (disable for fresh data)
  apiVersion: "2023-01-01", // Ensure the API version is specified
  token: process.env.REACT_APP_SANITY_API_TOKEN, // Securely use your token from environment variables
});

// Initialize the image URL builder with the client
const builder = imageUrlBuilder(client);

// Generate URL for images stored in Sanity
export function urlFor(source) {
  if (!source) {
    console.error("Invalid image reference: source is null or undefined");
    return "https://via.placeholder.com/150"; // Fallback image
  }

  const ref = source._ref || source.asset?._ref;

  if (!ref) {
    console.error("Invalid image reference:", source);
    return "https://via.placeholder.com/150"; // Fallback image
  }

  return builder.image({ _ref: ref });
}

// Fetch all articles
export const fetchArticles = async () => {
  const query = `*[_type == "article"]{
      _id,
      title,
      content,
      mainImage,
      publishedDate,
      readingTime,
      author->{
          _id,
          name,
          photoURL
      }
  }`;

  try {
    const articles = await client.fetch(query);
    console.log("✅ Fetched articles:", articles);
    return articles;
  } catch (error) {
    console.error("❌ Error fetching articles:", error);
    throw new Error("Error fetching articles");
  }
};

// Fetch a single article by ID
export const fetchArticleById = async (id) => {
  const query = `*[_type == "article" && _id == $id][0]`;
  try {
    const article = await client.fetch(query, { id });
    return article;
  } catch (error) {
    console.error("❌ Error fetching article:", error);
    throw new Error("Error fetching article");
  }
};

// Upload image to Sanity
export const uploadImageToSanity = async (file) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed.");
  }

  try {
    const imageAsset = await client.assets.upload("image", file);
    if (!imageAsset?._id) {
      throw new Error("Sanity did not return an asset ID.");
    }
    console.log("🔥 Uploaded Image Asset:", imageAsset);
    return { asset: { _ref: imageAsset._id } };
  } catch (error) {
    console.error("❌ Image upload failed:", error.message || error);
    throw new Error("Image upload failed. Please try again.");
  }
};

// Submit an article to Sanity
export const submitArticle = async (articleData, user) => {
  if (!user?.uid) {
    throw new Error("User UID is missing. Please sign in.");
  }

  if (!articleData?.title || !articleData?.content) {
    throw new Error("Article title and content are required.");
  }

  try {
    // Ensure the user exists in Sanity
    let sanityUser = await client.fetch('*[_type == "user" && uid == $uid][0]', { uid: user.uid });

    if (!sanityUser) {
      sanityUser = await client.create({
        _type: "user",
        uid: user.uid,
        name: user.displayName || "Anonymous",
        photoURL: user.photoURL || "",
      });
    }

    // Ensure content is an array (PortableText format)
    const content = Array.isArray(articleData.content) ? articleData.content : [];

    // Submit the article
    const response = await client.create({
      _type: "article",
      title: articleData.title,
      content, // Ensure this is an array of PortableText blocks
      mainImage: articleData.mainImage,
      publishedDate: new Date().toISOString(),
      readingTime: articleData.readingTime,
      author: {
        _type: "reference",
        _ref: sanityUser._id,
      },
    });

    console.log("✅ Article submitted successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error submitting article:", error);
    throw new Error(error.message || "Error submitting article to Sanity");
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
    return user._id; // Return the Firebase UID stored as _id in Sanity
  } catch (error) {
    console.error("❌ Error fetching user from Sanity:", error);
    return null;
  }
};

// Create or update a user in Sanity
export const createUserInSanity = async (user) => {
  try {
    const newUser = {
      _type: "user",
      _id: user.uid,
      name: user.name || "Anonymous",
      email: user.email || "",
      photoURL: user.photoURL || "https://via.placeholder.com/40",
      role: user.role || "user",
    };
    return await client.createOrReplace(newUser); // Use createOrReplace to update existing users
  } catch (error) {
    console.error("❌ Error creating user in Sanity:", error);
    throw new Error("Could not create user in Sanity.");
  }
};

// Delete an article from Sanity
// Delete an article from Sanity and handle references
// Enhanced deleteArticle function with comprehensive reference handling
export const deleteArticle = async (articleId) => {
  try {
    // Step 1: Find all documents that reference this article
    const referencesQuery = `*[references($articleId)]{
      _id,
      _type,
      "references": *[references(^._id)]{_id, _type}  // Find documents that reference these references
    }`;
    
    const referencingDocs = await client.fetch(referencesQuery, { articleId });

    // Step 2: Categorize and process the references
    const transactions = client.transaction();

    // Process each referencing document
    for (const doc of referencingDocs) {
      try {
        // Handle comments and their replies first
        if (doc._type === 'comment') {
          // Delete the comment and any replies to it
          transactions.delete(doc._id);
          
          // Also delete any documents that reference this comment
          if (doc.references && doc.references.length > 0) {
            doc.references.forEach(ref => {
              transactions.delete(ref._id);
            });
          }
        } 
        // Handle other reference types by patching
        else {
          // Get the full document to find all reference fields
          const fullDoc = await client.getDocument(doc._id);
          
          // Find all fields that reference the article
          Object.keys(fullDoc).forEach(key => {
            const value = fullDoc[key];
            
            // Handle direct references
            if (value?._ref === articleId) {
              transactions.patch(doc._id, { set: { [key]: null } });
            }
            
            // Handle references in arrays
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
        // If patching fails, try deleting as last resort
        transactions.delete(doc._id);
      }
    }

    // Step 3: Delete the article itself
    transactions.delete(articleId);

    // Execute all operations in a single transaction
    await transactions.commit();

    console.log("✅ Article and all references deleted successfully!");
    return true;
  } catch (error) {
    console.error("Error deleting article:", error);
    
    // Fallback strategy if transaction fails
    try {
      // Try to delete just the article
      await client.delete(articleId);
      console.log("⚠️ Article deleted but some references might remain");
      return true;
    } catch (fallbackError) {
      console.error("Fallback deletion failed:", fallbackError);
      throw new Error("Could not delete the article. Please try again later.");
    }
  }
};
// Ensure a user exists in Sanity
export const ensureUserExistsInSanity = async (uid, displayName, photoURL) => {
  try {
    // Fetch user data from Sanity using _id (since uid is stored as _id)
    let userDoc = await client.fetch(`*[_type == "user" && _id == $uid][0]`, { uid });

    if (!userDoc) {
      console.log("User does not exist, creating new user...");
      const newUser = await client.create({
        _type: "user",
        _id: uid, // Store Firebase UID as the Sanity _id
        name: displayName || "Anonymous",
        photoURL: photoURL || "https://via.placeholder.com/150",
        role: "user",
      });

      console.log("User created in Sanity:", newUser);
      return newUser;
    } else {
      console.log("User already exists in Sanity:", userDoc);

      // Optional: Update user info if displayName or photoURL changed
      if (userDoc.name !== displayName || userDoc.photoURL !== photoURL) {
        await client
          .patch(userDoc._id)
          .set({
            name: displayName || userDoc.name,
            photoURL: photoURL || userDoc.photoURL,
          })
          .commit();

        console.log("User updated in Sanity");
      }

      return userDoc;
    }
  } catch (error) {
    console.error("Error ensuring user exists in Sanity:", error);
    throw new Error("Error checking or creating user in Sanity");
  }
};

// Update user profile in Sanity
export const updateUserProfileInSanity = async (uid, bannerUrl) => {
  try {
    const userDoc = await client.fetch('*[_type == "user" && _id == $uid][0]', { uid });

    if (userDoc) {
      // Update the user's banner image
      await client
        .patch(userDoc._id)
        .set({ banner: { asset: { _ref: bannerUrl } } })
        .commit();

      console.log("User profile updated with new banner image");
    } else {
      console.log("User not found in Sanity, create the user first");
    }
  } catch (error) {
    console.error("Error updating user profile in Sanity:", error);
  }
};

// Fetch unread notifications for a user
export const getNotificationsForUser = async (userId, options = {}) => {
  if (!userId) throw new Error("User ID is required");

  try {
    const { limit = 20, offset = 0, unreadOnly = false } = options;
    
    const query = `*[_type == "notification" && user._ref == $userId${
      unreadOnly ? " && seen == false" : ""
    }] | order(createdAt desc) [${offset}...${offset + limit}] {
      _id,
      _createdAt,
      type,
      message,
      link,
      seen,
      readAt,
      "sender": sender->{_id, name, image},
      "relatedContent": relatedContent->{_id, title}
    }`;
    
    const params = { userId };
    return await client.fetch(query, params);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
};

export const markNotificationsAsRead = async (notificationIds) => {
  if (!notificationIds?.length) return;

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
    console.error("Failed to mark notifications as read:", error);
    throw new Error("Failed to update notifications");
  }
};

export const createNotification = async ({
  userId,
  type,
  message,
  link,
  senderId,
  relatedContentId
}) => {
  if (!userId || !type) {
    throw new Error("Missing required fields: userId and type");
  }

  // Default messages based on notification type
  const defaultMessages = {
    like: "{sender} liked your {content}",
    comment: "{sender} commented on your {content}",
    reply: "{sender} replied to your comment",
    follow: "{sender} started following you",
    mention: "{sender} mentioned you in a {content}",
    system: "System notification"
  };

  try {
    const notificationData = {
      _type: "notification",
      user: { _type: "reference", _ref: userId },
      type,
      message: message || defaultMessages[type] || "You have a new notification",
      link: link || "",
      seen: false,
      createdAt: new Date().toISOString(),
      ...(senderId && { sender: { _type: "reference", _ref: senderId } }),
      ...(relatedContentId && { 
        relatedContent: { _type: "reference", _ref: relatedContentId } 
      })
    };

    const notification = await client.create(notificationData);
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};

// Optional: Add this if you need to delete notifications
export const deleteNotification = async (notificationId) => {
  try {
    await client.delete(notificationId);
    return true;
  } catch (error) {
    console.error("Failed to delete notification:", error);
    throw new Error("Failed to delete notification");
  }
};

// Optional: Add this if you need to count unread notifications
export const countUnreadNotifications = async (userId) => {
  try {
    const query = `count(*[_type == "notification" && user._ref == $userId && seen == false])`;
    const params = { userId };
    return await client.fetch(query, params);
  } catch (error) {
    console.error("Failed to count unread notifications:", error);
    return 0;
  }
};

// Export the default client for other functions if needed
export default client;
