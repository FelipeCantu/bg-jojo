import { defineField, defineType } from 'sanity';
import { blockContent } from './blockContent';

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: blockContent.name,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isAnonymous',
      title: 'Hide Author Identity',
      type: 'boolean',
      initialValue: false,
      description: 'When enabled, this article will show as "Anonymous" everywhere',
    }),
    defineField({
      name: 'authorName',
      title: 'Author Name (Cached)',
      type: 'string',
      description: 'Automatically filled with author name for performance',
      readOnly: true,
    }),
    defineField({
      name: 'authorImage',
      title: 'Author Image URL (Cached)',
      type: 'url',
      description: 'Automatically filled with author image URL for performance',
      readOnly: true,
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading Time (minutes)',
      type: 'number',
      validation: (Rule) => Rule.min(1).required(),
    }),
    defineField({
      name: 'likes',
      title: 'Likes Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'likedBy',
      title: 'Liked By',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
      options: { disableNew: true },
      readOnly: true,
    }),
    defineField({
      name: 'views',
      title: 'Views Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'firebaseId',
      title: 'Firebase Document ID',
      type: 'string',
      description: 'Used to sync with Firebase Firestore',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      authorName: 'author.name',
      isAnonymous: 'isAnonymous',
      media: 'mainImage'
    },
    prepare(selection) {
      const { title, authorName, isAnonymous, media } = selection
      return {
        title: title,
        subtitle: isAnonymous ? 'Anonymous' : `By ${authorName || 'Unknown'}`,
        media: media
      }
    }
  }
});