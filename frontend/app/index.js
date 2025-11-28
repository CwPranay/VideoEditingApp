import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import VideoEditor from './components/VideoEditor';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <VideoEditor />
    </SafeAreaView>
  );
}
