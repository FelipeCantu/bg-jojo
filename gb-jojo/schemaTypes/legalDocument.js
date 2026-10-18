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
      // Set automatically by the Legal Pages sidebar entries
      readOnly: true,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shown as the page heading.',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'date',
      description: 'Shown under the heading. Update it whenever you change the text.',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
      description: 'Use H2 for section titles. The title and date above are added to the page automatically.',
      validation: Rule => Rule.required(),
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
