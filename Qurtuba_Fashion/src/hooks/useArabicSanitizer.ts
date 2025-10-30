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
  const nodes = document.querySelectorAll('.arabic-text');
  nodes.forEach((n) => sanitizeElement(n as Element));
}

export function useArabicSanitizer() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try { sanitizeAll(); } catch {}
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            if (node.classList?.contains('arabic-text')) sanitizeElement(node);
            node.querySelectorAll?.('.arabic-text')?.forEach((el) => sanitizeElement(el));
          });
        } else if (m.type === 'characterData') {
          const el = (m.target as any).parentElement as Element | null;
          if (el && el.classList?.contains('arabic-text')) sanitizeElement(el);
        } else if (m.type === 'attributes') {
          const el = m.target as Element;
          if (el && el.classList?.contains('arabic-text')) sanitizeElement(el);
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
