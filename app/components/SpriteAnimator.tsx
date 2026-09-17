import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface SpriteAnimatorProps {
  source: any;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  fps?: number;
  displaySize?: number;
  direction?: 'horizontal' | 'vertical';
  frameSequence?: number[];
}

export default function SpriteAnimator({
  source,
  frameCount,
  frameWidth,
  frameHeight,
  fps = 4,
  displaySize = 128,
  direction = 'horizontal',
  frameSequence,
}: SpriteAnimatorProps) {
  const [step, setStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sequence = frameSequence || Array.from({ length: frameCount }, (_, i) => i);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStep(prev => (prev + 1) % sequence.length);
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sequence.length, fps]);

  const currentFrame = sequence[step];
  const isHorizontal = direction === 'horizontal';
  const sheetWidth = isHorizontal ? frameWidth * frameCount : frameWidth;
  const sheetHeight = isHorizontal ? frameHeight : frameHeight * frameCount;

  const scaleX = displaySize / frameWidth;
  const scaleY = displaySize / frameHeight;

  const offsetX = isHorizontal ? -currentFrame * frameWidth * scaleX : 0;
  const offsetY = isHorizontal ? 0 : -currentFrame * frameHeight * scaleY;

  return (
    <View style={[styles.container, { width: displaySize, height: displaySize }]}>
      <Image
        source={source}
        style={{
          width: sheetWidth * scaleX,
          height: sheetHeight * scaleY,
          position: 'absolute',
          left: offsetX,
          top: offsetY,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
