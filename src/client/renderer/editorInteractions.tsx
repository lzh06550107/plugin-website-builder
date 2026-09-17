import React from 'react';

export interface WebsiteEditorInteractions {
  onInlineTextCommit?: (nodeId: string, text: string) => void;
  onInlineImageEditRequest?: (nodeId: string) => void;
}

const WebsiteEditorInteractionsContext = React.createContext<WebsiteEditorInteractions>({});

export interface WebsiteEditorInteractionsProviderProps extends WebsiteEditorInteractions {
  children: React.ReactNode;
}

export function WebsiteEditorInteractionsProvider({
  onInlineTextCommit,
  onInlineImageEditRequest,
  children,
}: WebsiteEditorInteractionsProviderProps) {
  const value = React.useMemo(
    () => ({ onInlineTextCommit, onInlineImageEditRequest }),
    [onInlineTextCommit, onInlineImageEditRequest],
  );
  return (
    <WebsiteEditorInteractionsContext.Provider value={value}>
      {children}
    </WebsiteEditorInteractionsContext.Provider>
  );
}

export function useWebsiteEditorInteractions() {
  return React.useContext(WebsiteEditorInteractionsContext);
}
