export default {
    name: "tribute",
    title: "Tributes",
    type: "document",
    fields: [
      { name: "name", title: "Name", type: "string" },
      { name: "image", title: "Image", type: "image", options: { hotspot: true } },
      { name: "bio", title: "Biography", type: "text" },
      { name: "date", title: "Date", type: "date" },
      { name: "slug", title: "Slug", type: "slug", options: { source: "name", maxLength: 200 } },
    ],
  };
  