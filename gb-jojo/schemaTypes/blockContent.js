// schemas/blockContent.js
import { defineType, defineArrayMember } from 'sanity';

export const blockContent = defineType({
  name: 'blockContent',
  type: 'array',
  title: 'Block Content',
  of: [
    defineArrayMember({
      type: 'block',
      // Add text alignment support
      options: {
        textAlignment: true
      },
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'URL',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        },
        // Add image alignment field
        {
          name: 'align',
          type: 'string',
          title: 'Alignment',
          options: {
            list: [
              { title: 'Left', value: 'left' },
              { title: 'Center', value: 'center' },
              { title: 'Right', value: 'right' }
            ],
            layout: 'radio'
          },
          initialValue: 'center'
        }
      ],
    }),
  ],
});