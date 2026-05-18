import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Share,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setActiveChannel } from '../store/slices/channelsSlice';
import { addMessage, toggleReaction } from '../store/slices/messagesSlice';
import { Avatar } from '../components/Avatar';
import { PresenceDot } from '../components/PresenceDot';
import { TypingIndicator } from '../components/TypingIndicator';
import { MessageRow } from '../components/MessageRow';
import { AIBanner } from '../components/AIBanner';
import { WorkspaceOnboarding } from '../components/WorkspaceOnboarding';
import type { Message, Channel, Reaction } from '../types';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../theme';
import { auth, isFirebaseMock } from '../config/firebase';
import { logoutSuccess, setLoading } from '../store/slices/authSlice';
import { socketService } from '../config/socket';
import { useFeedback } from '../hooks/useFeedback';
import { ProfileScreen } from './ProfileScreen';
import { TaskScreen } from './TaskScreen';

// ─── Lucide React Native Vector Icons ─────────────────────────────────────────
import {
  MessageSquare as LucideMessageSquare,
  CheckSquare as LucideCheckSquare,
  User as LucideUser,
  Hash as LucideHash,
  Sparkles as LucideSparkles,
  Send as LucideSend,
  Folder as LucideFolder,
  FileText as LucideFileText,
  Calendar as LucideCalendar,
  CheckCircle as LucideCheckCircle,
} from 'lucide-react-native';

const MessageSquare = LucideMessageSquare as any;
const CheckSquare = LucideCheckSquare as any;
const User = LucideUser as any;
const Hash = LucideHash as any;
const Sparkles = LucideSparkles as any;
const Send = LucideSend as any;
const Folder = LucideFolder as any;
const FileText = LucideFileText as any;
const Calendar = LucideCalendar as any;
const CheckCircle = LucideCheckCircle as any;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Mock presence map ─────────────────────────────────────────────────────────
const PRESENCE_MAP: Record<string, 'online' | 'away' | 'offline'> = {
  'alex-uid': 'online',
  'sam-uid': 'online',
  general: 'online',
  engineering: 'online',
  random: 'away',
  design: 'online',
  devops: 'offline',
};



// ─── MODULE 2: DashboardScreen ─────────────────────────────────────────────────
interface DashboardScreenProps {
  onOpenTaskModal: (messages: Message[]) => void;
}

export function DashboardScreen({ onOpenTaskModal }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // State-based Bottom Tab Controller (0: Chat, 1: Tasks, 2: Profile)
  const [activeTab, setActiveTab] = useState(0);

  // Redux mappings
  const channels = useSelector((s: RootState) => s.channels.channels);
  const activeChannelId = useSelector((s: RootState) => s.channels.activeChannelId);
  const messagesByChannel = useSelector((s: RootState) => s.messages.messagesByChannel);
  const typingUsers = useSelector((s: RootState) => s.messages.typingUsers);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const token = useSelector((s: RootState) => s.auth.token);

  // Chat Form States
  const [inputText, setInputText] = useState('');
  const [showMentionsList, setShowMentionsList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<Message | null>(null);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Team Workspace Setup States
  const [team, setTeam] = useState<any>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [teamError, setTeamError] = useState('');

  const activeMessages: Message[] = messagesByChannel[activeChannelId] ?? [];
  const activeChannelName = channels.find((c) => c.id === activeChannelId)?.name ?? '';
  const activeTypingUsers: string[] = typingUsers[activeChannelId] ?? [];

  // Unified Feedback Hook Triggers
  const { triggerMessageSent, triggerMessageReceived, triggerErrorNotification } = useFeedback();

  // Real-time WebSocket Messaging Sync Effect
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    // Join active channel room in backend pipeline
    socket.emit('channel:join', activeChannelId);

    // Listen for new inbound messages
    const handleNewMessage = (msg: Message) => {
      const channelMsgs = messagesByChannel[msg.channelId] ?? [];
      const alreadyExists = channelMsgs.some((m) => m.id === msg.id);
      if (!alreadyExists) {
        dispatch(addMessage(msg));
        // Trigger distinct notification bump + chime audio if from another developer
        if (msg.senderId !== currentUser?.uid) {
          triggerMessageReceived();
        }
      }
    };

    // Listen for reaction changes from remote teammates
    const handleReactionUpdate = (data: { channelId: string; messageId: string; emoji: string; userId: string }) => {
      if (data.userId !== currentUser?.uid) {
        dispatch(toggleReaction({ channelId: data.channelId, messageId: data.messageId, emoji: data.emoji }));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('reaction:update', handleReactionUpdate);

    return () => {
      socket.emit('channel:leave', activeChannelId);
      socket.off('message:new', handleNewMessage);
      socket.off('reaction:update', handleReactionUpdate);
    };
  }, [activeChannelId, socketService.socket, currentUser?.uid, messagesByChannel]);

  // Load Team On Mount & Listen for Squad updates
  useEffect(() => {
    let active = true;
    let checkInterval: NodeJS.Timeout;

    const tryFetch = () => {
      const socket = socketService.socket;
      if (socket) {
        if (checkInterval) clearInterval(checkInterval);

        socket.emit('team:get', {}, (res: any) => {
          if (!active) return;
          setTeamLoading(false);
          if (res && res.success && res.team) {
            setTeam(res.team);
          } else {
            setTeam(null);
          }
        });
      }
    };

    tryFetch();

    if (!socketService.socket) {
      checkInterval = setInterval(() => {
        if (socketService.socket) {
          tryFetch();
        }
      }, 200);
    }

    const setupListeners = () => {
      const socket = socketService.socket;
      if (!socket) return;

      const handleTeamUpdate = (updatedTeam: any) => {
        if (active) setTeam(updatedTeam);
      };

      const handleMemberJoined = (data: { member: any }) => {
        if (!active) return;
        setTeam((prev: any) => {
          if (!prev) return null;
          const exists = prev.members.some((m: any) => m.uid === data.member.uid);
          if (exists) return prev;
          return {
            ...prev,
            members: [...prev.members, data.member],
          };
        });
      };

      const handleMemberStatus = (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
        if (!active) return;
        setTeam((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            members: prev.members.map((m: any) =>
              m.uid === data.userId ? { ...m, status: data.status } : m
            ),
          };
        });
      };

      const handleMemberRemoved = (data: { userId: string }) => {
        if (!active) return;
        if (data.userId === currentUser?.uid) {
          setTeam(null);
        } else {
          setTeam((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              members: prev.members.filter((m: any) => m.uid !== data.userId),
            };
          });
        }
      };

      socket.on('team:update', handleTeamUpdate);
      socket.on('team:member_joined', handleMemberJoined);
      socket.on('team:member_status', handleMemberStatus);
      socket.on('team:member_removed', handleMemberRemoved);

      return () => {
        socket.off('team:update', handleTeamUpdate);
        socket.off('team:member_joined', handleMemberJoined);
        socket.off('team:member_status', handleMemberStatus);
        socket.off('team:member_removed', handleMemberRemoved);
      };
    };

    let cleanupListeners: (() => void) | undefined;

    if (socketService.socket) {
      cleanupListeners = setupListeners();
    } else {
      const waitInterval = setInterval(() => {
        if (socketService.socket) {
          clearInterval(waitInterval);
          cleanupListeners = setupListeners();
        }
      }, 200);

      return () => {
        clearInterval(waitInterval);
        if (checkInterval) clearInterval(checkInterval);
        active = false;
        if (cleanupListeners) cleanupListeners();
      };
    }

    // Register connect reconnect refetches
    const registerConnectRefetch = () => {
      const socket = socketService.socket;
      if (socket) {
        socket.on('connect', tryFetch);
      }
    };
    registerConnectRefetch();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      active = false;
      if (cleanupListeners) cleanupListeners();
      const socket = socketService.socket;
      if (socket) {
        socket.off('connect', tryFetch);
      }
    };
  }, [token]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    const lastWord = text.substring(text.lastIndexOf(' ') + 1);
    if (lastWord.startsWith('@')) {
      const query = lastWord.substring(1).toLowerCase();
      setMentionQuery(query);
      setShowMentionsList(true);
    } else {
      setShowMentionsList(false);
    }
  };

  const handleSelectMention = (member: any) => {
    const text = inputText;
    const lastSpaceIdx = text.lastIndexOf(' ');
    const prefix = lastSpaceIdx >= 0 ? text.substring(0, lastSpaceIdx + 1) : '';
    setInputText(`${prefix}@${member.name} `);
    setShowMentionsList(false);
    triggerMessageSent();
  };

  const filteredMembers = (team?.members || []).filter((m: any) =>
    m.name.toLowerCase().includes(mentionQuery)
  );

  const handleCreateTeam = () => {
    if (!teamNameInput.trim()) {
      setTeamError('Workspace name cannot be empty.');
      triggerErrorNotification();
      return;
    }
    const socket = socketService.socket;
    if (socket) {
      setTeamLoading(true);
      socket.emit('team:create', { teamName: teamNameInput.trim() }, (res: any) => {
        setTeamLoading(false);
        if (res && res.success) {
          setTeam(res.team);
          setTeamError('');
          triggerMessageSent();
        } else {
          setTeamError(res?.error || 'Failed to create workspace.');
          triggerErrorNotification();
        }
      });
    }
  };

  const handleJoinTeam = () => {
    if (!teamCodeInput.trim()) {
      setTeamError('Join code cannot be empty.');
      triggerErrorNotification();
      return;
    }
    const socket = socketService.socket;
    if (socket) {
      setTeamLoading(true);
      socket.emit('team:join', { code: teamCodeInput.trim() }, (res: any) => {
        setTeamLoading(false);
        if (res && res.success) {
          setTeam(res.team);
          setTeamError('');
          triggerMessageSent();
        } else {
          setTeamError(res?.error || 'Failed to join workspace.');
          triggerErrorNotification();
        }
      });
    }
  };

  function handleSelectChannel(channelId: string) {
    dispatch(setActiveChannel(channelId));
  }

  function handleReact(messageId: string, emoji: string) {
    const socket = socketService.socket;
    if (socket && socket.connected && currentUser) {
      socket.emit('reaction:toggle', {
        channelId: activeChannelId,
        messageId,
        emoji,
        userId: currentUser.uid,
      });
      // Toggle locally for instant reactive click experience
      dispatch(toggleReaction({ channelId: activeChannelId, messageId, emoji }));
    } else {
      // Offline mock fallback
      dispatch(toggleReaction({ channelId: activeChannelId, messageId, emoji }));
    }
  }

  function handleMessageLongPress(message: Message) {
    setSelectedMessageForMenu(message);
    setShowReactionMenu(true);
    triggerMessageSent();
  }

  function handleToggleMenuReaction(emoji: string) {
    if (!selectedMessageForMenu) return;
    handleReact(selectedMessageForMenu.id, emoji);
    setShowReactionMenu(false);
  }

  function handleCopyMessageText() {
    if (!selectedMessageForMenu) return;
    Clipboard.setString(selectedMessageForMenu.text);
    triggerMessageSent();
    Alert.alert('Copied', 'Message text copied to clipboard successfully!');
    setShowReactionMenu(false);
  }

  function handleMenuAIExtract() {
    if (!selectedMessageForMenu) return;
    onOpenTaskModal([selectedMessageForMenu]);
    setShowReactionMenu(false);
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || !currentUser) {
      // Aggressive warning bump and warning audio on empty message validation failure
      triggerErrorNotification();
      return;
    }

    const socket = socketService.socket;
    if (socket && socket.connected) {
      socket.emit('message:send', {
        channelId: activeChannelId,
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName ?? 'Anonymous',
        senderPhoto: currentUser.photoURL ?? undefined,
      });
      // Crisp light snap + pop confirmation
      triggerMessageSent();
      setInputText('');
    } else {
      // Fallback local addition if socket is offline or running in mock development sandbox
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        channelId: activeChannelId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName ?? 'Anonymous',
        senderPhoto: currentUser.photoURL ?? undefined,
        text,
        timestamp: new Date(),
        reactions: [],
      };
      dispatch(addMessage(newMsg));
      triggerMessageSent();
      setInputText('');
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const handleLogout = async () => {
    dispatch(setLoading(true));
    try {
      if (!isFirebaseMock) {
        await auth.signOut();
      }
      dispatch(logoutSuccess());
      socketService.disconnect();
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageRow
        message={item}
        onReact={handleReact}
        onLongPress={handleMessageLongPress}
      />
    ),
    [activeChannelId],
  );

  if (teamLoading || !team) {
    return (
      <WorkspaceOnboarding
        teamNameInput={teamNameInput}
        setTeamNameInput={setTeamNameInput}
        teamCodeInput={teamCodeInput}
        setTeamCodeInput={setTeamCodeInput}
        teamError={teamError}
        teamLoading={teamLoading}
        handleCreateTeam={handleCreateTeam}
        handleJoinTeam={handleJoinTeam}
        handleLogout={handleLogout}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Tab 0: Chat & Feed ── */}
      {activeTab === 0 && (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Top Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.channelTitleWrap}>
              <Text style={styles.logoMarkSmall}>T</Text>
              <View>
                <Text style={styles.channelTitle}>{activeChannelName}</Text>
                <Text style={teamStyles.teamSubTitleHeader}>{team?.name} · Invite: {team?.code}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.aiHeaderBtn}
              onPress={() => onOpenTaskModal(activeMessages)}
            >
              <View style={styles.aiBtnRow}>
                <Sparkles size={12} color="#1A1A1A" />
                <Text style={styles.aiHeaderBtnText}>Run AI</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Dynamic Horizontal Channel Selector Bar */}
          <View style={styles.horizontalChannelsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelsScroll}>
              {channels.map((ch) => {
                const isActive = ch.id === activeChannelId;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    onPress={() => handleSelectChannel(ch.id)}
                    style={[styles.channelBarItem, isActive && styles.channelBarItemActive]}
                  >
                    <View style={styles.channelTagRow}>
                      <Hash size={10} color={isActive ? '#FFFFFF' : '#64748B'} />
                      <Text style={[styles.channelBarText, isActive && styles.channelBarTextActive]}>
                        {ch.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* AI Banner */}
          <AIBanner onPress={() => onOpenTaskModal(activeMessages)} />

          {/* Message List */}
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No messages yet. Send a message to start collaboration.</Text>
              </View>
            }
          />

          {/* Typing Indicator */}
          {activeTypingUsers.length > 0 && (
            <View style={styles.typingArea}>
              <TypingIndicator names={activeTypingUsers} />
            </View>
          )}

          {/* Mentions Dropdown Overlay */}
          {showMentionsList && filteredMembers.length > 0 && (
            <View style={styles.mentionsOverlayContainer}>
              <View style={styles.mentionsHeader}>
                <Text style={styles.mentionsHeaderText}>Teammates in Workspace</Text>
              </View>
              <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.mentionRowItem}
                    onPress={() => handleSelectMention(item)}
                  >
                    <View style={styles.mentionRowItemLeft}>
                      <View style={styles.mentionAvatar}>
                        <Text style={styles.mentionAvatarText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.mentionNameText}>{item.name}</Text>
                        <Text style={styles.mentionEmailText}>{item.email || 'No email'}</Text>
                      </View>
                    </View>
                    <View style={[styles.mentionStatusDot, { backgroundColor: item.status === 'online' ? '#10B981' : '#94A3B8' }]} />
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
                style={styles.mentionsFlatList}
              />
            </View>
          )}

          {/* Bottom input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Send a message..."
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Tab 1: Trellix Task Board ── */}
      {activeTab === 1 && (
        <TaskScreen />
      )}

      {/* ── Tab 2: Profile & Settings ── */}
      {activeTab === 2 && (
        <ProfileScreen
          team={team}
          setTeam={setTeam}
          setTeamLoading={setTeamLoading}
          handleLogout={handleLogout}
        />
      )}

      {/* ── Custom High-Fidelity Bottom Tab Bar Selector ── */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => setActiveTab(0)}
          activeOpacity={0.7}
        >
          <MessageSquare size={18} color={activeTab === 0 ? '#000000' : '#A3A3A3'} />
          <Text style={[styles.tabBarText, activeTab === 0 && styles.tabBarTextActive]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => setActiveTab(1)}
          activeOpacity={0.7}
        >
          <CheckSquare size={18} color={activeTab === 1 ? '#000000' : '#A3A3A3'} />
          <Text style={[styles.tabBarText, activeTab === 1 && styles.tabBarTextActive]}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => setActiveTab(2)}
          activeOpacity={0.7}
        >
          <User size={18} color={activeTab === 2 ? '#000000' : '#A3A3A3'} />
          <Text style={[styles.tabBarText, activeTab === 2 && styles.tabBarTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ── Reactions & Context Menu Modal Overlay ── */}
      {showReactionMenu && selectedMessageForMenu && (
        <View style={styles.menuOverlayBackground}>
          <Pressable style={styles.menuOverlayBackdrop} onPress={() => setShowReactionMenu(false)} />
          <View style={[styles.menuOverlayContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            {/* Quick Reactions Emojis Row */}
            <View style={styles.menuReactionsRow}>
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.menuEmojiButton}
                  onPress={() => handleToggleMenuReaction(emoji)}
                >
                  <Text style={styles.menuEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Message Snapshot Context Preview */}
            <View style={styles.menuMessagePreview}>
              <Text style={styles.menuPreviewSender}>{selectedMessageForMenu.senderName}</Text>
              <Text style={styles.menuPreviewText} numberOfLines={2}>{selectedMessageForMenu.text}</Text>
            </View>

            {/* Actions Menu List */}
            <View style={styles.menuActionsList}>
              <TouchableOpacity style={styles.menuActionButton} onPress={handleCopyMessageText}>
                <Text style={styles.menuActionBtnText}>Copy Message Text</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuActionButton} onPress={handleMenuAIExtract}>
                <Text style={[styles.menuActionBtnText, { color: '#D97706', fontWeight: 'bold' }]}>
                  Extract Task with Gemini AI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuActionButton, { borderBottomWidth: 0 }]}
                onPress={() => setShowReactionMenu(false)}
              >
                <Text style={[styles.menuActionBtnText, { color: '#EF4444' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Dashboard Visual Stylesheet ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  channelTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMarkSmall: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
  },
  aiHeaderBtn: {
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiHeaderBtnText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },

  // Channels selector bar at the top (replaces the drawer sidebar layout!)
  horizontalChannelsBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  channelsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  channelBarItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  channelBarItemActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  channelTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  channelBarText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: '#64748B',
  },
  channelBarTextActive: {
    color: '#FFFFFF',
  },

  // AI Banner
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
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  },
  aiBannerBadgeText: {
    color: '#4F46E5',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },

  // Chat Feed Message styling
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
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

  // Typing Area
  typingArea: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },

  // Chat Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    fontSize: 13,
    color: '#1A1A1A',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#F4F5F7',
  },
  mentionsOverlayContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
    overflow: 'hidden',
  },
  mentionsHeader: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mentionsHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mentionsFlatList: {
    flexGrow: 0,
  },
  mentionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mentionRowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.indigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionAvatarText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    fontSize: 12,
  },
  mentionNameText: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: '#1E293B',
  },
  mentionEmailText: {
    fontSize: 11,
    color: '#64748B',
  },
  mentionStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 13,
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 18,
  },





  // ─── Custom Bottom Tab Bar Visual Styles ───────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 12 : 6,
    paddingTop: 6,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabBarText: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: '#A3A3A3',
  },
  tabBarTextActive: {
    color: '#000000',
    fontWeight: FontWeight.bold,
  },
  menuOverlayBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 99999,
  },
  menuOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  menuOverlayContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  menuReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  menuEmojiButton: {
    padding: 6,
  },
  menuEmojiText: {
    fontSize: 24,
  },
  menuMessagePreview: {
    backgroundColor: '#FAF9F6',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  menuPreviewSender: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.indigo,
    marginBottom: 4,
  },
  menuPreviewText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  menuActionsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  menuActionBtnText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: FontWeight.semibold,
  },
});

// ─── Carousel Graphics Visual Styles ──────────────────────────────────────────


const teamStyles = StyleSheet.create({
  teamSubTitleHeader: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
