export const convertHtmlToPortableText = (html) => {
  const blockElements = ['h1', 'h2', 'h3', 'p', 'blockquote'];
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

    // Handle text-based block elements
    if (blockElements.includes(node.nodeName.toLowerCase())) {
      const block = {
        _type: 'block',
        style: node.nodeName.toLowerCase(),
        children: [
          {
            _key: Math.random().toString(36).substr(2, 9),
            _type: 'span',
            text: node.textContent?.trim() || '',
          },
        ],
      };
      portableText.push(block);
    }
  });

  return portableText;
};
