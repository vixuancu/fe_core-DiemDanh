import React, { useRef, useEffect } from 'react';

export function ClickAwayListener({
  children,
  onClickAway,
}: {
  children: React.ReactNode;
  onClickAway: (event: MouseEvent | TouchEvent) => void;
}) {
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (node.current && !node.current.contains(event.target as Node)) {
        onClickAway(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClickAway]);

  return <div ref={node}>{children}</div>;
}