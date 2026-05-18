import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { UserPresence } from '../types';
import { Colors } from '../theme';

interface PresenceDotProps {
  presence: UserPresence;
  size?: number;
}

const presenceColor: Record<UserPresence, string> = {
  online: Colors.emerald,
  away: Colors.amber,
  offline: Colors.textTertiary,
};

export function PresenceDot({ presence, size = 10 }: PresenceDotProps) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: presenceColor[presence],
        },
      ]}
      accessibilityLabel={`Status: ${presence}`}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    borderWidth: 2,
    borderColor: Colors.bgPrimary,
  },
});
