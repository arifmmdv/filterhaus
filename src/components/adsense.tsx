"use client";

import React from "react";

interface AdSenseProps {
  className?: string;
  slot?: string;
  format?: "auto" | "fluid" | "vertical" | "horizontal";
}

export default function AdSense({ className, slot, format = "auto" }: AdSenseProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // This is a placeholder for Google AdSense.
  // In a real scenario, you would include the AdSense script in your layout 
  // and use the ins tag here.
  
  return (
    <div 
      className={`bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden ${className}`}
      style={{ minWidth: '120px', minHeight: '120px' }}
    >
      <div className="text-[10px] text-white/20 uppercase tracking-widest text-center px-2">
        AdSense<br />
        {slot && <span className="text-[8px] opacity-50">{slot}</span>}
      </div>
      
      {/* 
        Actual AdSense implementation would look something like this:
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      */}
    </div>
  );
}
