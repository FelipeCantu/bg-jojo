import { defineField, defineType } from 'sanity';

export const tribute = defineType({
  name: "tribute",
  title: "Tributes",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string" }),
    defineField({ name: "image", title: "Image", type: "image", options: { hotspot: true } }),
    defineField({ name: "bio", title: "Biography", type: "text" }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name", maxLength: 200 } }),
  ],
});
