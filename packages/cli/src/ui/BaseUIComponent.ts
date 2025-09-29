import * as blessed from 'blessed';
import { UIThemes, UILayouts } from './UIThemes';

/**
 * Base UI component class for common blessed element operations
 */
export abstract class BaseUIComponent {
  protected screen: blessed.Widgets.Screen;
  protected container: blessed.Widgets.BoxElement;

  constructor(screen: blessed.Widgets.Screen, title?: string) {
    this.screen = screen;
    this.container = this.createContainer();
    if (title) {
      this.screen.title = title;
    }
  }

  protected createContainer(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      ...UIThemes.default.container
    });
  }

  protected createHeader(content: string, layout = UILayouts.fullWidth.header): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.container,
      ...layout,
      content,
      tags: true,
      ...UIThemes.default.header
    });
  }

  protected createInfoBox(
    label: string,
    content: string,
    layout: any,
    borderColor: string = UIThemes.colors.primary
  ): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.container,
      ...layout,
      label: ` ${label} `,
      content,
      tags: true,
      ...UIThemes.default.infoBox,
      border: {
        ...UIThemes.default.infoBox.border,
        fg: borderColor as any
      }
    });
  }

  protected createScrollableBox(
    label: string,
    content: string,
    layout: any,
    borderColor: string = UIThemes.colors.accent
  ): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.container,
      ...layout,
      label: ` ${label} `,
      content,
      tags: true,
      scrollable: true,
      mouse: true,
      ...UIThemes.default.infoBox,
      border: {
        ...UIThemes.default.infoBox.border,
        fg: borderColor as any
      }
    });
  }

  protected createFooter(content: string, layout = UILayouts.fullWidth.footer): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.container,
      ...layout,
      content,
      ...UIThemes.default.footer
    });
  }

  protected setupExitEvents(additionalKeys: string[] = []): void {
    const exitKeys = ['escape', 'q', 'C-c', ...additionalKeys];
    this.screen.key(exitKeys, () => {
      this.exit();
    });
  }

  protected setupNavigationEvents(): void {
    this.screen.key(['tab'], () => {
      this.screen.render();
    });
  }

  protected exit(): void {
    this.screen.destroy();
  }

  public render(): void {
    this.screen.append(this.container);
    this.screen.render();
  }

  public destroy(): void {
    this.screen.destroy();
  }
}