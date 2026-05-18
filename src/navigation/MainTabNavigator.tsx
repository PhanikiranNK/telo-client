import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TaskModal } from '../components/TaskModal';
import type { Message } from '../types';
import { Colors } from '../theme';

// For now TELO is single-screen post-auth: Dashboard + TaskModal overlay.
// Extend with createBottomTabNavigator if additional tabs are needed (Profile, Search).
export function MainTabNavigator() {
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskModalMessages, setTaskModalMessages] = useState<Message[]>([]);

  function openTaskModal(messages: Message[]) {
    setTaskModalMessages(messages);
    setTaskModalVisible(true);
  }

  function closeTaskModal() {
    setTaskModalVisible(false);
  }

  return (
    <View style={styles.root}>
      <DashboardScreen onOpenTaskModal={openTaskModal} />
      <TaskModal
        visible={taskModalVisible}
        messages={taskModalMessages}
        onClose={closeTaskModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});
