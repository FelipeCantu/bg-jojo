import { defineType, defineField } from 'sanity';

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,  // Allows cropping of images in the Sanity Studio
      },
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        defineField({
          name: 'city',
          title: 'City',
          type: 'string',
        }),
        defineField({
          name: 'state',
          title: 'State',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'age',
      title: 'Age Range',
      type: 'string',
      options: {
        list: ['All Ages', '18+', '21+', 'Family Friendly', 'Teens and Up'],
      },
    }),
    defineField({
      name: 'approximateRunningTime',
      title: 'Approximate Running Time',
      type: 'string',
    }),
    defineField({
      name: 'doorOpenTime',
      title: 'Door Open Time',
      type: 'string',  // Changed to string to accept custom time format
      description: 'Enter time in format "hh:mm AM/PM"',
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',  // Simple string for venue name
    }),
  ],
});
