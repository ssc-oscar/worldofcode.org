import * as React from 'react';
import { composeRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import { experimental_VGrid as VGrid, Virtualizer, VList } from 'virtua';

const VirtualizedContext = React.createContext<{
  scrollRef: React.RefObject<React.ElementRef<typeof Primitive.div>>;
  withScrollRef: boolean;
}>({
  scrollRef: {
    current: null
  },
  withScrollRef: false
});

function useVirtualized() {
  const context = React.useContext(VirtualizedContext);

  if (!context) {
    throw new Error('useVirtualized must be used within a <Virtualized />');
  }

  return context;
}

const Virtualized = React.forwardRef<
  React.ElementRef<typeof Primitive.div>,
  React.ComponentPropsWithoutRef<typeof Primitive.div>
>((props, ref) => {
  const scrollRef = React.useRef<React.ElementRef<typeof Primitive.div>>(null);

  return (
    <VirtualizedContext.Provider value={{ scrollRef, withScrollRef: true }}>
      <Primitive.div ref={composeRefs(scrollRef, ref)} {...props} />
    </VirtualizedContext.Provider>
  );
});
Virtualized.displayName = 'Virtualized';

export interface VirtualizedListProps
  extends Omit<React.ComponentPropsWithoutRef<typeof VList>, 'horizontal'> {
  orientation?: 'vertical' | 'horizontal';
}

const VirtualizedList = React.forwardRef<
  React.ElementRef<typeof VList>,
  VirtualizedListProps
>(({ orientation = 'vertical', ...props }, ref) => {
  const { withScrollRef } = useVirtualized();

  if (withScrollRef) {
    throw new Error(
      '<VirtualizedList /> must not be used within a <Virtualized />'
    );
  }

  return (
    <VList ref={ref} horizontal={orientation === 'horizontal'} {...props} />
  );
});
VirtualizedList.displayName = 'VirtualizedList';

const VirtualizedGrid = VGrid;

const VirtualizedVirtualizer = React.forwardRef<
  React.ElementRef<typeof Virtualizer>,
  Omit<React.ComponentPropsWithoutRef<typeof Virtualizer>, 'scrollRef'>
>((props, ref) => {
  const { scrollRef, withScrollRef } = useVirtualized();

  return (
    <Virtualizer
      ref={ref}
      scrollRef={withScrollRef ? scrollRef : undefined}
      {...props}
    />
  );
});
VirtualizedVirtualizer.displayName = 'VirtualizedVirtualizer';

export {
  Virtualized,
  VirtualizedList,
  VirtualizedGrid,
  VirtualizedVirtualizer
};
