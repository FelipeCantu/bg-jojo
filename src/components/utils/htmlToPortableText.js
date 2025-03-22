export const convertHtmlToPortableText = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const portableText = [];
  let markDefs = [];
  const visitedNodes = new WeakSet();

  function processChildNodes(node) {
    if (!node || visitedNodes.has(node)) return { children: [], markDefs: [] };
    visitedNodes.add(node);

    const children = [];
    const localMarkDefs = [];

    node.childNodes.forEach((child) => {
      if (node === child) {
        console.warn('Skipping recursive node reference!');
        return;
      }

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.trim();
        if (text) {
          children.push({
            _type: 'span',
            text,
          });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        let markKey;
        if (child.tagName === 'STRONG') markKey = 'strong';
        if (child.tagName === 'EM') markKey = 'em';
        if (child.tagName === 'U') markKey = 'underline';

        if (child.tagName === 'A' && child.hasAttribute('href')) {
          // Handle links
          const href = child.getAttribute('href');
          const linkId = `link-${Math.random().toString(36).substr(2, 9)}`;

          localMarkDefs.push({
            _key: linkId,
            _type: 'link',
            href,
          });

          const { children: innerChildren, markDefs: innerMarkDefs } = processChildNodes(child);
          children.push(
            ...innerChildren.map((span) => ({
              ...span,
              marks: [...(span.marks || []), linkId],
            }))
          );
          localMarkDefs.push(...innerMarkDefs);
        } else if (markKey) {
          const markId = `${markKey}-${Math.random().toString(36).substr(2, 9)}`;
          localMarkDefs.push({ _key: markId, _type: markKey });

          const { children: innerChildren, markDefs: innerMarkDefs } = processChildNodes(child);
          children.push(
            ...innerChildren.map((span) => ({
              ...span,
              marks: [...(span.marks || []), markId],
            }))
          );
          localMarkDefs.push(...innerMarkDefs);
        } else {
          const { children: innerChildren, markDefs: innerMarkDefs } = processChildNodes(child);
          children.push(...innerChildren);
          localMarkDefs.push(...innerMarkDefs);
        }
      }
    });

    return { children, markDefs: localMarkDefs };
  }

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === 'P' || node.nodeName.match(/^H[1-6]$/) || node.nodeName === 'BLOCKQUOTE') {
        const style = node.nodeName.toLowerCase() === 'blockquote' ? 'blockquote' : node.nodeName.toLowerCase();
        const { children, markDefs: blockMarkDefs } = processChildNodes(node);

        portableText.push({
          _type: 'block',
          style,
          children,
          markDefs: blockMarkDefs,
        });

        markDefs.push(...blockMarkDefs);
      }

      // Handle lists (unordered and ordered)
      if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        const listType = node.nodeName === 'UL' ? 'bullet' : 'number';
        const listItems = [];

        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeName === 'LI') {
            const { children, markDefs: listMarkDefs } = processChildNodes(child);
            listItems.push({
              _type: 'block',
              style: 'normal',
              listItem: listType,
              children,
              markDefs: listMarkDefs,
            });

            markDefs.push(...listMarkDefs);
          }
        });

        portableText.push(...listItems);
      }
    }
  });

  return portableText;
};
