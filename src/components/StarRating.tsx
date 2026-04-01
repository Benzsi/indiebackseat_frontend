import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  totalRatings?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalRatings,
  onRate,
  readonly = false,
  size = 'medium'
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  const starSize = sizeMap[size];
  const displayRating = hoveredRating || rating;

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fillPercentage = Math.min(Math.max(displayRating - i + 1, 0), 1) * 100;
      
      stars.push(
        <span
          key={i}
          className={`star ${!readonly ? 'interactive' : ''}`}
          onMouseEnter={() => !readonly && setHoveredRating(i)}
          onMouseLeave={() => !readonly && setHoveredRating(0)}
          onClick={() => !readonly && onRate && onRate(i)}
          style={{
            position: 'relative',
            display: 'inline-block',
            width: starSize,
            height: starSize,
            cursor: readonly ? 'default' : 'pointer',
          }}
        >
          {/* Empty star */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0 }}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          
          {/* Filled star */}
          <svg
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0,
              clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`
            }}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill="#fbbf24"
            stroke="#fbbf24"
            strokeWidth="2"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
      );
    }
    return stars;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {renderStars()}
      </div>
      {totalRatings !== undefined && (
        <span style={{ fontSize: '14px', color: '#D6F4ED' }}>
          ({rating.toFixed(1)} - {totalRatings} értékelés)
        </span>
      )}
    </div>
  );
};
