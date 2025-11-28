import React, { useRef, useState } from 'react';
import { View, Text, Button, Image, TextInput, TouchableOpacity, PanResponder, Animated, StyleSheet, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import apiClient from '../api/apiClient';
import uuid from 'react-native-uuid';

function DraggableOverlay({ overlay, onUpdate }) {
  const pan = useRef(new Animated.ValueXY({ x: overlay.x || 0, y: overlay.y || 0 })).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: ()=> true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      overlay.x = (overlay.x || 0) + gesture.dx;
      overlay.y = (overlay.y || 0) + gesture.dy;
      onUpdate(overlay);
      pan.setValue({ x: overlay.x, y: overlay.y });
    },
  });

  return (
    <Animated.View style={[styles.overlay, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
      {overlay.type === 'text' ? <Text style={{ fontSize: 18 }}>{overlay.text}</Text> : null}
      {overlay.type === 'image' ? <Image source={{ uri: overlay.uri }} style={{ width: 100, height: 60 }} /> : null}
    </Animated.View>
  );
}

export default function VideoEditor() {
  const [videoUri, setVideoUri] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isUploading, setUploading] = useState(false);
  const videoRef = useRef();

  async function pickVideo() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos });
    if (!res.cancelled) setVideoUri(res.uri);
  }

  async function addTextOverlay() {
    if (!textInput) return Alert.alert('Enter text first');
    const id = uuid.v4();
    setOverlays(prev => [...prev, { id, type: 'text', text: textInput, x: 10, y: 10, start: 0, end: 3 }]);
    setTextInput('');
  }

  async function addImageOverlay() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.cancelled) {
      const id = uuid.v4();
      setOverlays(prev => [...prev, { id, type: 'image', uri: res.uri, x: 10, y: 10, start: 0, end: 3 }]);
    }
  }

  function updateOverlay(u) {
    setOverlays(prev => prev.map(p => p.id === u.id ? u : p));
  }

  async function handleSubmit() {
    if (!videoUri) return Alert.alert('Pick a video first');
    setUploading(true);
    try {
      const meta = overlays.map(o => ({
        id: o.id, type: o.type, x: o.x, y: o.y, start: o.start, end: o.end, text: o.text || null
      }));
      const res = await apiClient.uploadVideo({ videoUri, metadata: meta });
      Alert.alert('Job created', `job_id: ${res.job_id}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Upload failed', e.message || 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 12 }}>
      <Button title="Pick Video" onPress={pickVideo} />
      {videoUri && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Video ref={videoRef} source={{ uri: videoUri }} style={{ width: '100%', height: 300 }} useNativeControls resizeMode="contain" />
          <View style={{ position: 'absolute', top: 24, left: 0, right: 0, bottom: 0 }}>
            {overlays.map(o => <DraggableOverlay key={o.id} overlay={o} onUpdate={updateOverlay} />)}
          </View>
        </View>
      )}

      <View style={{ marginTop: 12 }}>
        <TextInput placeholder="Overlay text" value={textInput} onChangeText={setTextInput} style={styles.input} />
        <Button title="Add Text Overlay" onPress={addTextOverlay} />
        <View style={{ height: 8 }} />
        <Button title="Add Image Overlay" onPress={addImageOverlay} />
        <View style={{ height: 8 }} />
        <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={isUploading}>
          <Text style={{ color: '#fff' }}>{isUploading ? 'Uploading...' : 'Submit to backend'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', padding: 4, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 },
  input: { borderWidth: 1, padding: 8, marginBottom: 8 },
  submit: { backgroundColor: '#007bff', padding: 12, alignItems: 'center', marginTop: 12, borderRadius: 6 },
});
