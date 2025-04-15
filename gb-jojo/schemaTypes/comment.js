import { defineType, defineField } from 'sanity';

export const comment = defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      validation: (Rule) => Rule.required().min(1).max(1000),
    }),
    defineField({
      name: 'article',
      title: 'Article',
      type: 'reference',
      to: [{ type: 'article' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'replies',
      title: 'Replies',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'comment' }] }],
      description: 'Optional threaded replies to this comment.',
    }),
  ],
  preview: {
    select: {
      title: 'text',
      user: 'user.name',
      article: 'article.title'
    },
    prepare(selection) {
      const { title, user, article } = selection;
      return {
        title: title || 'No text',
        subtitle: `by ${user || 'unknown'} on ${article || 'unknown article'}`
      };
    }
  }
});
