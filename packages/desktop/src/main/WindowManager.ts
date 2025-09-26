import { BrowserWindow, screen, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
  displayId?: number;
}

export interface WindowManagerConfig {
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  preventMultipleInstances?: boolean;
  saveWindowState?: boolean;
  restoreWindowState?: boolean;
}

export class WindowManager {
  private static instance: WindowManager | null = null;
  private config: WindowManagerConfig;
  private windowStateFile: string;
  private windows: Map<string, BrowserWindow> = new Map();

  private constructor(config: WindowManagerConfig) {
    this.config = {
      minWidth: 600,
      minHeight: 400,
      preventMultipleInstances: true,
      saveWindowState: true,
      restoreWindowState: true,
      ...config
    };

    // Path to store window state
    const dataDir = path.join(os.homedir(), '.gitswitch');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.windowStateFile = path.join(dataDir, 'window-state.json');

    // Setup app-level event handlers for multiple instance prevention
    if (this.config.preventMultipleInstances) {
      this.setupInstancePrevention();
    }
  }

  public static getInstance(config?: WindowManagerConfig): WindowManager {
    if (!WindowManager.instance) {
      if (!config) {
        throw new Error('WindowManager must be initialized with config on first call');
      }
      WindowManager.instance = new WindowManager(config);
    }
    return WindowManager.instance;
  }

  /**
   * Create a new window or focus existing one
   */
  public createWindow(
    windowId: string,
    options: Electron.BrowserWindowConstructorOptions = {}
  ): BrowserWindow {
    // Check if window already exists
    if (this.windows.has(windowId)) {
      const existingWindow = this.windows.get(windowId)!;
      if (!existingWindow.isDestroyed()) {
        existingWindow.focus();
        return existingWindow;
      } else {
        // Clean up destroyed window
        this.windows.delete(windowId);
      }
    }

    // Get saved window state or use defaults
    const windowState = this.getWindowState(windowId);
    const displayBounds = this.getValidDisplay(windowState);

    // Merge options with window state and defaults
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: windowState.width,
      height: windowState.height,
      minWidth: this.config.minWidth,
      minHeight: this.config.minHeight,
      x: windowState.x,
      y: windowState.y,
      show: false,
      ...options
    };

    // Ensure window fits on screen
    if (windowOptions.x !== undefined && windowOptions.y !== undefined) {
      const { x, y } = this.ensureWindowOnScreen(
        windowOptions.x,
        windowOptions.y,
        windowOptions.width!,
        windowOptions.height!,
        displayBounds
      );
      windowOptions.x = x;
      windowOptions.y = y;
    }

    // Create the window
    const window = new BrowserWindow(windowOptions);

    // Restore window state
    if (windowState.isMaximized) {
      window.maximize();
    }
    if (windowState.isFullScreen) {
      window.setFullScreen(true);
    }

    // Setup window event handlers
    this.setupWindowEventHandlers(windowId, window);

    // Store window reference
    this.windows.set(windowId, window);

    return window;
  }

  /**
   * Get an existing window by ID
   */
  public getWindow(windowId: string): BrowserWindow | undefined {
    const window = this.windows.get(windowId);
    return window && !window.isDestroyed() ? window : undefined;
  }

  /**
   * Close a specific window
   */
  public closeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId);
    if (window && !window.isDestroyed()) {
      window.close();
      return true;
    }
    return false;
  }

  /**
   * Focus a specific window
   */
  public focusWindow(windowId: string): boolean {
    const window = this.windows.get(windowId);
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
      return true;
    }
    return false;
  }

  /**
   * Get all active windows
   */
  public getAllWindows(): Map<string, BrowserWindow> {
    // Clean up destroyed windows
    for (const [id, window] of this.windows.entries()) {
      if (window.isDestroyed()) {
        this.windows.delete(id);
      }
    }
    return new Map(this.windows);
  }

  /**
   * Check if any windows are open
   */
  public hasOpenWindows(): boolean {
    this.getAllWindows(); // Clean up first
    return this.windows.size > 0;
  }

  /**
   * Save window state to file
   */
  private saveWindowState(windowId: string, window: BrowserWindow): void {
    if (!this.config.saveWindowState) return;

    try {
      const bounds = window.getBounds();
      const isMaximized = window.isMaximized();
      const isFullScreen = window.isFullScreen();

      const windowState: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized,
        isFullScreen,
        displayId: screen.getDisplayMatching(bounds).id
      };

      // Load existing states or create new object
      let allStates: Record<string, WindowState> = {};
      if (fs.existsSync(this.windowStateFile)) {
        try {
          const data = fs.readFileSync(this.windowStateFile, 'utf8');
          allStates = JSON.parse(data);
        } catch (error) {
          console.warn('Failed to load existing window states:', error);
        }
      }

      // Update state for this window
      allStates[windowId] = windowState;

      // Save to file
      fs.writeFileSync(this.windowStateFile, JSON.stringify(allStates, null, 2));
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  }

  /**
   * Load window state from file
   */
  private getWindowState(windowId: string): WindowState {
    const defaultState: WindowState = {
      width: this.config.defaultWidth,
      height: this.config.defaultHeight,
      isMaximized: false,
      isFullScreen: false
    };

    if (!this.config.restoreWindowState) {
      return defaultState;
    }

    try {
      if (fs.existsSync(this.windowStateFile)) {
        const data = fs.readFileSync(this.windowStateFile, 'utf8');
        const allStates: Record<string, WindowState> = JSON.parse(data);
        
        if (allStates[windowId]) {
          return { ...defaultState, ...allStates[windowId] };
        }
      }
    } catch (error) {
      console.warn('Failed to load window state:', error);
    }

    return defaultState;
  }

  /**
   * Ensure window position is on a valid display
   */
  private getValidDisplay(windowState: WindowState): Electron.Rectangle {
    const displays = screen.getAllDisplays();
    
    // Try to find the display the window was on
    if (windowState.displayId) {
      const targetDisplay = displays.find(d => d.id === windowState.displayId);
      if (targetDisplay) {
        return targetDisplay.bounds;
      }
    }

    // Fall back to primary display
    return screen.getPrimaryDisplay().bounds;
  }

  /**
   * Ensure window is positioned on screen
   */
  private ensureWindowOnScreen(
    x: number,
    y: number,
    width: number,
    height: number,
    displayBounds: Electron.Rectangle
  ): { x: number; y: number } {
    // Ensure window is not completely off-screen
    const minVisiblePixels = 100;
    
    // Check horizontal position
    if (x + width < displayBounds.x + minVisiblePixels) {
      x = displayBounds.x;
    } else if (x > displayBounds.x + displayBounds.width - minVisiblePixels) {
      x = displayBounds.x + displayBounds.width - width;
    }

    // Check vertical position
    if (y + height < displayBounds.y + minVisiblePixels) {
      y = displayBounds.y;
    } else if (y > displayBounds.y + displayBounds.height - minVisiblePixels) {
      y = displayBounds.y + displayBounds.height - height;
    }

    return { x, y };
  }

  /**
   * Setup event handlers for a window
   */
  private setupWindowEventHandlers(windowId: string, window: BrowserWindow): void {
    // Save state when window is moved or resized
    const saveState = () => {
      if (!window.isDestroyed()) {
        this.saveWindowState(windowId, window);
      }
    };

    // Debounced save to avoid excessive file writes
    let saveTimeout: NodeJS.Timeout | null = null;
    const debouncedSave = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(saveState, 250);
    };

    window.on('resize', debouncedSave);
    window.on('move', debouncedSave);
    window.on('maximize', debouncedSave);
    window.on('unmaximize', debouncedSave);
    window.on('enter-full-screen', debouncedSave);
    window.on('leave-full-screen', debouncedSave);

    // Clean up on close
    window.on('closed', () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      this.windows.delete(windowId);
    });
  }

  /**
   * Setup single instance prevention
   */
  private setupInstancePrevention(): void {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      // Another instance is already running, quit this one
      console.log('Another instance of GitSwitch is already running');
      app.quit();
      return;
    }

    // Handle second instance - focus existing window
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      console.log('Second instance detected, focusing existing window');
      
      // Try to focus the main window
      const mainWindow = this.getWindow('main');
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.show();
      }

      // Handle command line arguments from second instance
      if (commandLine.length > 1) {
        const projectArg = commandLine.find(arg => arg.startsWith('--project'));
        if (projectArg && mainWindow) {
          const projectPath = projectArg.split('=')[1];
          if (projectPath) {
            // Send project path to renderer
            mainWindow.webContents.send('open-project-from-cli', { projectPath });
          }
        }
      }
    });
  }

  /**
   * Cleanup all windows and save states
   */
  public cleanup(): void {
    for (const [windowId, window] of this.windows.entries()) {
      if (!window.isDestroyed()) {
        this.saveWindowState(windowId, window);
        window.removeAllListeners();
      }
    }
    this.windows.clear();
  }
}