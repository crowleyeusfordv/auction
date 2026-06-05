import { Box, Overlay, Paper, Transition } from '@mantine/core';
import type { MantineTransition } from '@mantine/core';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  overlayOpacity?: number;
  position?: 'bottom' | 'center';
  transition?: MantineTransition;
  children: React.ReactNode;
}

export function Sheet({
  isOpen,
  onClose,
  overlayOpacity = 0.4,
  position = 'bottom',
  transition,
  children,
}: SheetProps) {
  const resolvedTransition: MantineTransition = transition ?? 'slide-up';

  return (
    <>
      <Transition mounted={isOpen} transition="fade" duration={300} timingFunction="ease">
        {(styles) => (
          <Overlay style={styles} color="#000" backgroundOpacity={overlayOpacity} zIndex={3} onClick={onClose} fixed />
        )}
      </Transition>

      <Transition mounted={isOpen} transition={resolvedTransition} duration={300} timingFunction="ease">
        {(styles) =>
          position === 'bottom' ? (
            <Box pos="fixed" bottom={0} left={0} w="100%" style={{ ...styles, zIndex: 5 }}>
              <Paper pos="relative" w="100%" mx="auto" bg="gray.1" p="md" style={{ borderRadius: '24px 24px 0 0' }}>
                {children}
              </Paper>
            </Box>
          ) : (
            <Box
              pos="fixed"
              top={0}
              left={0}
              w="100%"
              h="100%"
              display="flex"
              style={{ ...styles, zIndex: 5, alignItems: 'center', justifyContent: 'center' }}
            >
              <Paper pos="relative" w="90%" maw={420} mx="auto" bg="gray.1" p="md" style={{ borderRadius: '24px' }}>
                {children}
              </Paper>
            </Box>
          )
        }
      </Transition>
    </>
  );
}
