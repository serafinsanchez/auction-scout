import { useState, useEffect } from 'react';

// This component prevents server-side code from running in the browser
// Use it to wrap any components that might use Node.js specific modules
export default function ClientOnly({ children, ...delegated }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div {...delegated}>{children}</div>;
} 