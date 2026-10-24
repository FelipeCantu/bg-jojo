import {defineField, defineType} from 'sanity'

// One card in the scrolling logo strip at the bottom of the site's /about page.
export const businessLogo = defineType({
  name: 'businessLogo',
  title: 'Business Logo',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Business Name',
      type: 'string',
      description: 'Not shown on the card; screen readers read it out for the logo.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'A logo with a transparent or white background looks best.',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: 'Optional. One or two sentences shown when the card expands.',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      description: 'Optional. Clicking the logo card opens this website.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Optional. Lower numbers appear first; logos without a number go last.',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrder',
      by: [
        {field: 'order', direction: 'asc'},
        {field: 'name', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'name', subtitle: 'website', media: 'logo'},
  },
})
