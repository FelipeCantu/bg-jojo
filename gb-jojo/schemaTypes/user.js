import {defineField, defineType} from 'sanity'

// Kept as type "user" so existing article author references stay valid.
// Site accounts were removed — this only holds what an article byline needs.
export const user = defineType({
  name: 'user',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Display Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photoURL',
      title: 'Photo URL',
      type: 'url',
      description: 'Optional. Leave blank to show the default avatar.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
  },
})
