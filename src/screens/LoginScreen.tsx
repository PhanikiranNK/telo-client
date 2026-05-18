import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../theme';
import { useDispatch } from 'react-redux';
import { setLoading, authStart, authSuccess, authFailure } from '../store/slices/authSlice';
import type { AppDispatch } from '../store';
import { auth, isFirebaseMock } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// ─── Lucide React Native Vector Icons ─────────────────────────────────────────
import {
  Folder as LucideFolder,
  CheckCircle as LucideCheckCircle,
  FileText as LucideFileText,
  User as LucideUser,
  Calendar as LucideCalendar,
  Sparkles as LucideSparkles,
} from 'lucide-react-native';

const Folder = LucideFolder as any;
const CheckCircle = LucideCheckCircle as any;
const FileText = LucideFileText as any;
const User = LucideUser as any;
const Calendar = LucideCalendar as any;
const Sparkles = LucideSparkles as any;

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Google SVG-style vector icon using RN shapes ─────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={[googleIconStyles.container, { width: size, height: size }]}>
      <View style={[googleIconStyles.segment, googleIconStyles.blue]} />
      <View style={[googleIconStyles.segment, googleIconStyles.red]} />
      <View style={[googleIconStyles.segment, googleIconStyles.yellow]} />
      <View style={[googleIconStyles.segment, googleIconStyles.green]} />
      <View style={googleIconStyles.center} />
    </View>
  );
}

const googleIconStyles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  blue: { backgroundColor: '#4285F4', top: 0, right: 0 },
  red: { backgroundColor: '#EA4335', top: 0, left: 0 },
  yellow: { backgroundColor: '#FBBC05', bottom: 0, left: 0 },
  green: { backgroundColor: '#34A853', bottom: 0, right: 0 },
  center: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});

// ─── Loading Overlay with pulsing blob ────────────────────────────────────────
function AuthLoadingOverlay({ message = 'Connecting securely…' }: { message?: string }) {
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View style={overlayStyles.backdrop}>
      <View style={overlayStyles.card}>
        <Animated.View style={[overlayStyles.blob, { transform: [{ scale: pulse }] }]} />
        <ActivityIndicator size="large" color={Colors.indigo} style={overlayStyles.spinner} />
        <Text style={overlayStyles.heading}>{message}</Text>
        <Text style={overlayStyles.sub}>TELO Secure Core Verification</Text>
      </View>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,245,247,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  card: {
    width: 260,
    paddingVertical: 36,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.indigoLight,
    top: -50,
  },
  spinner: { marginBottom: 16 },
  heading: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});

// ─── Native High-Fidelity Notion-Style Carousel Graphics ──────────────────────
function CarouselGraphics({ index }: { index: number }) {
  if (index === 0) {
    return (
      <View style={slideStyles.cardContainer}>
        <View style={slideStyles.projectHeader}>
          <Folder size={16} color="#1A1A1A" />
          <Text style={slideStyles.projectTitle}>Q2 Roadmap</Text>
        </View>
        <View style={slideStyles.todoList}>
          <View style={slideStyles.todoItem}>
            <View style={[slideStyles.todoCheck, slideStyles.completed]}>
              <CheckCircle size={10} color="#03543F" />
            </View>
            <Text style={[slideStyles.todoText, slideStyles.completedText]}>Launch client beta</Text>
          </View>
          <View style={slideStyles.todoItem}>
            <View style={[slideStyles.todoCheck, slideStyles.completed]}>
              <CheckCircle size={10} color="#03543F" />
            </View>
            <Text style={[slideStyles.todoText, slideStyles.completedText]}>Set up WebSocket server</Text>
          </View>
          <View style={slideStyles.todoItem}>
            <View style={slideStyles.todoBulletActive} />
            <Text style={[slideStyles.todoText, slideStyles.activeText]}>Integrate AI task extractor</Text>
          </View>
          <View style={slideStyles.todoItem}>
            <View style={slideStyles.todoBulletPending} />
            <Text style={[slideStyles.todoText, slideStyles.pendingText]}>Real-time presence indicators</Text>
          </View>
        </View>
      </View>
    );
  }

  if (index === 1) {
    return (
      <View style={slideStyles.cardContainer}>
        {/* Base document underlay */}
        <View style={slideStyles.baseDocCard}>
          <View style={slideStyles.projectHeader}>
            <FileText size={16} color="#1A1A1A" />
            <Text style={slideStyles.projectTitle}>Workspace Rules</Text>
          </View>
          <View style={slideStyles.docLineShort} />
          <View style={slideStyles.docLineLong} />
          <View style={slideStyles.docLineLong} />
        </View>
        {/* Floating comments card overlay */}
        <View style={slideStyles.commentCard}>
          <View style={slideStyles.commentHeader}>
            <User size={12} color="#1A1A1A" />
            <Text style={slideStyles.commentAuthor}>Alex Chen</Text>
          </View>
          <Text style={slideStyles.commentBody}>"Let's add typing indicators to channels."</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={slideStyles.cardContainer}>
      <View style={slideStyles.calendarHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Calendar size={12} color="#64748B" />
          <Text style={slideStyles.calendarMonth}>MAY 2026</Text>
        </View>
      </View>
      <View style={slideStyles.calendarBody}>
        <View style={slideStyles.calendarTile}>
          <Text style={slideStyles.calendarDay}>22</Text>
          <Text style={slideStyles.calendarDayLabel}>Friday</Text>
        </View>
        <View style={slideStyles.eventContainer}>
          <View style={slideStyles.eventPill}>
            <Sparkles size={10} color="#4F46E5" />
            <Text style={slideStyles.eventText}>TELO Sync</Text>
          </View>
          <Text style={slideStyles.eventTime}>10:00 AM · #telo</Text>
        </View>
      </View>
    </View>
  );
}

// ─── MODULE 1: LoginScreen ────────────────────────────────────────────────────
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Connecting securely…');

  // Sheet State
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Carousel Slide State
  const [activeSlide, setActiveSlide] = useState(0);

  // Animation values
  const pressScale = useRef(new Animated.Value(1)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Carousel Auto-Play Loop
  useEffect(() => {
    if (showAuthSheet) return; // pause auto-play when modal is active

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 3800);

    return () => clearInterval(timer);
  }, [showAuthSheet]);

  const openAuthSheet = (signUpMode: boolean = false) => {
    setIsSignUp(signUpMode);
    setError(null);
    setShowAuthSheet(true);

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeAuthSheet = () => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAuthSheet(false);
    });
  };

  function handlePressIn() {
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }

  async function handleEmailSignIn() {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Logging in…');
    setError(null);
    dispatch(setLoading(true));
    dispatch(authStart());

    if (isFirebaseMock) {
      await new Promise((r) => setTimeout(r, 1200));

      const mockDisplayName = email.split('@')[0] || 'Alex Chen';
      const mockFormattedName = mockDisplayName.charAt(0).toUpperCase() + mockDisplayName.slice(1);

      dispatch(
        authSuccess({
          user: {
            uid: `mock-uid-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
            displayName: mockFormattedName,
            email: email,
            photoURL: null,
          },
          token: `mock-token-${email}`,
        }),
      );
      setIsLoading(false);
      dispatch(setLoading(false));
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      dispatch(
        authSuccess({
          user: {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous User',
            email: user.email,
            photoURL: user.photoURL || null,
          },
          token,
        }),
      );
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address syntax.';
      }
      setError(msg);
      dispatch(authFailure(msg));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  }

  async function handleEmailSignUp() {
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Creating account…');
    setError(null);
    dispatch(setLoading(true));
    dispatch(authStart());

    if (isFirebaseMock) {
      await new Promise((r) => setTimeout(r, 1200));

      const resolvedName = displayName.trim() || email.split('@')[0] || 'Anonymous User';
      const mockFormattedName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);

      dispatch(
        authSuccess({
          user: {
            uid: `mock-uid-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
            displayName: mockFormattedName,
            email: email,
            photoURL: null,
          },
          token: `mock-token-${email}`,
        }),
      );
      setIsLoading(false);
      dispatch(setLoading(false));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const resolvedName = displayName.trim() || 'Anonymous User';
      await updateProfile(user, {
        displayName: resolvedName
      });

      const token = await user.getIdToken();
      dispatch(
        authSuccess({
          user: {
            uid: user.uid,
            displayName: resolvedName,
            email: user.email,
            photoURL: user.photoURL || null,
          },
          token,
        }),
      );
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email is already in use by another account.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address syntax.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password must be stronger.';
      }
      setError(msg);
      dispatch(authFailure(msg));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setLoadingMessage('Connecting Google OAuth…');
    setError(null);
    dispatch(setLoading(true));
    dispatch(authStart());

    await new Promise((r) => setTimeout(r, 1800));

    try {
      dispatch(
        authSuccess({
          user: {
            uid: 'mock-uid-001',
            displayName: 'Alex Chen',
            email: 'alex@telo.app',
            photoURL: null,
          },
          token: 'mock-token-001',
        }),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      setError(message);
      dispatch(authFailure(message));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />

      {/* Notion iOS Canvas Background */}
      <View style={styles.contentCanvas}>
        {/* Top Header Logo */}
        <View style={styles.topLogoContainer}>
          <Text style={styles.logoMark}>T</Text>
          <Text style={styles.logoText}>TELO</Text>
        </View>

        {/* Floating Feature Illustration Carousel */}
        <View style={styles.carouselOuter}>
          <CarouselGraphics index={activeSlide} />
        </View>

        {/* Welcome Text Title / Subtitle - Notion Dribbble style layout */}
        <View style={styles.welcomeTextSection}>
          <Text style={styles.welcomeTitle}>
            Write, plan,{' \n'}collaborate.
          </Text>
          <Text style={styles.welcomeSubtitle}>
            A sub-200ms real-time workspace for high performance teams. Fast, offline-first, and secure.
          </Text>
        </View>

        {/* Action Button Section at Bottom */}
        <View style={styles.actionButtonsArea}>
          {/* Pagination Indicators */}
          <View style={styles.paginationDots}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveSlide(i)}
                style={[
                  styles.dot,
                  activeSlide === i && styles.dotActive
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.notionPillButton}
            onPress={() => openAuthSheet(true)} // starts in Create Account mode
            activeOpacity={0.9}
          >
            <Text style={styles.notionPillButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => openAuthSheet(false)} // starts in Sign In mode
            activeOpacity={0.7}
          >
            <Text style={styles.signInLinkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sliding Sheet Auth Overlay - Notion Sheet Form */}
      {showAuthSheet && (
        <Animated.View
          style={[
            styles.backdropOverlay,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.dismissBackdrop}
            activeOpacity={1}
            onPress={closeAuthSheet}
          />
          <Animated.View
            style={[
              styles.slidingAuthSheet,
              {
                transform: [{ translateY: sheetTranslateY }],
                paddingBottom: Math.max(insets.bottom, 28)
              }
            ]}
          >
            {/* Grab bar */}
            <View style={styles.sheetHandle} />

            {/* Close touch selector */}
            <TouchableOpacity onPress={closeAuthSheet} style={styles.closeSheetButton}>
              <Text style={styles.closeSheetText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.sheetCardInner}>
              {/* Notion segmented sign in tab */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, !isSignUp && styles.tabButtonActive]}
                  onPress={() => { setIsSignUp(false); setError(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabButtonText, !isSignUp && styles.tabButtonTextActive]}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, isSignUp && styles.tabButtonActive]}
                  onPress={() => { setIsSignUp(true); setError(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabButtonText, isSignUp && styles.tabButtonTextActive]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetSubtitle}>
                {isSignUp
                  ? 'Join TELO today to collaborate in real-time.'
                  : 'Enter your credentials to access your workspace.'}
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              {/* Form Input fields */}
              <View style={styles.form}>
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Alex Chen"
                      placeholderTextColor={Colors.textTertiary}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      autoComplete="name"
                      editable={!isLoading}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isLoading}
                  />
                </View>

                <Animated.View style={{ transform: [{ scale: pressScale }] }}>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.9}
                    disabled={isLoading}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <View style={styles.googleIconWrap}>
                  <GoogleIcon size={20} />
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <Text style={styles.legalNote}>
                By continuing, you agree to TELO's{' '}
                <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
                <Text style={styles.legalLink}>Privacy Policy</Text>.
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {isLoading && <AuthLoadingOverlay message={loadingMessage} />}
    </SafeAreaView>
  );
}

// ─── Carousel Graphics Visual Styles ──────────────────────────────────────────
const slideStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 20,
    width: SCREEN_WIDTH - 64,
    height: 200,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    justifyContent: 'center',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  emoji: {
    fontSize: 18,
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
  },
  todoList: {
    gap: 10,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todoCheck: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 16,
    overflow: 'hidden',
  },
  completed: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
  },
  todoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  todoBulletActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.indigo,
  },
  activeText: {
    color: '#1A1A1A',
    fontWeight: FontWeight.semibold,
  },
  todoBulletPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  pendingText: {
    color: '#64748B',
  },
  baseDocCard: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  docLineShort: {
    height: 6,
    width: '45%',
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginBottom: 10,
  },
  docLineLong: {
    height: 6,
    width: '85%',
    backgroundColor: '#F8FAFC',
    borderRadius: 3,
    marginBottom: 8,
  },
  commentCard: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 48,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commentEmoji: {
    fontSize: 12,
  },
  commentAuthor: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.charcoal,
  },
  commentBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  calendarHeader: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  calendarMonth: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#64748B',
    letterSpacing: 1,
  },
  calendarBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    gap: 20,
  },
  calendarTile: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 24,
  },
  calendarDayLabel: {
    fontSize: 9,
    fontWeight: FontWeight.medium,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  eventContainer: {
    flex: 1,
    gap: 6,
  },
  eventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.indigo,
  },
  eventText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#4F46E5',
  },
  eventTime: {
    fontSize: 12,
    color: '#64748B',
  },
});

// ─── Main Dribbble Screen Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  contentCanvas: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  topLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 20,
    gap: 6,
  },
  logoMark: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  logoText: {
    fontSize: 18,
    fontWeight: FontWeight.extrabold,
    color: '#1A1A1A',
    letterSpacing: 2,
  },
  carouselOuter: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  welcomeTextSection: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 42,
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#737373',
    lineHeight: 22,
    marginTop: 12,
    fontWeight: '400',
  },
  actionButtonsArea: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4D4D4',
  },
  dotActive: {
    backgroundColor: '#1A1A1A',
    width: 14,
  },
  notionPillButton: {
    backgroundColor: '#000000',
    borderRadius: 28,
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  notionPillButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  signInLink: {
    paddingVertical: 6,
  },
  signInLinkText: {
    fontSize: FontSize.sm,
    color: '#737373',
    fontWeight: FontWeight.semibold,
  },

  // ─── Sliding Auth Sheet styles ──────────────────────────────────────────────
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 150,
    justifyContent: 'flex-end',
  },
  dismissBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  slidingAuthSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeSheetButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },
  closeSheetText: {
    fontSize: 14,
    color: '#737373',
    fontWeight: FontWeight.medium,
  },
  sheetCardInner: {
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F5F7',
    padding: 3,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    maxWidth: 240,
    alignSelf: 'center',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
  },
  tabButtonTextActive: {
    color: '#000000',
    fontWeight: FontWeight.bold,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: FontSize.base,
    color: '#1A1A1A',
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFEFEF',
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    color: '#737373',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingVertical: 13,
    gap: 12,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  legalNote: {
    fontSize: 11,
    color: '#A3A3A3',
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  legalLink: {
    color: Colors.indigo,
    fontWeight: FontWeight.semibold,
  },
});
