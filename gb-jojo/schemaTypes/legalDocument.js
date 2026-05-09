import { defineField, defineType } from 'sanity';

export const legalDocument = defineType({
  name: 'legalDocument',
  title: 'Legal Document',
  type: 'document',
  fields: [
    defineField({
      name: 'docType',
      title: 'Document Type',
      type: 'string',
      options: {
        list: [
          { title: 'Privacy Policy', value: 'privacy' },
          { title: 'Terms of Service', value: 'terms' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'date',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      docType: 'docType',
    },
    prepare({ title, docType }) {
      return {
        title: title || 'Untitled',
        subtitle: docType === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
      };
    },
  },
});
