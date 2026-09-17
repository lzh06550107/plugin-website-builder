export const WEBSITE_BUILDER_FLOW_GROUPS = ['content', 'layout', 'style', 'responsive'] as const;
export type WebsiteBuilderFlowGroup = (typeof WEBSITE_BUILDER_FLOW_GROUPS)[number];
