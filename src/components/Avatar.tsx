import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '../theme';

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Deterministic hue from name string
function nameToHue(name: string): string {
  const colors = [
    '#4F46E5', '#7C3AED', '#DB2777', '#0891B2',
    '#059669', '#D97706', '#DC2626', '#0284C7',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, photoURL, size = 36 }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = nameToHue(name);

  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        accessibilityLabel={`${name} avatar`}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
      accessibilityLabel={`${name} avatar`}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },
});
