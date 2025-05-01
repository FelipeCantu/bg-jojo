import { defineType, defineField, defineArrayMember } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Base Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'stripePriceId',
      title: 'Stripe Price ID',
      type: 'string',
      description: 'Paste the Price ID from your Stripe Dashboard (e.g. price_1Nxxx...)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'stripeProductId',
      title: 'Stripe Product ID',
      type: 'string',
      description: 'Optional: The Product ID from Stripe (e.g. prod_123abc)',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required().min(10),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'sizeOptions',
      title: 'Size Options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'stock',
              title: 'Stock Quantity',
              type: 'number',
              initialValue: 0,
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: {
              title: 'size',
              subtitle: 'stock',
            },
          },
        }),
      ],
      description: 'Track inventory for each size',
    }),
    defineField({
      name: 'sizes',
      title: 'Sizes (Simple)',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'material',
      title: 'Material',
      type: 'string',
      description: 'e.g. 100% Cotton, Cotton/Poly Blend',
    }),
    defineField({
      name: 'fit',
      title: 'Fit',
      type: 'string',
      options: {
        list: ["Unisex", "Men's", "Women's", "Kids"],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'stock',
      title: 'Stock Quantity',
      type: 'number',
      description: 'Leave blank if not tracked',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'images.0',
    },
  },
});
