"use client";

import React from "react";

interface AdUnitProps {
  isActive?: boolean;
  location: string;
  size?: string;
  slotClass?: string;
  style?: React.CSSProperties;
}

export default function AdUnit({
  isActive = false,
  location,
  size = "728 × 90",
  slotClass = "ad-leaderboard",
  style,
}: AdUnitProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
        isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
      aria-hidden={!isActive}
    >
      <div className="overflow-hidden">
        <div className="ad-wrap" style={style}>
          <div className="ad-label">Advertisement</div>
          <div
            className={`ad-slot ${slotClass}`}
            data-ad-location={location}
            data-size={size}
            role="complementary"
            aria-label="Advertisement placement"
          >
            {/* Ad script injection point */}
          </div>
        </div>
      </div>
    </div>
  );
}
