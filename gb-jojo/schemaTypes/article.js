// schemas/article.js
import { defineField, defineType } from 'sanity';
import { blockContent } from './blockContent'; // Import the blockContent schema

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: blockContent.name, // Reference the blockContent schema
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(), // Ensure every article has an author
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published Date',
      type: 'datetime',
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading Time (minutes)',
      type: 'number',
    }),
    defineField({
      name: 'views',
      title: 'Views',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'likes',
      title: 'Likes',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'likedBy',
      title: 'Liked By',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
    }),
  ],
});