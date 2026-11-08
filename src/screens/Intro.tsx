import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { C } from '../theme';

/** "Ta-dum" style intro: J glows, punches into the camera, red light streaks burst, fade out. ~2.8s. */
export function Intro({ onDone }: { onDone: () => void }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 2600, easing: Easing.bezier(0.2, 0.7, 0.2, 1), useNativeDriver: true }).start(() => onDone());
    // safety net: some browsers/TVs throttle animation frames and never fire the completion callback
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [t, onDone]);

  const scale = t.interpolate({ inputRange: [0, 0.18, 0.55, 1], outputRange: [0.6, 1, 1.05, 9] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.9, 1], outputRange: [0, 1, 1, 0] });
  const streak = t.interpolate({ inputRange: [0, 0.5, 0.75, 1], outputRange: [0, 0, 1, 1.4] });
  const streakOpacity = t.interpolate({ inputRange: [0, 0.5, 0.62, 0.95, 1], outputRange: [0, 0, 1, 1, 0] });

  return (
    <View style={s.root} pointerEvents="none">
      <Animated.View style={[s.streaks, { opacity: streakOpacity, transform: [{ scaleX: Animated.add(1, Animated.multiply(streak, 3)) }] }]}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Animated.View
            key={i}
            style={[s.streak, { backgroundColor: i % 2 ? C.redDark : C.red, transform: [{ scaleY: streak }], opacity: 0.6 + (i % 3) * 0.15 }]}
          />
        ))}
      </Animated.View>
      <Animated.Image source={require('../../assets/j-mark.png')} style={[s.j, { opacity, transform: [{ scale }] }]} resizeMode="contain" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  j: { width: 155, height: 220 },
  streaks: { position: 'absolute', width: 260, height: 300, flexDirection: 'row', justifyContent: 'space-between' },
  streak: { width: 12, height: '100%' },
});
