import { FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import type { WebsiteDevice, WebsiteNode, WebsiteNodeType } from '../../shared/schema';
import { WebsiteRenderer } from '../renderer/WebsiteRenderer';

export class WebsiteNodeModel extends FlowModel {
  static websiteNodeType: WebsiteNodeType = 'wb.page';

  render() {
    const node = this.props?.node as WebsiteNode | undefined;
    const device = (this.props?.device as WebsiteDevice | undefined) || 'desktop';

    if (!node) {
      return React.createElement('div', { 'data-wb-flow-model': this.constructor.name });
    }

    return React.createElement(WebsiteRenderer, {
      schema: { version: 1, root: node },
      device,
    });
  }
}
