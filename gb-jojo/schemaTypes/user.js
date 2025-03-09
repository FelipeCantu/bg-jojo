import { defineField, defineType } from 'sanity';

export const user = defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    defineField({
      name: 'uid',
      title: 'Firebase UID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'photoURL',
      title: 'Photo URL',
      type: 'url', // For storing the photo URL
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Admin', value: 'admin' },
        ],
      },
      initialValue: 'user',  // Default value for new users
    }),
    defineField({
      name: 'banner',
      title: 'Banner Image',
      type: 'image', // New field for banner image
      options: {
        hotspot: true, // Allows users to adjust the focal point
      },
    }),
  ],
});
