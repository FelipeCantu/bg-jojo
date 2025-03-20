export const convertHtmlToPortableText = (html) => {
  const blockElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p'];
  const portableText = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.body.childNodes.forEach((node) => {
    console.log('Processing Node:', node); // Log each node being processed

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

    if (blockElements.includes(node.nodeName.toLowerCase())) {
      const tag = node.nodeName.toLowerCase();
      const style = tag === 'blockquote' ? 'blockquote' : (tag === 'p' ? 'normal' : tag);
      console.log('Found block element:', tag, 'with style:', style); // Log block elements found

      const children = [];
      const markDefs = [];

      node.childNodes.forEach((child) => {
        if (child.nodeName === 'A') {
          const href = child.getAttribute('href');
          const markKey = Math.random().toString(36).substr(2, 9);
          markDefs.push({
            _key: markKey,
            _type: 'link',
            href,
          });
          children.push({
            _key: Math.random().toString(36).substr(2, 9),
            _type: 'span',
            text: child.textContent || '',
            marks: [markKey],
          });
        } else if (['STRONG', 'B'].includes(child.nodeName)) {
          children.push({
            _key: Math.random().toString(36).substr(2, 9),
            _type: 'span',
            text: child.textContent || '',
            marks: ['strong'],
          });
        } else if (['EM', 'I'].includes(child.nodeName)) {
          children.push({
            _key: Math.random().toString(36).substr(2, 9),
            _type: 'span',
            text: child.textContent || '',
            marks: ['em'],
          });
        } else if (child.nodeType === 3) { // Text Node
          children.push({
            _key: Math.random().toString(36).substr(2, 9),
            _type: 'span',
            text: child.textContent?.trim() || '',
          });
        }
      });

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

  console.log('Generated Portable Text:', portableText); // Log the final Portable Text
  return portableText;
};
