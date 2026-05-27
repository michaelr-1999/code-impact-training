import ReactMarkdown from "react-markdown";

interface Props {
  summary: string;
}

export function AISummaryCard({ summary }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your day ahead</h2>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-base font-bold text-gray-900 dark:text-white mb-2 mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 mt-2">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 pl-4 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 pl-4 space-y-0.5 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-gray-700 dark:text-gray-300 list-disc">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
        }}
      >
        {summary}
      </ReactMarkdown>
    </div>
  );
}
