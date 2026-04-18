export const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-2xl font-bold text-primary mt-4 mb-3 pb-2 border-b border-border">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-bold text-primary mt-6 mb-3 pb-2 border-b border-border">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-semibold text-primary/80 mt-5 mb-2">{children}</h3>,
  p: ({ children }: any) => <p className="text-foreground leading-relaxed mb-4 text-base">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-foreground ml-4 mb-2 text-base">{children}</li>,
  strong: ({ children }: any) => <strong className="font-bold text-foreground bg-primary/10 px-1 rounded">{children}</strong>,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground">{children}</blockquote>,
  code: ({ children }: any) => <code className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
  hr: () => <hr className="my-6 border-border" />,
};
