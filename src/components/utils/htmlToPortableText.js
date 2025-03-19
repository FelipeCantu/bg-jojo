export const convertHtmlToPortableText = (html) => {
  const blockElements = ['h1', 'h2', 'h3', 'blockquote', 'p'];
  const portableText = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.body.childNodes.forEach((node) => {
    // Handle images separately
    if (node.nodeName === 'IMG') {
      portableText.push({
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: node.getAttribute('data-sanity-ref') || node.getAttribute('src'),
        },
      });
      return;
    }

    // Handle block elements (like h1, h2, blockquote, p)
    if (blockElements.includes(node.nodeName.toLowerCase())) {
      const style = node.nodeName.toLowerCase() === 'p' ? 'normal' : node.nodeName.toLowerCase();
      const children = [];
      const markDefs = [];

      // Process child nodes (to catch <a> tags inside paragraphs/headings)
      node.childNodes.forEach((child) => {
        if (child.nodeName === 'A') {
          const href = child.getAttribute('href');
          const markKey = Math.random().toString(36).substr(2, 9);
          markDefs.push({
            _key: markKey,
            _type: 'link',
            href: href,
          });

          children.push({
            _key: Math.random().toString(36).substr(2, 9),
            _type: 'span',
            text: child.textContent || '',
            marks: [markKey],
          });
        } else if (child.nodeType === 3) { // Text node
          children.push({
            _key: Math.random().toString(36).substr(2, 9),
            _type: 'span',
            text: child.textContent || '',
          });
        }
      });

      // If no children (like pure text in block), fallback to whole textContent
      if (children.length === 0) {
        children.push({
          _key: Math.random().toString(36).substr(2, 9),
          _type: 'span',
          text: node.textContent?.trim() || '',
        });
      }

      portableText.push({
        _type: 'block',
        style,
        children,
        markDefs,
      });
    }
  });

  return portableText;
};
