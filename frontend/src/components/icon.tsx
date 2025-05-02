import { cn } from '@/lib/utils';

/**
 * The icon component.
 * icon: string - can be one of the following:
 * - unocss icon class name (starts with 'i-')
 * - src of an image (has '.' in the string)
 * - emoji character
 * className: string - additional class name
 */
export default function Icon({
  ...props
}: {
  icon: string;
  className: string;
}) {
  if (props.icon.startsWith('i-')) {
    // unocss icon
    return <div className={cn(props.className, props.icon)} />;
  } else if (props.icon.split('.').length > 1) {
    // image
    return <img src={props.icon} className={props.className} />;
  } else {
    // emoji
    return <div className={props.className}> {props.icon} </div>;
  }
}
