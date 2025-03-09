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

export const submitArticle = async (articleData, user) => {
  if (!user?.uid) {
    throw new Error("User UID is missing. Please sign in.");
  }

  if (!articleData?.title || !articleData?.content) {
    throw new Error("Article title and content are required.");
  }

  console.log("🔍 Ensuring user exists in Sanity:", user.uid);

  try {
    // Check if the user already exists in Sanity
    let sanityUser = await client.fetch('*[_type == "user" && uid == $uid][0]', { uid: user.uid });

    if (!sanityUser) {
      console.log("👤 User does not exist. Creating user in Sanity.");
      // If the user does not exist, create a new user
      sanityUser = await client.create({
        _type: "user",
        uid: user.uid,
        name: user.displayName || "Anonymous",
        photoURL: user.photoURL || "", // Store photoURL in Sanity
        photo: user.photoURL ? { asset: { _ref: user.photoURL } } : null, // Store image reference if available
      });

      console.log("👤 User created in Sanity:", sanityUser);
    } else {
      console.log("👤 User confirmed in Sanity:", sanityUser.name);
    }

    // Submit the article with the author information
    const response = await client.create({
      _type: "article",
      title: articleData.title,
      content: articleData.content,
      mainImage: articleData.mainImage,
      publishedDate: new Date().toISOString(),
      readingTime: articleData.readingTime,
      author: {
        _type: "reference",
        _ref: sanityUser._id, // Link article to the user in Sanity
      },
      authorName: sanityUser.name, // Save the author's name
      authorImage: sanityUser.photoURL || '', // Save the author's photo URL from the user document
    });

    console.log("✅ Article submitted successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error submitting article:", error);
    throw new Error(error.message || "Error submitting article to Sanity");
  }
};




export const getUserFromSanity = async (uid) => {
  const query = `*[_type == "user" && _id == $uid][0]`;
  try {
      const user = await client.fetch(query, { uid });
      if (!user) {
          throw new Error(`User with UID: ${uid} not found in Sanity`);
      }
      // Return the Firebase UID stored as _id in Sanity
      return user._id; // This is the Firebase UID
  } catch (error) {
      console.error("❌ Error fetching user from Sanity:", error);
      return null;
  }
};


// Create a new user in Sanity if they don't exist
// Updated createUserInSanity function
export const createUserInSanity = async (user) => {
  try {
      const newUser = {
          _type: "user",
          _id: user.uid,
          name: user.name || "Anonymous",
          email: user.email || "",
          photoURL: user.photoURL || "https://via.placeholder.com/40", // Default fallback photo
          role: user.role || "user",  // Ensure role is passed dynamically
      };
      return await client.createOrReplace(newUser);  // Use createOrReplace to update existing users
  } catch (error) {
      console.error("❌ Error creating user in Sanity:", error);
      throw new Error("Could not create user in Sanity.");
  }
};


// Delete article from Sanity
export const deleteArticle = async (articleId) => {
  try {
    const result = await client.delete(articleId);
    console.log("✅ Article deleted successfully!", result);
    return result;
  } catch (error) {
    console.error("Error deleting article:", error);
    throw new Error("Could not delete the article");
  }
};

export const ensureUserExistsInSanity = async (uid, displayName, photoURL) => {
  try {
    // Fetch user data from Sanity using _id (since uid is stored as _id)
    let userDoc = await client.fetch(
      `*[_type == "user" && _id == $uid][0]`, 
      { uid }
    );

    if (!userDoc) {
      console.log('User does not exist, creating new user...');
      const newUser = await client.create({
        _type: 'user',
        _id: uid, // Store Firebase UID as the Sanity _id
        name: displayName || 'Anonymous',  
        photoURL: photoURL || 'https://via.placeholder.com/150',  
        role: 'user',  
      });

      console.log('User created in Sanity:', newUser);
      return newUser;
    } else {
      console.log('User already exists in Sanity:', userDoc);

      // Optional: Update user info if displayName or photoURL changed
      if (userDoc.name !== displayName || userDoc.photoURL !== photoURL) {
        await client.patch(userDoc._id)
          .set({
            name: displayName || userDoc.name,
            photoURL: photoURL || userDoc.photoURL,
          })
          .commit();
        
        console.log('User updated in Sanity');
      }

      return userDoc;
    }
  } catch (error) {
    console.error('Error ensuring user exists in Sanity:', error);
    throw new Error('Error checking or creating user in Sanity');
  }
};

export const updateUserProfileInSanity = async (uid, bannerUrl) => {
  try {
    const userDoc = await client.fetch('*[_type == "user" && _id == $uid][0]', { uid });

    if (userDoc) {
      // Update the user's banner image
      await client.patch(userDoc._id)
        .set({ banner: { asset: { _ref: bannerUrl } } })
        .commit();

      console.log('User profile updated with new banner image');
    } else {
      console.log("User not found in Sanity, create the user first");
    }
  } catch (error) {
    console.error("Error updating user profile in Sanity:", error);
  }
};


// Export the default client for other functions if needed
export default client;
