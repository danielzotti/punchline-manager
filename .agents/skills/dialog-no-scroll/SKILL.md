---
name: dialog-no-scroll
description: Enforce scroll prevention on document body when dialogs, modals, or fullscreen overlays are active.
---

# Dialog No-Scroll

When creating or modifying dialogs, modals, drawers, or mobile fullscreen overlays, always ensure the main page body does not scroll under the modal overlay.

## Guidelines

1. **Use `useEffect` for Modal State**:
   - In React components that toggle a modal/dialog state (e.g. `isOpen`), use a `useEffect` hook to toggle the `overflow-hidden` class (or custom styling) on `document.body`.
   
   Example:
   ```typescript
   useEffect(() => {
     if (isOpen) {
       document.body.classList.add('overflow-hidden');
     } else {
       document.body.classList.remove('overflow-hidden');
     }
     // Clean up to ensure overflow is restored when component unmounts
     return () => {
       document.body.classList.remove('overflow-hidden');
     };
   }, [isOpen]);
   ```

2. **Tailwind/CSS class**:
   - Ensure the `overflow-hidden` class (or `overflow: hidden`) is supported in global stylesheets to correctly lock document scrolling.
