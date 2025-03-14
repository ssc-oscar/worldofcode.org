import * as React from 'react';
import { composeEventHandlers } from '@radix-ui/primitive';
import { composeRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type InputBaseContextProps = Pick<
  InputBaseProps,
  'autoFocus' | 'disabled'
> & {
  controlRef: React.RefObject<HTMLElement>;
  onFocusedChange: (focused: boolean) => void;
};

const InputBaseContext = React.createContext<InputBaseContextProps>({
  autoFocus: false,
  controlRef: { current: null },
  disabled: false,
  onFocusedChange: () => {}
});

const useInputBaseContext = () => React.useContext(InputBaseContext);

export interface InputBaseProps
  extends React.ComponentPropsWithoutRef<typeof Primitive.div> {
  autoFocus?: boolean;
  disabled?: boolean;
}

export const InputBase = React.forwardRef<
  React.ElementRef<typeof Primitive.div>,
  InputBaseProps
>(({ autoFocus, disabled, className, onClick, ...props }, ref) => {
  const [focused, setFocused] = React.useState(false);

  const controlRef = React.useRef<HTMLElement>(null);

  return (
    <InputBaseContext.Provider
      value={{
        autoFocus,
        controlRef,
        disabled,
        onFocusedChange: setFocused
      }}
    >
      <Primitive.div
        ref={ref}
        onClick={composeEventHandlers(onClick, (event) => {
          // Based on MUI's <InputBase /> implementation.
          // https://github.com/mui/material-ui/blob/master/packages/mui-material/src/InputBase/InputBase.js#L458~L460
          if (controlRef.current && event.currentTarget === event.target) {
            controlRef.current.focus();
          }
        })}
        className={cn(
          'border-input flex min-h-9 cursor-text items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          focused && 'ring-ring ring-1',
          className
        )}
        {...props}
      />
    </InputBaseContext.Provider>
  );
});
InputBase.displayName = 'InputBase';

export const InputBaseFlexWrapper = React.forwardRef<
  React.ElementRef<typeof Primitive.div>,
  React.ComponentPropsWithoutRef<typeof Primitive.div>
>(({ className, ...props }, ref) => (
  <Primitive.div
    ref={ref}
    className={cn(className, 'flex flex-1 flex-col flex-wrap items-baseline')}
    {...props}
  />
));
InputBaseFlexWrapper.displayName = 'InputBaseFlexWrapper';

export const InputBaseControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ onFocus, onBlur, ...props }, ref) => {
  const { controlRef, autoFocus, disabled, onFocusedChange } =
    useInputBaseContext();

  return (
    <Slot
      ref={composeRefs(controlRef, ref)}
      autoFocus={autoFocus}
      onFocus={composeEventHandlers(onFocus, () => onFocusedChange(true))}
      onBlur={composeEventHandlers(onBlur, () => onFocusedChange(false))}
      {...{ disabled }}
      {...props}
    />
  );
});
InputBaseControl.displayName = 'InputBaseControl';

export interface InputBaseAdornmentProps
  extends React.ComponentPropsWithoutRef<'div'> {
  asChild?: boolean;
  disablePointerEvents?: boolean;
}

export const InputBaseAdornment = React.forwardRef<
  React.ElementRef<'div'>,
  InputBaseAdornmentProps
>(({ className, disablePointerEvents, asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : typeof children === 'string' ? 'p' : 'div';

  const isAction =
    React.isValidElement(children) &&
    children.type === InputBaseAdornmentButton;

  return (
    <Comp
      ref={ref}
      className={cn(
        'text-muted-foreground flex items-center [&_svg]:size-4',
        (!isAction || disablePointerEvents) && 'pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});
InputBaseAdornment.displayName = 'InputBaseAdornment';

export const InputBaseAdornmentButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(
  (
    {
      type = 'button',
      variant = 'ghost',
      size = 'icon',
      disabled: disabledProp,
      className,
      ...props
    },
    ref
  ) => {
    const { disabled } = useInputBaseContext();

    return (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        size={size}
        disabled={disabled || disabledProp}
        className={cn('size-6', className)}
        {...props}
      />
    );
  }
);
InputBaseAdornmentButton.displayName = 'InputBaseAdornmentButton';

export const InputBaseInput = React.forwardRef<
  React.ElementRef<typeof Primitive.input>,
  React.ComponentPropsWithoutRef<typeof Primitive.input>
>(({ className, ...props }, ref) => (
  <Primitive.input
    ref={ref}
    className={cn(
      'placeholder:text-muted-foreground w-full flex-1 bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none disabled:pointer-events-none',
      className
    )}
    {...props}
  />
));
InputBaseInput.displayName = 'InputBaseInput';
