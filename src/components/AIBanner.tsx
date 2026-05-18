import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles as LucideSparkles } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Radius } from '../theme';

const Sparkles = LucideSparkles as any;

interface AIBannerProps {
  onPress: () => void;
}

export function AIBanner({ onPress }: AIBannerProps) {
  return (
    <TouchableOpacity style={styles.aiBanner} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.aiBannerLeft}>
        <Sparkles size={18} color="#D97706" />
        <View style={styles.aiTextContainer}>
          <Text style={styles.aiBannerTitle}>TELO AI Task Extractor</Text>
          <Text style={styles.aiBannerSub} numberOfLines={2}>Long-press any message to run Gemini AI</Text>
        </View>
      </View>
      <View style={styles.aiBannerBadge}>
        <Text style={styles.aiBannerBadgeText}>Active</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    gap: 8,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
  },
  aiBannerSub: {
    fontSize: 11,
    color: '#737373',
  },
  aiBannerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },
  aiBannerBadgeText: {
    color: '#4F46E5',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
});
