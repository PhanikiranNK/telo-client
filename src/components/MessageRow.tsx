import React from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import type { Message, Reaction } from '../types';
import { Colors, FontSize, FontWeight, Radius } from '../theme';

interface ReactionChipProps {
  reaction: Reaction;
  onPress: () => void;
}

function ReactionChip({ reaction, onPress }: ReactionChipProps) {
  return (
    <TouchableOpacity
      style={[styles.reactionChip, reaction.reactedByMe && styles.reactionChipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
      <Text style={[styles.reactionCount, reaction.reactedByMe && styles.reactionCountActive]}>
        {reaction.count}
      </Text>
    </TouchableOpacity>
  );
}

interface MessageRowProps {
  message: Message;
  onReact: (messageId: string, emoji: string) => void;
  onLongPress: (message: Message) => void;
}

export function MessageRow({ message, onReact, onLongPress }: MessageRowProps) {
  const ts = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);
  const timeLabel = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable
      style={({ pressed }) => [styles.messageRow, pressed && styles.messageRowPressed]}
      onLongPress={() => onLongPress(message)}
      accessibilityLabel={`Message from ${message.senderName}`}
    >
      <Avatar name={message.senderName} photoURL={message.senderPhoto} size={36} />
      <View style={styles.messageBody}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageSender}>{message.senderName}</Text>
          <Text style={styles.messageTime}>{timeLabel}</Text>
        </View>
        <Text style={styles.messageText}>{message.text}</Text>
        {message.reactions.length > 0 && (
          <View style={styles.reactionsRow}>
            {message.reactions.map((r) => (
              <ReactionChip
                key={r.emoji}
                reaction={r}
                onPress={() => onReact(message.id, r.emoji)}
              />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F8FAFC',
  },
  messageRowPressed: {
    backgroundColor: '#FAF9F6',
  },
  messageBody: {
    flex: 1,
    gap: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  messageSender: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
  },
  messageTime: {
    fontSize: 10,
    color: '#A3A3A3',
  },
  messageText: {
    fontSize: 13,
    color: '#3A3A3A',
    lineHeight: 18,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  reactionChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: FontWeight.medium,
  },
  reactionCountActive: {
    color: '#4F46E5',
    fontWeight: FontWeight.bold,
  },
});
