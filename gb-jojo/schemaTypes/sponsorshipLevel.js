import { defineType, defineField } from 'sanity';

export const sponsorshipLevel = defineType({
  name: 'sponsorshipLevel',
  title: "Jojo's Generosity Level",
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "Reaching Out"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'string',
      description: 'e.g. "$1,000"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'perks',
      title: 'Perks',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List each perk as a separate item',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first (e.g. 1, 2, 3…)',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'amount',
    },
  },
});
