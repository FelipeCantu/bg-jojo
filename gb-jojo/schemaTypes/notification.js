// schemas/notification.js
import { defineField, defineType } from 'sanity';

export const notification = defineType({
  name: 'notification',
  title: 'Notification',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(), // Every notification must have a recipient
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Like', value: 'like' },
          { title: 'Comment', value: 'comment' },
          { title: 'Follow', value: 'follow' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'string',
      description: 'URL to redirect the user when they click the notification',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'seen',
      title: 'Seen',
      type: 'boolean',
      initialValue: false,
    }),
  ],
});
