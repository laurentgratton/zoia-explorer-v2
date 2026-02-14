import React, { memo } from 'react';

const GridBorderNode = () => {
  return (
    <div 
      className="border-2 -top-2 -left-2 border-yellow-500/30 rounded pointer-events-none box-border"
      style={{ 
        width: 554, // 8 * 68 + 10
        height: 350, // 5 * 68 + 10
        marginTop: -10,
        marginLeft: -10
      }}
    >
        <div className="absolute -top-2 -left-2 text-xs text-yellow-500/50 font-mono"></div>
    </div>
  );
};

export default memo(GridBorderNode);
