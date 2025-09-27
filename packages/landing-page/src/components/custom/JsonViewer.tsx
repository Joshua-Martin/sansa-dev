import React, { useEffect, useRef } from 'react';

/**
 * Represents a 2D point in pixels.
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Simple JSON Viewer Component
 *
 * Displays JSON data with basic syntax highlighting similar to code editors.
 * Exposes measurement callbacks for specific fields to support diagram overlays.
 */
interface JsonViewerProps {
  /** JSON payload to render. */
  data: JsonValue;
  /** Optional header title. */
  title?: string;
  /** Optional price string displayed in the header, e.g. "$0.0045/call". */
  price?: string;
  /** Optional latency string displayed in the header, e.g. "500ms TTF". */
  latency?: string;
  /**
   * Callback invoked after layout that reports key measurement points.
   * All points are expressed relative to the JsonViewer container's top-left.
   */
  onMeasure?: (points: {
    /** Center bottom of the "message" key label (if present). */
    messageKeyCenterBottom?: Point;
    /** Center bottom of the "message" value (if present). */
    messageValueCenterBottom?: Point;
    /** Top center of the header price element (if present). */
    priceTopCenter?: Point;
    /** Bottom center of the header price element (if present). */
    priceBottomCenter?: Point;
    /** Right-edge center of the header latency element (if present). */
    latencyRightCenter?: Point;
    /** Absolute container rect (viewport coordinates). */
    containerRect: DOMRect;
  }) => void;

  // shoudl scale
  shouldScale?: boolean;
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

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title,
  price,
  latency,
  onMeasure,
  shouldScale = false,
}) => {
  // Root container used as coordinate origin for measurements
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Refs for target elements to measure
  const messageKeyRef = useRef<HTMLSpanElement | null>(null);
  const messageValueRef = useRef<HTMLSpanElement | null>(null);
  const priceRef = useRef<HTMLSpanElement | null>(null);
  const latencyRef = useRef<HTMLSpanElement | null>(null);

  /**
   * Compute a point relative to the container's coordinate system.
   */
  const computeRelativePoint = (
    el: HTMLElement | null,
    kind: 'centerBottom' | 'topCenter' | 'bottomCenter' | 'rightCenter'
  ) => {
    if (!el || !containerRef.current) return undefined;
    const cRect = containerRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (kind === 'centerBottom') {
      return { x: r.left - cRect.left + r.width / 2, y: r.bottom - cRect.top };
    }
    if (kind === 'topCenter') {
      return { x: r.left - cRect.left + r.width / 2, y: r.top - cRect.top };
    }
    if (kind === 'bottomCenter') {
      return { x: r.left - cRect.left + r.width / 2, y: r.bottom - cRect.top };
    }
    // rightCenter
    return { x: r.right - cRect.left, y: r.top - cRect.top + r.height / 2 };
  };

  // Report measurements after layout and whenever sizes may change
  useEffect(() => {
    if (!onMeasure) return;
    const measure = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      onMeasure({
        messageKeyCenterBottom: computeRelativePoint(
          messageKeyRef.current,
          'centerBottom'
        ),
        messageValueCenterBottom: computeRelativePoint(
          messageValueRef.current,
          'centerBottom'
        ),
        priceTopCenter: computeRelativePoint(priceRef.current, 'topCenter'),
        priceBottomCenter: computeRelativePoint(
          priceRef.current,
          'bottomCenter'
        ),
        latencyRightCenter: computeRelativePoint(
          latencyRef.current,
          'rightCenter'
        ),
        containerRect,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (messageKeyRef.current) ro.observe(messageKeyRef.current);
    if (messageValueRef.current) ro.observe(messageValueRef.current);
    if (priceRef.current) ro.observe(priceRef.current);
    if (latencyRef.current) ro.observe(latencyRef.current);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [onMeasure]);

  const formatJson = (
    obj: JsonValue,
    indent = 0,
    propertyName?: string,
    nodePath = 'root'
  ): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];
    const indentStr = '  '.repeat(indent);

    if (obj === null) {
      elements.push(
        <span key={`null-${nodePath}`} className="text-blue-400">
          null
        </span>
      );
    } else if (typeof obj === 'boolean') {
      elements.push(
        <span key={`bool-${nodePath}`} className="text-blue-400">
          {obj.toString()}
        </span>
      );
    } else if (typeof obj === 'number') {
      elements.push(
        <span key={`num-${nodePath}`} className="text-green-400">
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

        const children: React.ReactNode[] = [];
        children.push(
          <span key={`str-start-${nodePath}`} className="text-yellow-400">
            &quot;
          </span>
        );
        lines.forEach((line, index) => {
          if (index > 0) {
            children.push(<br key={`br-${nodePath}-${index}`} />);
            // Calculate proper indentation based on property name length
            let continuationIndent = indentStr + '  ';
            if (propertyName) {
              const propertyOverhead = propertyName.length + 3; // "property":
              continuationIndent += ' '.repeat(propertyOverhead);
            }
            children.push(
              <span
                key={`indent-${nodePath}-${index}`}
                className="text-gray-600"
              >
                {continuationIndent}
              </span>
            );
          }
          children.push(
            <span key={`line-${nodePath}-${index}`} className="text-yellow-400">
              {line}
            </span>
          );
        });
        children.push(
          <span key={`str-end-${nodePath}`} className="text-yellow-400">
            &quot;
          </span>
        );
        if (propertyName === 'message') {
          elements.push(
            <span key={`msg-val-wrap-${nodePath}`} data-json-value="message">
              {children}
            </span>
          );
        } else {
          elements.push(<span key={`str-wrap-${nodePath}`}>{children}</span>);
        }
      } else {
        const short = (
          <span key={`str-inner-${nodePath}`} className="text-yellow-400">
            &quot;{obj}&quot;
          </span>
        );
        if (propertyName === 'message') {
          elements.push(
            <span key={`msg-val-${nodePath}`} data-json-value="message">
              {short}
            </span>
          );
        } else {
          elements.push(short);
        }
      }
    } else if (Array.isArray(obj)) {
      elements.push(
        <span key={`array-start-${nodePath}`} className="text-gray-300">
          [
        </span>
      );
      if (obj.length > 0) {
        elements.push(<br key={`br-open-${nodePath}`} />);
        obj.forEach((item, index) => {
          elements.push(
            <span key={`indent-${nodePath}-${index}`} className="text-gray-600">
              {indentStr}{' '}
            </span>
          );
          const itemElements = formatJson(
            item,
            indent + 1,
            undefined,
            `${nodePath}[${index}]`
          );
          elements.push(...itemElements);
          if (index < obj.length - 1) {
            elements.push(
              <span
                key={`comma-${nodePath}-${index}`}
                className="text-gray-300"
              >
                ,
              </span>
            );
          }
          elements.push(<br key={`br-item-${nodePath}-${index}`} />);
        });
        elements.push(
          <span key={`indent-end-${nodePath}`} className="text-gray-600">
            {indentStr}
          </span>
        );
      }
      elements.push(
        <span key={`array-end-${nodePath}`} className="text-gray-300">
          ]
        </span>
      );
    } else if (typeof obj === 'object') {
      // At this point, obj is guaranteed to be a Record<string, JsonValue>
      const record = obj as Record<string, JsonValue>;
      elements.push(
        <span key={`obj-start-${nodePath}`} className="text-gray-300">
          {'{'}
        </span>
      );
      const keys = Object.keys(record);
      if (keys.length > 0) {
        elements.push(<br key={`br-open-${nodePath}`} />);
        keys.forEach((key, index) => {
          const isMessageProperty = key === 'message';

          if (isMessageProperty && shouldScale) {
            // For the message property when shouldScale is true, wrap the entire line
            const propertyElements: React.ReactElement[] = [];

            // Add indentation
            propertyElements.push(
              <span key={`indent-${nodePath}-${key}`} className="text-gray-600">
                {indentStr}{' '}
              </span>
            );

            // Add key
            propertyElements.push(
              <span
                key={`key-${nodePath}-${key}`}
                ref={messageKeyRef}
                data-json-key="message"
                className="text-purple-400"
              >
                &quot;{key}&quot;
              </span>
            );

            // Add colon
            propertyElements.push(
              <span key={`colon-${nodePath}-${key}`} className="text-gray-300">
                :{' '}
              </span>
            );

            // Add value elements - pass undefined for propertyName so message value doesn't get individual styling
            const valueElements = formatJson(
              record[key],
              indent + 1,
              undefined,
              `${nodePath}.${key}`
            );
            propertyElements.push(...valueElements);

            // Add comma if not last
            if (index < keys.length - 1) {
              propertyElements.push(
                <span
                  key={`comma-${nodePath}-${key}`}
                  className="text-gray-300"
                >
                  ,
                </span>
              );
            }

            // Wrap the entire property line and use this wrapper for messageValueRef instead
            elements.push(
              <span
                key={`message-property-${nodePath}-${key}`}
                ref={messageValueRef}
                data-json-value="message"
              >
                {propertyElements}
              </span>
            );
          } else {
            // Normal rendering for non-message properties or when shouldScale is false
            elements.push(
              <span key={`indent-${nodePath}-${key}`} className="text-gray-600">
                {indentStr}{' '}
              </span>
            );

            if (isMessageProperty) {
              elements.push(
                <span
                  key={`key-${nodePath}-${key}`}
                  ref={messageKeyRef}
                  data-json-key="message"
                  className="text-purple-400"
                >
                  &quot;{key}&quot;
                </span>
              );
            } else {
              elements.push(
                <span
                  key={`key-${nodePath}-${key}`}
                  className="text-purple-400"
                >
                  &quot;{key}&quot;
                </span>
              );
            }

            elements.push(
              <span key={`colon-${nodePath}-${key}`} className="text-gray-300">
                :{' '}
              </span>
            );

            const valueElements = formatJson(
              record[key],
              indent + 1,
              key,
              `${nodePath}.${key}`
            );
            elements.push(...valueElements);

            if (index < keys.length - 1) {
              elements.push(
                <span
                  key={`comma-${nodePath}-${key}`}
                  className="text-gray-300"
                >
                  ,
                </span>
              );
            }
          }

          elements.push(<br key={`br-prop-${nodePath}-${index}`} />);
        });
        elements.push(
          <span key={`indent-end-${nodePath}`} className="text-gray-600">
            {indentStr}
          </span>
        );
      }
      elements.push(
        <span key={`obj-end-${nodePath}`} className="text-gray-300">
          {'}'}
        </span>
      );
    }

    return elements;
  };

  return (
    <div
      ref={containerRef}
      className="bg-background rounded-lg border border-border overflow-visible"
    >
      {(title || price || latency) && (
        <div className="bg-muted px-3 py-2 border-b border-border flex items-center justify-between gap-3">
          {title && (
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
          )}
          <div
            className={`mr-4 flex items-center ${shouldScale ? 'gap-8' : 'gap-2'}`}
          >
            {price && (
              <span
                ref={priceRef}
                className={`text-xs text-foreground/80 bg-background border border-border rounded px-2 py-0.5 ${shouldScale ? 'shadow-lg border-primary' : ''}`}
                data-json-header="price"
                style={{ transform: shouldScale ? 'scale(1.2)' : 'scale(1)' }}
              >
                {price}
              </span>
            )}
            {latency && (
              <span
                ref={latencyRef}
                className={`text-xs text-foreground/80 bg-background border border-border rounded px-2 py-0.5 ${shouldScale ? 'shadow-lg border-primary' : ''}`}
                data-json-header="latency"
                style={{ transform: shouldScale ? 'scale(1.2)' : 'scale(1)' }}
              >
                {latency}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="p-4 overflow-visible">
        <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
          {formatJson(data, 0)}
        </pre>
      </div>
    </div>
  );
};

export default JsonViewer;
