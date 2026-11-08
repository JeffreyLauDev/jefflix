import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  focusStyle?: StyleProp<ViewStyle>;
  onFocusChange?: (f: boolean) => void;
  autoFocus?: boolean;
};

/**
 * A Pressable that works with touch, mouse and TV remotes.
 * On web/webOS the browser's own focus moves with arrow keys via SpatialNav (see useSpatialNav),
 * on Android TV / tvOS RN's native focus engine does it.
 */
export function Focusable({ style, focusStyle, onFocusChange, autoFocus, children, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<any>(null);
  // RN-web ignores autoFocus on Pressable, so focus the DOM node ourselves (TV remote needs a starting point).
  useEffect(() => {
    // touch screens don't need a starting focus (it would just draw a stray white ring)
    const touch = Platform.OS === 'web' && globalThis.matchMedia?.('(pointer: coarse)').matches;
    if (autoFocus && Platform.OS === 'web' && !touch) ref.current?.focus?.({ preventScroll: true });
  }, [autoFocus]);
  const set = (f: boolean) => {
    setFocused(f);
    onFocusChange?.(f);
  };
  return (
    <Pressable
      {...rest}
      ref={ref}
      {...({ hasTVPreferredFocus: autoFocus, autoFocus, tabIndex: 0, dataSet: { ...(rest as any).dataSet, focusable: '1' } } as object)}
      onFocus={() => set(true)}
      onBlur={() => set(false)}
      onHoverIn={() => set(true)}
      onHoverOut={() => set(false)}
      style={[style, focused && focusStyle]}
    >
      {children}
    </Pressable>
  );
}
