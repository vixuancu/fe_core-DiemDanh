import * as React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from './utils';

type SelectOptionElement = React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>;

function toOptionElements(children: React.ReactNode): SelectOptionElement[] {
  const result: SelectOptionElement[] = [];

  const walk = (nodes: React.ReactNode): void => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;

      // Flatten fragments and keep traversing their children.
      if (child.type === React.Fragment) {
        walk(child.props.children);
        return;
      }

      if (typeof child.type === 'string' && child.type.toLowerCase() === 'option') {
        result.push(child as SelectOptionElement);
      }
    });
  };

  walk(children);
  return result;
}

function getText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getText).join('');
  if (React.isValidElement(node)) return getText(node.props.children);
  return '';
}

function formatDateDisplay(value?: string | number | readonly string[]): string {
  if (typeof value !== 'string' || !value) return 'mm/dd/yyyy';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${month}/${day}/${year}`;
}

interface PortableSelectProps {
  className?: string;
  children?: React.ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  labelClassName?: string;
  iconClassName?: string;
}

export function PortableSelect({
  className,
  children,
  value,
  defaultValue,
  labelClassName,
  iconClassName,
  ...props
}: PortableSelectProps) {
  const options = toOptionElements(children);
  const selectedValue = value !== undefined ? String(value) : String(defaultValue ?? '');

  const selectedLabel = React.useMemo(() => {
    const byValue = options.find(opt => String(opt.props.value ?? '') === selectedValue);
    if (byValue) return getText(byValue.props.children);

    if (options.length > 0) {
      const hasExplicitDefault = options.find(opt => opt.props.defaultValue);
      if (hasExplicitDefault) return getText(hasExplicitDefault.props.children);
      return getText(options[0].props.children);
    }

    return '';
  }, [options, selectedValue]);

  return (
    <div className="relative group">
      <select
        value={value}
        defaultValue={defaultValue}
        className={cn('figma-portable-select text-transparent focus:text-foreground', className)}
        {...props}
      >
        {children}
      </select>
      <span
        className={cn(
          'pointer-events-none absolute left-3 right-10 top-1/2 -translate-y-1/2 truncate text-sm leading-5 text-foreground group-focus-within:hidden',
          labelClassName,
        )}
      >
        {selectedLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <ChevronDown className={cn('h-4 w-4', iconClassName)} />
      </span>
    </div>
  );
}

interface PortableDateInputProps {
  className?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
  labelClassName?: string;
  iconClassName?: string;
}

export function PortableDateInput({
  className,
  value,
  placeholder = 'mm/dd/yyyy',
  labelClassName,
  iconClassName,
  ...props
}: PortableDateInputProps) {
  const displayText = formatDateDisplay(value) || placeholder;
  const isEmpty = !value;

  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        className={cn('figma-portable-date text-transparent', className)}
        {...props}
      />
      <span
        className={cn(
          'pointer-events-none absolute left-3 right-10 top-1/2 -translate-y-1/2 truncate text-sm leading-5',
          isEmpty ? 'text-muted-foreground' : 'text-foreground',
          labelClassName,
        )}
      >
        {displayText}
      </span>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Calendar className={cn('h-4 w-4', iconClassName)} />
      </span>
    </div>
  );
}
