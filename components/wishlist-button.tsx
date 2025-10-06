'use client';

import { useState, useTransition } from 'react';
import { toggleWishlistItem } from '@/server/actions/wishlist';

interface WishlistButtonProps {
  productId: string;
  isInitiallyWishlisted: boolean;
}

const HeartIcon = ({ isFilled }: { isFilled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill={isFilled ? 'currentColor' : 'none'}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z"
    />
  </svg>
);

export default function WishlistButton({ productId, isInitiallyWishlisted }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(isInitiallyWishlisted);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      // Optimistic update
      setIsWishlisted(prevState => !prevState);
      try {
        await toggleWishlistItem(productId);
      } catch (error) {
        // Revert on error
        setIsWishlisted(prevState => !prevState);
        console.error('Failed to toggle wishlist item', error);
        // Optionally, show a toast notification to the user
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors duration-200 
        ${isWishlisted ? 'text-red-500 bg-red-100' : 'text-gray-500 bg-white/60 hover:bg-gray-100'}
        ${isPending ? 'cursor-not-allowed' : ''}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <HeartIcon isFilled={isWishlisted} />
    </button>
  );
}
