import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles as LucideSparkles, Folder as LucideFolder, User as LucideUser, LogOut as LucideLogOut } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Radius } from '../theme';

const Sparkles = LucideSparkles as any;
const Folder = LucideFolder as any;
const User = LucideUser as any;
const LogOut = LucideLogOut as any;

interface WorkspaceOnboardingProps {
  teamNameInput: string;
  setTeamNameInput: (text: string) => void;
  teamCodeInput: string;
  setTeamCodeInput: (text: string) => void;
  teamError: string;
  teamLoading: boolean;
  handleCreateTeam: () => void;
  handleJoinTeam: () => void;
  handleLogout: () => void;
}

export function WorkspaceOnboarding({
  teamNameInput,
  setTeamNameInput,
  teamCodeInput,
  setTeamCodeInput,
  teamError,
  teamLoading,
  handleCreateTeam,
  handleJoinTeam,
  handleLogout,
}: WorkspaceOnboardingProps) {
  if (teamLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.indigo} />
        <Text style={styles.loadingText}>Fetching workspace credentials…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.onboardingBg}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.scrollContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>TELO</Text>
          </View>

          <View style={styles.headerWrap}>
            <Sparkles size={28} color={Colors.indigo} style={{ marginBottom: 8 }} />
            <Text style={styles.mainTitle}>Join or Create Workspace</Text>
            <Text style={styles.subTitle}>Collaborate with your teammates in real-time.</Text>
          </View>

          {teamError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{teamError}</Text>
            </View>
          ) : null}

          {/* Option A: Create Team */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Folder size={16} color={Colors.textPrimary} />
              <Text style={styles.cardTitle}>Create a New Team</Text>
            </View>
            <Text style={styles.cardDesc}>Start a clean new workspace and invite your classmates or teammates.</Text>
            <TextInput
              placeholder="e.g. Veterinary Laboratory Alpha"
              placeholderTextColor={Colors.textTertiary}
              style={styles.input}
              value={teamNameInput}
              onChangeText={setTeamNameInput}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateTeam}>
              <Text style={styles.primaryBtnText}>Create Workspace</Text>
            </TouchableOpacity>
          </View>

          {/* Option B: Join Team */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <User size={16} color={Colors.textPrimary} />
              <Text style={styles.cardTitle}>Join an Existing Team</Text>
            </View>
            <Text style={styles.cardDesc}>Enter the 6-character unique invite code shared by your teammates.</Text>
            <TextInput
              placeholder="e.g. TELO4X"
              placeholderTextColor={Colors.textTertiary}
              style={[styles.input, { textTransform: 'uppercase' }]}
              value={teamCodeInput}
              onChangeText={setTeamCodeInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleJoinTeam}>
              <Text style={styles.secondaryBtnText}>Join Workspace</Text>
            </TouchableOpacity>
          </View>

          {/* Logout/Back Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Log Out Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  loadingText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  onboardingBg: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    gap: 20,
  },
  watermarkContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  watermarkText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#EFEFEF',
    letterSpacing: 8,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: '#FAF9F6',
  },
  primaryBtn: {
    height: 48,
    backgroundColor: '#1A1A1A',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
  secondaryBtn: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#1A1A1A',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
});
