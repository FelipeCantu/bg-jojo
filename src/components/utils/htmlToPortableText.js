import { client } from '../../sanityClient';

export const convertHtmlToPortableText = async (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const portableText = [];
  const markDefs = [];

  const uploadImage = async (src) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      const result = await client.assets.upload('image', file);
      return result._id;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image.');
    }
  };

  const processChildNodes = async (node) => {
    const children = [];
    const localMarkDefs = [];

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.replace(/\s+/g, ' '); // Preserve spaces
        if (text) {
          children.push({ _type: 'span', text });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        let markKey;

        if (child.tagName === 'STRONG' || child.tagName === 'B') markKey = 'strong';
        if (child.tagName === 'EM' || child.tagName === 'I') markKey = 'em';
        if (child.tagName === 'U') markKey = 'underline';

        if (child.tagName === 'A' && child.hasAttribute('href')) {
          const href = child.getAttribute('href');
          const linkId = `link-${Math.random().toString(36).substr(2, 9)}`;

          localMarkDefs.push({ _key: linkId, _type: 'link', href });

          const { children: innerChildren } = await processChildNodes(child);
          children.push(
            ...innerChildren.map((span, index) => ({
              ...span,
              text: (index === 0 ? ' ' : '') + span.text + ' ', // Ensure inline spacing
              marks: [...(span.marks || []), linkId],
            }))
          );
        } else if (markKey) {
          const markId = `${markKey}-${Math.random().toString(36).substr(2, 9)}`;
          localMarkDefs.push({ _key: markId, _type: markKey });

          const { children: innerChildren } = await processChildNodes(child);
          children.push(
            ...innerChildren.map((span, index) => ({
              ...span,
              text: (index === 0 ? ' ' : '') + span.text + ' ', // Ensure spacing
              marks: [...(span.marks || []), markId],
            }))
          );
        } else {
          const { children: innerChildren } = await processChildNodes(child);
          children.push(...innerChildren);
        }
      }
    }

    markDefs.push(...localMarkDefs);
    return { children };
  };

  for (const node of doc.body.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === 'P' || node.nodeName.match(/^H[1-6]$/) || node.nodeName === 'BLOCKQUOTE') {
        const style = node.nodeName.toLowerCase() === 'blockquote' ? 'blockquote' : node.nodeName.toLowerCase();
        const { children } = await processChildNodes(node);
        
        // Get alignment from style attribute or class
        let alignment = null;
        if (node.hasAttribute('style')) {
          const styleText = node.getAttribute('style');
          const match = styleText.match(/text-align:\s*(left|center|right|justify)/);
          if (match) {
            alignment = match[1];
          }
        }
        
        // Check for alignment classes if not found in style
        if (!alignment && node.hasAttribute('class')) {
          const classes = node.getAttribute('class').split(' ');
          if (classes.includes('text-left')) alignment = 'left';
          else if (classes.includes('text-center')) alignment = 'center';
          else if (classes.includes('text-right')) alignment = 'right';
          else if (classes.includes('text-justify')) alignment = 'justify';
        }

        const block = {
          _type: 'block',
          style,
          children,
          markDefs: markDefs.filter((def) => children.some((child) => child.marks?.includes(def._key))),
        };

        // Add alignment if specified
        if (alignment) {
          block.textAlign = alignment;
        }

        portableText.push(block);
      }

      if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        const listType = node.nodeName === 'UL' ? 'bullet' : 'number';
        const listItems = [];

        for (const child of node.childNodes) {
          if (child.nodeName === 'LI') {
            const { children } = await processChildNodes(child);
            listItems.push({
              _type: 'block',
              style: 'normal',
              listItem: listType,
              children,
              markDefs: markDefs.filter((def) => children.some((child) => child.marks?.includes(def._key))),
            });
          }
        }

        portableText.push(...listItems);
      }

      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        const imageRef = await uploadImage(src);

        const imageBlock = {
          _type: 'image',
          asset: { _type: 'reference', _ref: imageRef },
          alt,
        };

        // Handle image alignment
        let alignment = null;
        if (node.hasAttribute('style')) {
          const styleText = node.getAttribute('style');
          const match = styleText.match(/float:\s*(left|right)/);
          if (match) {
            alignment = match[1];
          }
        }
        
        // Check for alignment classes if not found in style
        if (!alignment && node.hasAttribute('class')) {
          const classes = node.getAttribute('class').split(' ');
          if (classes.includes('float-left') || classes.includes('align-left')) alignment = 'left';
          else if (classes.includes('float-right') || classes.includes('align-right')) alignment = 'right';
          else if (classes.includes('align-center') || classes.includes('align-middle')) alignment = 'center';
        }

        if (alignment) {
          imageBlock.align = alignment;
        }

        portableText.push(imageBlock);
      }
    }
  }

  return portableText;
};