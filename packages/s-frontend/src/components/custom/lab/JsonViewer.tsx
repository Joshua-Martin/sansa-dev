import React from 'react';

/**
 * Simple JSON Viewer Component
 *
 * Displays JSON data with basic syntax highlighting similar to code editors
 */
interface JsonViewerProps {
  data: JsonValue;
  title?: string;
}

/**
 * JSON value types that can be displayed
 */
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const JsonViewer: React.FC<JsonViewerProps> = ({ data, title }) => {
  const formatJson = (
    obj: JsonValue,
    indent = 0,
    propertyName?: string
  ): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];
    const indentStr = '  '.repeat(indent);

    if (obj === null) {
      elements.push(
        <span key="null" className="text-blue-400">
          null
        </span>
      );
    } else if (typeof obj === 'boolean') {
      elements.push(
        <span key="bool" className="text-blue-400">
          {obj.toString()}
        </span>
      );
    } else if (typeof obj === 'number') {
      elements.push(
        <span key="num" className="text-green-400">
          {obj}
        </span>
      );
    } else if (typeof obj === 'string') {
      // Handle long strings with proper indentation
      const maxLineLength = 60; // Maximum characters per line
      if (obj.length > maxLineLength) {
        const words = obj.split(' ');
        let currentLine = '';
        const lines: string[] = [];

        for (const word of words) {
          if ((currentLine + ' ' + word).length <= maxLineLength) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);

        elements.push(
          <span key="str-start" className="text-yellow-400">
            &quot;
          </span>
        );
        lines.forEach((line, index) => {
          if (index > 0) {
            elements.push(<br key={`br-${index}`} />);
            // Calculate proper indentation based on property name length
            let continuationIndent = indentStr + '  '; // Base indentation + 2 spaces
            if (propertyName) {
              // Add spaces for: quotes around property name + ': ' + opening quote
              const propertyOverhead = propertyName.length + 3; // "property":
              continuationIndent += ' '.repeat(propertyOverhead);
            }
            elements.push(
              <span key={`indent-${index}`} className="text-gray-600">
                {continuationIndent}
              </span>
            );
          }
          elements.push(
            <span key={`line-${index}`} className="text-yellow-400">
              {line}
            </span>
          );
        });
        elements.push(
          <span key="str-end" className="text-yellow-400">
            &quot;
          </span>
        );
      } else {
        elements.push(
          <span key="str" className="text-yellow-400">
            &quot;{obj}&quot;
          </span>
        );
      }
    } else if (Array.isArray(obj)) {
      elements.push(
        <span key="array-start" className="text-gray-300">
          [
        </span>
      );
      if (obj.length > 0) {
        elements.push(<br />);
        obj.forEach((item, index) => {
          elements.push(
            <span key={`indent-${index}`} className="text-gray-600">
              {indentStr}{' '}
            </span>
          );
          const itemElements = formatJson(item, indent + 1);
          elements.push(...itemElements);
          if (index < obj.length - 1) {
            elements.push(
              <span key={`comma-${index}`} className="text-gray-300">
                ,
              </span>
            );
          }
          elements.push(<br />);
        });
        elements.push(
          <span key="indent-end" className="text-gray-600">
            {indentStr}
          </span>
        );
      }
      elements.push(
        <span key="array-end" className="text-gray-300">
          ]
        </span>
      );
    } else if (typeof obj === 'object') {
      // At this point, obj is guaranteed to be a Record<string, JsonValue>
      const record = obj as Record<string, JsonValue>;
      elements.push(
        <span key="obj-start" className="text-gray-300">
          {'{'}
        </span>
      );
      const keys = Object.keys(record);
      if (keys.length > 0) {
        elements.push(<br />);
        keys.forEach((key, index) => {
          elements.push(
            <span key={`indent-${key}`} className="text-gray-600">
              {indentStr}{' '}
            </span>
          );
          elements.push(
            <span key={`key-${key}`} className="text-purple-400">
              &quot;{key}&quot;
            </span>
          );
          elements.push(
            <span key={`colon-${key}`} className="text-gray-300">
              :{' '}
            </span>
          );
          const valueElements = formatJson(record[key], indent + 1, key);
          elements.push(...valueElements);
          if (index < keys.length - 1) {
            elements.push(
              <span key={`comma-${key}`} className="text-gray-300">
                ,
              </span>
            );
          }
          elements.push(<br />);
        });
        elements.push(
          <span key="indent-end" className="text-gray-600">
            {indentStr}
          </span>
        );
      }
      elements.push(
        <span key="obj-end" className="text-gray-300">
          {'}'}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      {title && (
        <div className="bg-muted px-3 py-2 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
          {formatJson(data, 0)}
        </pre>
      </div>
    </div>
  );
};

export default JsonViewer;
