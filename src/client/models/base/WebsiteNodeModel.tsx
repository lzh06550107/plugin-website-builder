import React from 'react';
import { FlowModel } from '@nocobase/flow-engine';

/**
 * FlowEngine adapter for Website Builder nodes.
 * Website Schema remains the source of truth; this model only exposes
 * Website Builder component types to NocoBase FlowEngine.
 */
export class WebsiteNodeModel extends FlowModel {
  render() {
    return <div data-wb-flow-model={this.constructor.name} />;
  }
}
