import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '支持 Markdown 格式...',
  readOnly = false,
  className = '',
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const togglePreview = () => setIsPreview(!isPreview);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  if (readOnly) {
    return (
      <div className={`markdown-preview prose prose-sm max-w-none ${className}`}>
        {value ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        ) : (
          <span className="text-gray-400">无内容</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`markdown-editor border rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''
      } ${className}`}
    >
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = value.substring(start, end);
              const beforeText = value.substring(0, start);
              const afterText = value.substring(end);
              onChange(beforeText + `**${selectedText}**` + afterText);
            }}
            className="px-2 py-1 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded"
            title="粗体"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = value.substring(start, end);
              const beforeText = value.substring(0, start);
              const afterText = value.substring(end);
              onChange(beforeText + `*${selectedText}*` + afterText);
            }}
            className="px-2 py-1 text-sm italic text-gray-600 hover:bg-gray-200 rounded"
            title="斜体"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = value.substring(start, end);
              const beforeText = value.substring(0, start);
              const afterText = value.substring(end);
              onChange(beforeText + '`' + selectedText + '`' + afterText);
            }}
            className="px-2 py-1 text-sm font-mono text-gray-600 hover:bg-gray-200 rounded"
            title="代码"
          >
            {'</>'}
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
              const start = textarea.selectionStart;
              const lines = value.split('\n');
              let charCount = 0;
              let lineIndex = 0;
              for (let i = 0; i < lines.length; i++) {
                if (charCount + lines[i].length >= start) {
                  lineIndex = i;
                  break;
                }
                charCount += lines[i].length + 1;
              }
              lines[lineIndex] = '- ' + lines[lineIndex];
              onChange(lines.join('\n'));
            }}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
            title="列表"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
              const start = textarea.selectionStart;
              const lines = value.split('\n');
              let charCount = 0;
              let lineIndex = 0;
              for (let i = 0; i < lines.length; i++) {
                if (charCount + lines[i].length >= start) {
                  lineIndex = i;
                  break;
                }
                charCount += lines[i].length + 1;
              }
              lines[lineIndex] = '1. ' + lines[lineIndex];
              onChange(lines.join('\n'));
            }}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
            title="有序列表"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
              const start = textarea.selectionStart;
              const lines = value.split('\n');
              let charCount = 0;
              let lineIndex = 0;
              for (let i = 0; i < lines.length; i++) {
                if (charCount + lines[i].length >= start) {
                  lineIndex = i;
                  break;
                }
                charCount += lines[i].length + 1;
              }
              lines[lineIndex] = '## ' + lines[lineIndex];
              onChange(lines.join('\n'));
            }}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
            title="标题"
          >
            H
          </button>
          <button
            type="button"
            onClick={() => {
              const link = prompt('输入链接地址:', 'https://');
              if (link) {
                const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = value.substring(start, end) || '链接文字';
                const beforeText = value.substring(0, start);
                const afterText = value.substring(end);
                onChange(beforeText + `[${selectedText}](${link})` + afterText);
              }
            }}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
            title="链接"
          >
            🔗
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={togglePreview}
            className={`px-3 py-1 text-sm rounded ${
              isPreview ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isPreview ? '编辑' : '预览'}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
            title="全屏"
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>
      </div>

      {/* 编辑/预览区域 */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-48px)]' : 'min-h-[200px]'}`}>
        {isPreview ? (
          <div className="p-4 prose prose-sm max-w-none markdown-preview">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <span className="text-gray-400">无内容</span>
            )}
          </div>
        ) : (
          <textarea
            className="markdown-textarea w-full h-full p-4 resize-none focus:outline-none"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );
}

// Markdown 渲染组件
export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  return (
    <div className="prose prose-sm max-w-none markdown-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}