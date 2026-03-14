import React from 'react';

const TerrainIcon = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  opacity = 1,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity }}
    >
      <path d="m8 10l-5 8h10zm2.529.754L13.5 6L21 18h-5.943z"/>
    </svg>
  );
};

export default TerrainIcon;
