import { defineType, defineField } from "sanity";

export const carousel =  defineType({
  name: "carousel",
  title: "Carousel",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "string",
    }),
  ],
});
