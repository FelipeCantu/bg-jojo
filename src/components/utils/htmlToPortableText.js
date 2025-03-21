export const convertHtmlToPortableText = (html) => {
  const blockElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p'];
  const portableText = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  /**
   * Processes a node and converts it to PortableText format.
   * @param {Node} node - The DOM node to process.
   */
  const processNode = (node) => {
    // Handle images
    if (node.nodeName === 'IMG') {
      portableText.push({
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: node.getAttribute('data-sanity-ref') || node.getAttribute('src'),
        },
        alt: node.getAttribute('alt') || '',
      });
      return;
    }

    // Handle lists (ordered and unordered)
    if (node.nodeName === 'UL' || node.nodeName === 'OL') {
      const listType = node.nodeName === 'UL' ? 'bullet' : 'number';
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeName === 'LI') {
          const { children, markDefs } = processChildNodes(child);
          portableText.push({
            _type: 'block',
            style: 'normal',
            listItem: listType,
            children,
            markDefs,
          });
        }
      });
      return;
    }

    // Handle block elements (headings, paragraphs, blockquotes)
    if (blockElements.includes(node.nodeName.toLowerCase())) {
      const tag = node.nodeName.toLowerCase();
      const style = tag === 'blockquote' ? 'blockquote' : tag === 'p' ? 'normal' : tag;

      const { children, markDefs } = processChildNodes(node);

      // Add the block to PortableText
      portableText.push({
        _type: 'block',
        style,
        children,
        markDefs,
      });
    }
  };

  /**
   * Processes child nodes of a block element and returns PortableText-compatible children and markDefs.
   * @param {Node} node - The parent node whose children need to be processed.
   * @returns {Object} - An object containing `children` and `markDefs`.
   */
  const processChildNodes = (node) => {
    const children = [];
    const markDefs = [];

    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeName === 'A') {
        // Handle links
        const href = child.getAttribute('href');
        const markKey = `link-${Math.random().toString(36).substr(2, 9)}`;
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
        // Handle bold text
        children.push({
          _key: Math.random().toString(36).substr(2, 9),
          _type: 'span',
          text: child.textContent || '',
          marks: ['strong'],
        });
      } else if (['EM', 'I'].includes(child.nodeName)) {
        // Handle italic text
        children.push({
          _key: Math.random().toString(36).substr(2, 9),
          _type: 'span',
          text: child.textContent || '',
          marks: ['em'],
        });
      } else if (child.nodeType === 3 && child.textContent?.trim()) {
        // Handle text nodes
        children.push({
          _key: Math.random().toString(36).substr(2, 9),
          _type: 'span',
          text: child.textContent.trim(),
        });
      }
    });

    return { children, markDefs };
  };

  // Process all top-level nodes in the document
  Array.from(doc.body.childNodes).forEach((node) => {
    processNode(node);
  });

  return portableText;
};