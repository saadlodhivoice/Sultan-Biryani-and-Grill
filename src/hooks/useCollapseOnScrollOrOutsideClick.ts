import { useEffect, type RefObject } from 'react';

/**
 * Automatically invokes `onCollapse` when the user scrolls anywhere on the page
 * or clicks/taps outside the referenced container element.
 */
export function useCollapseOnScrollOrOutsideClick(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onCollapse: () => void
): void {
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      onCollapse();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      onCollapse();
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('pointerdown', handlePointerDown, { capture: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    };
  }, [isOpen, containerRef, onCollapse]);
}
