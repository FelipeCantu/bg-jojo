import {defineArrayMember, defineField, defineType} from 'sanity'

// Single document (id "aboutPage") edited from the "About Page" sidebar entry.
// Fills the text block on the site's /about page; the hero and the
// "Get to Know Us" carousel stay as they are.
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description:
        'Heading above the text, e.g. "Supporting Mental Health and Suicide Prevention".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'About Text',
      type: 'array',
      description:
        'Press Enter for a new paragraph. Select text to make it bold, italic or a link.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (Rule) => Rule.uri({scheme: ['http', 'https', 'mailto']}),
                  },
                ],
              },
            ],
          },
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Side Image',
      type: 'image',
      description: 'Optional. Shown next to the text on larger screens.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'imageAlt',
      title: 'Image Description',
      type: 'string',
      description: 'Short description of the image for screen readers.',
      hidden: ({parent}) => !parent?.image,
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About Page'}
    },
  },
})
