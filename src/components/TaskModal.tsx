import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  Clipboard,
} from 'react-native';
import type { Message, TaskItem } from '../types';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../theme';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles as LucideSparkles,
  Clipboard as LucideClipboard,
  User as LucideUser,
  CheckCircle2 as LucideCheckCircle,
  Zap as LucideZap,
} from 'lucide-react-native';

const Sparkles = LucideSparkles as any;
const ClipboardIcon = LucideClipboard as any;
const User = LucideUser as any;
const CheckCircle = LucideCheckCircle as any;
const Zap = LucideZap as any;

// ─── AI mock extraction logic ──────────────────────────────────────────────────
function extractTasksFromMessages(messages: Message[]): TaskItem[] {
  const actionKeywords = [
    /can you (.+?)(?:\?|$)/i,
    /please (.+?)(?:\.|$)/i,
    /update (.+?)(?:\.|$)/i,
    /add (.+?)(?:\.|$)/i,
    /review (.+?)(?:\.|$)/i,
    /patch (.+?)(?:\.|$)/i,
    /deploy (.+?)(?:\.|$)/i,
    /trigger (.+?)(?:\.|$)/i,
  ];

  const tasks: TaskItem[] = [];
  let taskId = 0;

  // Dynamically extract from live messages
  messages.forEach((msg) => {
    for (const pattern of actionKeywords) {
      const match = msg.text.match(pattern);
      if (match && match[1]) {
        const text = match[1].trim();
        const alreadyExists = tasks.some((t) =>
          t.text.toLowerCase().includes(text.substring(0, 20).toLowerCase()),
        );
        if (!alreadyExists && text.length > 8) {
          tasks.push({
            id: `task-${++taskId}`,
            text: text.charAt(0).toUpperCase() + text.slice(1),
            assignee: msg.senderName,
            done: false,
          });
        }
      }
    }
  });

  return tasks;
}

// ─── TaskItem sub-component ────────────────────────────────────────────────────
function TaskItemRow({
  task,
  onToggle,
}: {
  task: TaskItem;
  onToggle: (id: string) => void;
}) {
  const checkScale = useRef(new Animated.Value(1)).current;

  function handleToggle() {
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
    ]).start();
    onToggle(task.id);
  }

  return (
    <TouchableOpacity
      style={[taskStyles.row, task.done && taskStyles.rowDone]}
      onPress={handleToggle}
      activeOpacity={0.8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.done }}
      accessibilityLabel={task.text}
    >
      <Animated.View
        style={[taskStyles.checkbox, task.done && taskStyles.checkboxChecked, { transform: [{ scale: checkScale }] }]}
      >
        {task.done && <Text style={taskStyles.checkmark}>✓</Text>}
      </Animated.View>
      <View style={taskStyles.taskContent}>
        <Text style={[taskStyles.taskText, task.done && taskStyles.taskTextDone]}>{task.text}</Text>
        {task.assignee && (
          <View style={taskStyles.assigneeRow}>
            <User size={12} color="#64748B" />
            <Text style={taskStyles.assigneeText}>{task.assignee}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const taskStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    marginBottom: 6,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 12,
  },
  rowDone: {
    backgroundColor: Colors.emeraldLight,
    borderColor: '#BBF7D0',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.emerald,
    borderColor: Colors.emerald,
  },
  checkmark: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  taskContent: { flex: 1 },
  taskText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontWeight: FontWeight.medium,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  assigneeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});

// ─── Success Indicator ─────────────────────────────────────────────────────────
function SuccessIndicator({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 30 }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
        }, 1800);
      });
    }
  }, [visible]);

  return (
    <Animated.View style={[successStyles.container, { opacity, transform: [{ translateY }] }]}>
      <CheckCircle size={16} color="#4ADE80" />
      <Text style={successStyles.text}>Copied to clipboard!</Text>
    </Animated.View>
  );
}

const successStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});

// ─── MODULE 3: TaskModal ───────────────────────────────────────────────────────
interface TaskModalProps {
  visible: boolean;
  messages: Message[];
  onClose: () => void;
}

export function TaskModal({ visible, messages, onClose }: TaskModalProps) {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Slide-in animation when visible
  useEffect(() => {
    if (visible) {
      setIsAnalyzing(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 5,
        }),
      ]).start();

      // Convert live messages to string transcript format
      const transcript = messages
        .map((m) => `[${m.timestamp}] ${m.senderName}: ${m.text}`)
        .join('\n');

      // Resolve active Metro host IP dynamically
      const hostUri = Constants.expoConfig?.hostUri;
      let ip = hostUri ? hostUri.split(':')[0] : 'localhost';
      if (ip === 'localhost' && Platform.OS === 'android') {
        ip = '10.0.2.2'; // Standard loopback for Android emulator
      }
      const apiUrl = `http://${ip}:5002/api/tasks/extract`;

      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const bodyText = await res.text().catch(() => '');
            throw new Error(`Server API failed: status ${res.status}. Body: ${bodyText}`);
          }
          return res.json();
        })
        .then((data: any) => {
          if (data && Array.isArray(data.tasks)) {
            const parsedTasks = data.tasks.map((t: any, idx: number) => ({
              id: `task-${idx}-${Date.now()}`,
              text: t.text,
              assignee: t.assignee || 'Unassigned',
              done: !!t.done,
            }));
            setTasks(parsedTasks);
          } else {
            setTasks([]);
          }
          setIsAnalyzing(false);
        })
        .catch((err) => {
          console.log('⚠️ AI extraction server failed, falling back to local extractor:', err);
          // Fall back gracefully to local deterministic mock extractor
          setTasks(extractTasksFromMessages(messages));
          setIsAnalyzing(false);
        });
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handleToggleTask(taskId: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
  }

  function handleCopyAll() {
    const text = tasks
      .map((t) => `${t.done ? '✅' : '☐'} ${t.text}${t.assignee ? ` (@${t.assignee})` : ''}`)
      .join('\n');
    Clipboard.setString(text);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  }

  function handleSyncToBoard() {
    // Placeholder: integrate with Trello/Linear/Jira API
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  }

  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <Animated.View style={[modalStyles.backdrop, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        <Animated.View
          style={[
            modalStyles.sheet,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          {/* Handle bar */}
          <View style={modalStyles.handle} />

          {/* Header */}
          <View style={modalStyles.header}>
            <View style={modalStyles.headerLeft}>
              <View style={modalStyles.aiIconWrap}>
                <Sparkles size={18} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <View>
                <Text style={modalStyles.headerTitle}>TELO AI</Text>
                <Text style={modalStyles.headerSub}>Extracted Action Items</Text>
              </View>
            </View>
            <TouchableOpacity
              style={modalStyles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={modalStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          {!isAnalyzing && tasks.length > 0 && (
            <View style={modalStyles.statsRow}>
              <View style={modalStyles.statPill}>
                <Text style={modalStyles.statNum}>{tasks.length}</Text>
                <Text style={modalStyles.statLabel}>total</Text>
              </View>
              <View style={[modalStyles.statPill, modalStyles.statPillGreen]}>
                <Text style={[modalStyles.statNum, { color: '#16A34A' }]}>{completedCount}</Text>
                <Text style={[modalStyles.statLabel, { color: '#16A34A' }]}>done</Text>
              </View>
              <View style={[modalStyles.statPill, modalStyles.statPillIndigo]}>
                <Text style={[modalStyles.statNum, { color: Colors.indigo }]}>
                  {tasks.length - completedCount}
                </Text>
                <Text style={[modalStyles.statLabel, { color: Colors.indigo }]}>remaining</Text>
              </View>
            </View>
          )}

          {/* Content */}
          {isAnalyzing ? (
            <View style={modalStyles.analyzingState}>
              <View style={modalStyles.analyzingDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[modalStyles.analyzingDot, { opacity: 1 - i * 0.25 }]} />
                ))}
              </View>
              <Text style={modalStyles.analyzingText}>AI is analyzing conversation…</Text>
              <Text style={modalStyles.analyzingSubText}>
                Extracting tasks, owners, and deadlines
              </Text>
            </View>
          ) : (
            <ScrollView
              style={modalStyles.taskList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing.base }}
            >
              {tasks.map((task) => (
                <TaskItemRow key={task.id} task={task} onToggle={handleToggleTask} />
              ))}
              {tasks.length === 0 && (
                <Text style={modalStyles.noTasksText}>
                  No action items detected in this conversation.
                </Text>
              )}
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View style={modalStyles.actionRow}>
            <TouchableOpacity
              style={modalStyles.secondaryBtn}
              onPress={handleCopyAll}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ClipboardIcon size={14} color="#0F172A" />
                <Text style={modalStyles.secondaryBtnText}>Copy All Tasks</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.primaryBtn}
              onPress={handleSyncToBoard}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={modalStyles.primaryBtnText}>Sync to Board</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <SuccessIndicator visible={showSuccess} />
      </Animated.View>
    </Modal>
  );
}

const SHEET_RADIUS = 22;

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  closeBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  statPillGreen: { backgroundColor: Colors.emeraldLight, borderColor: '#BBF7D0' },
  statPillIndigo: { backgroundColor: Colors.indigoLight, borderColor: '#C7D2FE' },
  statNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  taskList: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  analyzingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analyzingDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  analyzingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.indigo,
  },
  analyzingText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  analyzingSubText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  noTasksText: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    paddingVertical: Spacing.xxl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  secondaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.indigo,
  },
  primaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
});
