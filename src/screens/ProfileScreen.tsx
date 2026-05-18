import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
    Share,
} from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { isFirebaseMock } from '../config/firebase';
import { socketService } from '../config/socket';
import { useFeedback } from '../hooks/useFeedback';

// ─── Lucide React Native Vector Icons ─────────────────────────────────────────
import {
    Activity as LucideActivity,
    Database as LucideDatabase,
    Cpu as LucideCpu,
    Clock as LucideClock,
    Sparkles as LucideSparkles,
    Trash2 as LucideTrash2,
    LogOut as LucideLogOut,
    ArrowRight as LucideArrowRight,
    Shield as LucideShield,
    Smile as LucideSmile,
} from 'lucide-react-native';

const Activity = LucideActivity as any;
const Database = LucideDatabase as any;
const Cpu = LucideCpu as any;
const Clock = LucideClock as any;
const Sparkles = LucideSparkles as any;
const Trash2 = LucideTrash2 as any;
const LogOut = LucideLogOut as any;
const ArrowRight = LucideArrowRight as any;
const Shield = LucideShield as any;
const Smile = LucideSmile as any;

// ─── Slack style avatar color map ──────────────────────────────────────────────
const AVATAR_COLORS = [
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#6366F1', // Indigo
];

const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

interface ProfileScreenProps {
    team: any;
    setTeam: (team: any) => void;
    setTeamLoading: (loading: boolean) => void;
    handleLogout: () => Promise<void> | void;
}

export function ProfileScreen({
    team,
    setTeam,
    setTeamLoading,
    handleLogout,
}: ProfileScreenProps) {
    const currentUser = useSelector((s: RootState) => s.auth.user);
    const [profileTeamCodeInput, setProfileTeamCodeInput] = useState('');
    const { triggerMessageSent, triggerErrorNotification } = useFeedback();

    const handleShareCode = async () => {
        if (!team) return;
        try {
            await Share.share({
                message: `Hey! Join my workspace squad on TELO! Enter code: ${team.code}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveMember = (memberId: string) => {
        Alert.alert(
            'Remove Member',
            'Are you sure you want to remove this member from the team?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const socket = socketService.socket;
                        if (socket) {
                            socket.emit('team:remove_member', { memberId }, (res: any) => {
                                if (res && res.success) {
                                    triggerMessageSent();
                                    Alert.alert('Success', 'Member has been successfully removed.');
                                } else {
                                    triggerErrorNotification();
                                    Alert.alert('Error', res?.error || 'Failed to remove member.');
                                }
                            });
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleJoinTeamFromProfile = () => {
        if (!profileTeamCodeInput.trim()) {
            Alert.alert('Error', 'Please enter a valid 6-character invite code.');
            triggerErrorNotification();
            return;
        }
        const socket = socketService.socket;
        if (socket) {
            setTeamLoading(true);
            socket.emit('team:join', { code: profileTeamCodeInput.trim() }, (res: any) => {
                setTeamLoading(false);
                if (res && res.success) {
                    setTeam(res.team);
                    setProfileTeamCodeInput('');
                    triggerMessageSent();
                    Alert.alert('Success', `Successfully joined workspace: ${res.team.name}!`);
                } else {
                    triggerErrorNotification();
                    Alert.alert('Error', res?.error || 'Failed to join workspace. Please verify the code.');
                }
            });
        }
    };

    const userAvatarColor = getAvatarColor(currentUser?.displayName || 'Anonymous');

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.profileContainer} showsVerticalScrollIndicator={false}>
            {/* Cover Banner with Slack Purple theme */}
            <View style={styles.coverBanner} />

            {/* Avatar Header Area */}
            <View style={styles.profileHeaderCard}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.profileAvatarLarge, { backgroundColor: userAvatarColor }]}>
                        <Text style={styles.profileAvatarText}>
                            {(currentUser?.displayName || 'A').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.profileStatusDotActive} />
                </View>

                <View style={styles.headerInfoContainer}>
                    <Text style={styles.profileDisplayName}>{currentUser?.displayName || 'Anonymous User'}</Text>
                    <Text style={styles.profileEmail}>{currentUser?.email || 'user@telo.app'}</Text>

                    {/* Slack Status Custom Pill */}
                    <View style={styles.statusPill}>
                        <Smile size={11} color="#4F46E5" />
                        <Text style={styles.statusPillText}>Active in TELO Workspace</Text>
                    </View>
                </View>
            </View>

            {/* Workspace Stats Card (Notion Layout) */}
            <View style={styles.profileSectionCard}>
                <Text style={styles.sectionHeader}>WORKSPACE DETAILS</Text>

                <View style={styles.statItem}>
                    <View style={styles.statLabelRow}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Activity size={13} color="#16A34A" />
                        </View>
                        <Text style={styles.statLabel}>Connection Engine</Text>
                    </View>
                    <Text style={styles.statVal}>Active (Sub-200ms)</Text>
                </View>

                <View style={styles.statItem}>
                    <View style={styles.statLabelRow}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#F1F5F9' }]}>
                            <Database size={13} color="#475569" />
                        </View>
                        <Text style={styles.statLabel}>Socket Server</Text>
                    </View>
                    <Text style={styles.statVal}>http://localhost:5002</Text>
                </View>

                <View style={styles.statItem}>
                    <View style={styles.statLabelRow}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
                            <Sparkles size={13} color="#D97706" />
                        </View>
                        <Text style={styles.statLabel}>AI Assistant</Text>
                    </View>
                    <Text style={styles.statVal}>Gemini 1.5 Flash</Text>
                </View>

                <View style={styles.statItem}>
                    <View style={styles.statLabelRow}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#EEF2FF' }]}>
                            <Cpu size={13} color="#4F46E5" />
                        </View>
                        <Text style={styles.statLabel}>Sandbox Mode</Text>
                    </View>
                    <Text style={styles.statVal}>{isFirebaseMock ? 'Developer Sandbox' : 'Firebase Production'}</Text>
                </View>
            </View>

            {/* Team Workspace Squad Card */}
            <View style={styles.profileSectionCard}>
                <View style={teamStyles.teamCardHeaderRow}>
                    <View>
                        <Text style={styles.sectionHeader}>WORKSPACE SQUAD</Text>
                        <Text style={teamStyles.teamSubtitle}>{team?.name || 'Loading Squad...'}</Text>
                    </View>
                    <TouchableOpacity style={teamStyles.teamShareBtn} onPress={handleShareCode} activeOpacity={0.8}>
                        <Sparkles size={11} color={Colors.indigo} />
                        <Text style={teamStyles.teamShareBtnText}>Code: {team?.code}</Text>
                    </TouchableOpacity>
                </View>

                {team?.members.map((mem: any) => {
                    const statusColors = {
                        online: '#10B981', // Green
                        away: '#F59E0B',   // Orange
                        offline: '#94A3B8', // Gray
                    };
                    const activeColor = statusColors[mem.status as 'online' | 'away' | 'offline'] || '#94A3B8';
                    const avatarColor = getAvatarColor(mem.name);
                    const isOwner = team.ownerId === mem.uid;

                    return (
                        <View key={mem.uid} style={teamStyles.memberRow}>
                            <View style={teamStyles.memberLeft}>
                                {/* Colored Avatar */}
                                <View style={[teamStyles.memberAvatar, { backgroundColor: avatarColor }]}>
                                    <Text style={teamStyles.memberAvatarText}>
                                        {mem.name.charAt(0).toUpperCase()}
                                    </Text>
                                    <View style={[teamStyles.statusIndicator, { backgroundColor: activeColor }]} />
                                </View>

                                <View style={teamStyles.memberInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={teamStyles.memberName}>
                                            {mem.name} {mem.uid === currentUser?.uid && '(You)'}
                                        </Text>
                                        {isOwner && (
                                            <View style={teamStyles.ownerBadge}>
                                                <Shield size={9} color="#4F46E5" />
                                                <Text style={teamStyles.ownerBadgeText}>Owner</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={teamStyles.memberEmail}>{mem.email || 'No email registered'}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[teamStyles.statusLabel, { color: activeColor }]}>
                                    {mem.status.toUpperCase()}
                                </Text>
                                {team.ownerId === currentUser?.uid && mem.uid !== currentUser?.uid ? (
                                    <TouchableOpacity
                                        onPress={() => handleRemoveMember(mem.uid)}
                                        style={teamStyles.removeBtn}
                                        activeOpacity={0.7}
                                    >
                                        <Trash2 size={13} color="#EF4444" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Join / Switch Workspace Squad */}
            <View style={styles.profileSectionCard}>
                <Text style={styles.sectionHeader}>SWITCH WORKSPACE SQUAD</Text>
                <Text style={styles.sectionDescText}>
                    Enter a 6-character squad invite code to leave the current squad and join a new one instantly.
                </Text>

                <View style={styles.switchInputContainer}>
                    <TextInput
                        placeholder="e.g. ABC123"
                        placeholderTextColor={Colors.textTertiary}
                        autoCapitalize="characters"
                        maxLength={6}
                        value={profileTeamCodeInput}
                        onChangeText={setProfileTeamCodeInput}
                        style={styles.switchTextInput}
                    />
                    <TouchableOpacity
                        onPress={handleJoinTeamFromProfile}
                        style={styles.switchButton}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.switchButtonText}>Join Squad</Text>
                        <ArrowRight size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Log Out Pill */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                <LogOut size={15} color="#DC2626" />
                <Text style={styles.logoutButtonText}>Log Out of TELO</Text>
            </TouchableOpacity>

            <Text style={styles.profileFooter}>TELO Collaboration Client v1.2.0 · All systems nominal</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6', // Minimal warm background like Notion
    },
    profileContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 120, // Leave room for Cover Banner
    },
    coverBanner: {
        height: 140,
        width: '120%', // Wider to guarantee overflow cover
        backgroundColor: '#000000', // Slack classic deep plum purple
        position: 'absolute',
        top: 0,
        left: -20,
    },
    profileHeaderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 20,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: -50, // Floating card overlap style
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileAvatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    profileAvatarText: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
    },
    profileStatusDotActive: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    headerInfoContainer: {
        alignItems: 'center',
    },
    profileDisplayName: {
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: '#0F172A',
    },
    profileEmail: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
        marginTop: 10,
        gap: 6,
        borderWidth: 0.5,
        borderColor: '#D8B4FE',
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: FontWeight.semibold,
        color: '#4F46E5',
    },
    profileSectionCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: Radius.lg,
        padding: 16,
        width: '100%',
        marginBottom: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: '#94A3B8',
        letterSpacing: 1.2,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    sectionDescText: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F5F9',
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statIconBadge: {
        width: 26,
        height: 26,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 13,
        color: '#334155',
        fontWeight: FontWeight.medium,
    },
    statVal: {
        fontSize: 12,
        fontWeight: FontWeight.semibold,
        color: '#0F172A',
    },
    switchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchTextInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: FontSize.base,
        color: '#0F172A',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    switchButton: {
        height: 40,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 14,
    },
    switchButtonText: {
        color: '#FFFFFF',
        fontWeight: FontWeight.bold,
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
        borderRadius: Radius.lg,
        width: '100%',
        height: 48,
        marginTop: 8,
    },
    logoutButtonText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: FontWeight.bold,
    },
    profileFooter: {
        fontSize: 9,
        color: '#94A3B8',
        marginTop: 40,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});

const teamStyles = StyleSheet.create({
    teamCardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 10,
    },
    teamSubtitle: {
        fontSize: 13,
        fontWeight: FontWeight.bold,
        color: '#0F172A',
        marginTop: 2,
    },
    teamShareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        gap: 4,
        borderWidth: 0.5,
        borderColor: '#C7D2FE',
    },
    teamShareBtnText: {
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: '#4F46E5',
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderColor: '#F1F5F9',
    },
    memberLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    memberAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    memberAvatarText: {
        color: '#FFFFFF',
        fontWeight: FontWeight.bold,
        fontSize: 14,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        position: 'absolute',
        bottom: -1,
        right: -1,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 13,
        fontWeight: FontWeight.semibold,
        color: '#1E293B',
    },
    ownerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#EEF2FF',
        borderWidth: 0.5,
        borderColor: '#C7D2FE',
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 4,
    },
    ownerBadgeText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
        color: '#4F46E5',
    },
    memberEmail: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 1,
    },
    statusLabel: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
    },
    removeBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#FEF2F2',
        borderWidth: 0.5,
        borderColor: '#FEE2E2',
    },
});
