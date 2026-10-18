// One-time cleanup after removing site accounts, comments and notifications.
//
// Dry run (prints what would change, writes nothing):
//   npx sanity exec scripts/cleanup-personal-data.js --with-user-token
// Apply:
//   npx sanity exec scripts/cleanup-personal-data.js --with-user-token -- --apply
//
// What it does, in order (references must be cleared before users can be deleted):
//   1. Deletes every `notification` and `comment` document (incl. drafts)
//   2. Removes like/view/Firebase bookkeeping fields from articles
//   3. Strips user docs still used as an article author down to just `name`
//   4. Deletes every other user doc (emails, UIDs, provider info, photo URLs)
import { getCliClient } from 'sanity/cli';

const APPLY = process.argv.includes('--apply');
const client = getCliClient({ apiVersion: '2023-05-03' });

const ARTICLE_FIELDS_TO_REMOVE = [
  'likes', 'likedBy', 'views', 'lastViewDate', 'firebaseId', 'authorName', 'authorImage',
];
const USER_FIELDS_TO_REMOVE = [
  'uid', 'email', 'emailVerified', 'photoURL', 'authProvider', 'providerData',
  'primaryProvider', 'role', 'notificationPrefs', 'bannerImage', 'createdAt', 'lastLogin',
];

async function main() {
  const [notificationsAndComments, articles, users, authorIds] = await Promise.all([
    client.fetch(`*[_type in ["notification", "comment"]]._id`),
    client.fetch(`*[_type == "article"]._id`),
    client.fetch(`*[_type == "user"]{_id, "hasEmail": defined(email)}`),
    client.fetch(`array::unique(*[_type == "article" && defined(author._ref)].author._ref)`),
  ]);

  // An author referenced by a published article may also exist as a draft.
  const keep = new Set(authorIds.flatMap((id) => [id, `drafts.${id}`]));
  const usersToStrip = users.filter((u) => keep.has(u._id));
  const usersToDelete = users.filter((u) => !keep.has(u._id));

  console.log(`Notifications + comments to delete: ${notificationsAndComments.length}`);
  console.log(`Articles to clean (like/view fields): ${articles.length}`);
  console.log(`Author user docs to strip to name only: ${usersToStrip.length}`);
  console.log(`Other user docs to delete: ${usersToDelete.length} ` +
    `(${usersToDelete.filter((u) => u.hasEmail).length} contain an email)`);

  if (!APPLY) {
    console.log('\nDry run only. Re-run with "-- --apply" to make these changes.');
    return;
  }

  const step1 = client.transaction();
  notificationsAndComments.forEach((id) => step1.delete(id));
  articles.forEach((id) => step1.patch(id, (p) => p.unset(ARTICLE_FIELDS_TO_REMOVE)));
  usersToStrip.forEach((u) => step1.patch(u._id, (p) => p.unset(USER_FIELDS_TO_REMOVE)));
  await step1.commit();
  console.log('Step 1 done: notifications/comments deleted, articles and authors cleaned.');

  const step2 = client.transaction();
  usersToDelete.forEach((u) => step2.delete(u._id));
  await step2.commit();
  console.log(`Step 2 done: ${usersToDelete.length} user docs deleted.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
