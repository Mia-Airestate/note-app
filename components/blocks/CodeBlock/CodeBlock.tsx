import { BlockComponentProps } from '../registry';
import './CodeBlock.css';

export function CodeBlock({ block }: BlockComponentProps) {
  const language = block.props?.language || '';

  return (
    <div className="block-code">
      {language && (
        <div className="block-code-language">{language}</div>
      )}
      <pre className="block-code-content">
        <code>{block.content || '// Code block'}</code>
      </pre>
    </div>
  );
}

