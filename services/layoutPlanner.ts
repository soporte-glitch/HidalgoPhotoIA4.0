export interface LayoutItem {
  id: string;
  type: 'round-table' | 'rect-table' | 'dance-floor' | 'stage';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Layout = LayoutItem[];

const ITEM_DIMS = {
  'round-table': { width: 48, height: 48 }, // 1.8m diameter @ 24px/m scale
  'rect-table': { width: 24, height: 72 },  // 1x3m
  'dance-floor': { width: 120, height: 120 }, // 5x5m
  'stage': { width: 144, height: 72 }, // 6x3m
};
const PADDING = 36; // 1.5m padding between items

/**
 * Generates two distinct layouts for a salon given its dimensions.
 * @param salonWidth - The width of the salon in pixels.
 * @param salonHeight - The height of the salon in pixels.
 * @returns An array containing two different layout proposals.
 */
export const planLayout = (salonWidth: number, salonHeight: number): [Layout, Layout] => {
  
  // --- Layout 1: Grid Layout ---
  const layout1: Layout = [];
  const danceFloor1: LayoutItem = {
    id: `df-${Date.now()}`,
    type: 'dance-floor',
    ...ITEM_DIMS['dance-floor'],
    x: (salonWidth - ITEM_DIMS['dance-floor'].width) / 2,
    y: salonHeight - ITEM_DIMS['dance-floor'].height - PADDING,
  };
  layout1.push(danceFloor1);
  
  let currentY1 = PADDING;
  let tableCount1 = 0;
  while (currentY1 + ITEM_DIMS['round-table'].height < danceFloor1.y - PADDING) {
    let currentX1 = PADDING;
    while (currentX1 + ITEM_DIMS['round-table'].width < salonWidth - PADDING) {
      layout1.push({
        id: `rt-${tableCount1++}-${Date.now()}`,
        type: 'round-table',
        ...ITEM_DIMS['round-table'],
        x: currentX1,
        y: currentY1,
      });
      currentX1 += ITEM_DIMS['round-table'].width + PADDING;
    }
    currentY1 += ITEM_DIMS['round-table'].height + PADDING;
  }

  // --- Layout 2: Perimeter Layout ---
  const layout2: Layout = [];
  const stage2: LayoutItem = {
    id: `st-${Date.now()}`,
    type: 'stage',
    ...ITEM_DIMS['stage'],
    x: (salonWidth - ITEM_DIMS['stage'].width) / 2,
    y: PADDING,
  };
  layout2.push(stage2);
  
  const danceFloor2: LayoutItem = {
    id: `df-${Date.now()}`,
    type: 'dance-floor',
    ...ITEM_DIMS['dance-floor'],
    x: (salonWidth - ITEM_DIMS['dance-floor'].width) / 2,
    y: stage2.y + stage2.height + PADDING,
  };
  layout2.push(danceFloor2);
  
  let tableCount2 = 0;
  // Top row
  let currentX2 = PADDING;
  while (currentX2 + ITEM_DIMS['rect-table'].width < salonWidth - PADDING) {
    if (currentX2 < stage2.x - PADDING || currentX2 > stage2.x + stage2.width + PADDING) {
       layout2.push({
        id: `rt-${tableCount2++}-${Date.now()}`,
        type: 'round-table',
        ...ITEM_DIMS['round-table'],
        x: currentX2,
        y: stage2.y + (ITEM_DIMS['stage'].height - ITEM_DIMS['round-table'].height) / 2
       });
    }
    currentX2 += ITEM_DIMS['round-table'].width + PADDING;
  }
  
  // Bottom row
  currentX2 = PADDING;
  while(currentX2 + ITEM_DIMS['round-table'].width < salonWidth - PADDING) {
      layout2.push({
        id: `rt-${tableCount2++}-${Date.now()}`,
        type: 'round-table',
        ...ITEM_DIMS['round-table'],
        x: currentX2,
        y: salonHeight - ITEM_DIMS['round-table'].height - PADDING,
      });
      currentX2 += ITEM_DIMS['round-table'].width + PADDING;
  }
  
  // Left and Right columns
  let currentY2 = danceFloor2.y;
  while(currentY2 + ITEM_DIMS['round-table'].height < salonHeight - PADDING - ITEM_DIMS['round-table'].height) {
     layout2.push({
        id: `rt-${tableCount2++}-${Date.now()}`,
        type: 'round-table',
        ...ITEM_DIMS['round-table'],
        x: PADDING,
        y: currentY2,
     });
     layout2.push({
        id: `rt-${tableCount2++}-${Date.now()}`,
        type: 'round-table',
        ...ITEM_DIMS['round-table'],
        x: salonWidth - ITEM_DIMS['round-table'].width - PADDING,
        y: currentY2,
     });
     currentY2 += ITEM_DIMS['round-table'].height + PADDING;
  }

  return [layout1, layout2];
};