import { AnimatePresence, motion } from 'motion/react';
import type { FlyingItem } from '../types.ts';

interface FlyToCartLayerProps {
  flyingItems: FlyingItem[];
  onFinishItem: (id: string) => void;
}

export function FlyToCartLayer({ flyingItems, onFinishItem }: FlyToCartLayerProps) {
  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((fly) => {
          const midX = (fly.startX + fly.endX) / 2;
          const midY = Math.min(fly.startY, fly.endY) - 70;
          return (
            <motion.img
              key={fly.id}
              src={fly.image}
              alt=""
              initial={{
                x: fly.startX,
                y: fly.startY,
                width: fly.startWidth,
                height: fly.startHeight,
                scale: 1,
                opacity: 0.96,
                borderRadius: '14px',
              }}
              animate={{
                x: [fly.startX, midX, fly.endX - 18],
                y: [fly.startY, midY, fly.endY - 18],
                scale: [1, 0.72, 0.22],
                opacity: [0.96, 0.92, 0.15],
                borderRadius: ['14px', '28px', '999px'],
              }}
              transition={{
                duration: 0.88,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => onFinishItem(fly.id)}
              className="fixed top-0 left-0 object-cover shadow-2xl ring-2 ring-amber-400"
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
