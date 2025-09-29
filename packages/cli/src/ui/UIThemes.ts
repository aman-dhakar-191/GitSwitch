import * as blessed from 'blessed';

/**
 * Common UI themes for blessed components
 */
export const UIThemes = {
  default: {
    screen: {
      smartCSR: true,
      dockBorders: true,
    },
    container: {
      style: { bg: 'black' }
    },
    header: {
      style: { fg: 'white', bg: 'gray', bold: true },
      align: 'center' as const,
      valign: 'middle' as const
    },
    infoBox: {
      style: { fg: 'white', bg: 'black' },
      border: { type: 'line' as const },
      padding: { top: 1, left: 2, right: 2, bottom: 1 }
    },
    footer: {
      style: { fg: 'black', bg: 'white' },
      align: 'center' as const,
      valign: 'middle' as const
    }
  },
  
  colors: {
    primary: 'green',
    secondary: 'yellow',
    accent: 'magenta',
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  }
} as const;

/**
 * Standard layout configurations
 */
export const UILayouts = {
  twoColumn: {
    left: { top: 16, left: 0, width: '50%', height: 10 },
    right: { top: 16, left: '50%', width: '50%', height: 10 }
  },
  
  centered: {
    main: { top: 4, left: '10%', width: '80%', height: 15 }
  },
  
  fullWidth: {
    header: { top: 0, left: 0, width: '100%', height: 15 },
    content: { top: 16, left: 0, width: '100%', height: 12 },
    footer: { bottom: 0, left: 0, width: '100%', height: 3 }
  }
} as const;