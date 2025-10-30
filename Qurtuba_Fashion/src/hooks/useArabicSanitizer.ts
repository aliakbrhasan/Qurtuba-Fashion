import { useEffect } from 'react';
import { sanitizeArabicText } from '@/utils/encoding';

function sanitizeElement(el: Element) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const original = node.nodeValue ?? '';
    const fixed = sanitizeArabicText(original);
    if (fixed !== original) node.nodeValue = fixed;
  }
  const attrs = ['title', 'placeholder', 'aria-label'];
  attrs.forEach((name) => {
    const val = (el as HTMLElement).getAttribute?.(name);
    if (val) (el as HTMLElement).setAttribute(name, sanitizeArabicText(val));
  });
}

function sanitizeAll() {
  // Sanitize all text in the document once on load (handles legacy mojibake literals)
  try { if (document.body) sanitizeElement(document.body); } catch {}
  // Additionally sanitize explicitly marked Arabic nodes
  try {
    const markedNodes = document.querySelectorAll('.arabic-text');
    markedNodes.forEach((n) => sanitizeElement(n as Element));
  } catch {}
}

export function useArabicSanitizer() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try { sanitizeAll(); } catch {}
    const observer = new MutationObserver((mutations) => {
      const findMarkedAncestor = (node: Element | null): Element | null => {
        let cur: Element | null = node;
        while (cur) {
          if (cur.classList?.contains('arabic-text')) return cur;
          cur = cur.parentElement;
        }
        return null;
      };
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            // Only sanitize nodes that are explicitly marked or contain marked descendants
            if (node.classList?.contains('arabic-text')) sanitizeElement(node);
            node.querySelectorAll?.('.arabic-text')?.forEach((el) => sanitizeElement(el));
          });
        } else if (m.type === 'characterData') {
          const parent = (m.target as any).parentElement as Element | null;
          const marked = findMarkedAncestor(parent);
          if (marked) sanitizeElement(marked);
        } else if (m.type === 'attributes') {
          const el = m.target as Element;
          const marked = findMarkedAncestor(el);
          if (marked) sanitizeElement(marked);
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'placeholder', 'aria-label', 'class']
    });
    return () => observer.disconnect();
  }, []);
}
