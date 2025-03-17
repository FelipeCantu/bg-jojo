// schemas/schema.js
import { tribute } from './tribute';
import { event } from './event';
import { carousel } from './carousel';
import { article } from './article';
import { user } from './user';
import { blockContent } from './blockContent'; // Import the blockContent schema

export const schemaTypes = [
  tribute,
  event,
  carousel,
  article,
  user,
  blockContent, // Add the blockContent schema
];