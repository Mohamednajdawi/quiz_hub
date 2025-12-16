'use client';

import { ReactNode } from 'react';

/**
 * Lightweight fade-in animation component using CSS instead of Framer Motion
 * for better performance on simple animations
 */
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
