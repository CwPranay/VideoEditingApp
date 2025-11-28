import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView } from "react-native";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import apiClient from "../api/apiClient";
import uuid from "react-native-uuid";

export default function VideoEditor() {
  const [video, setVideo] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [textInput, setTextInput] = useState("");

  // pick video
  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });
    if (!result.canceled) setVideo(result.assets[0]);
  };

  // Add text overlay
  const addText = () => {
    if (!textInput) return;
    setOverlays([
      ...overlays,
      {
        id: uuid.v4(),
        type: "text",
        content: textInput,
        x: 50,
        y: 50,
        start: 0,
        end: 5,
      },
    ]);
    setTextInput("");
  };

  // Add image overlay
  const addImage = async () => {
    let pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!pick.canceled) {
      setOverlays([
        ...overlays,
        {
          id: uuid.v4(),
          type: "image",
          content: pick.assets[0].uri,
          x: 80,
          y: 80,
          start: 0,
          end: 5,
        },
      ]);
    }
  };

  // Submit to backend
  const submit = async () => {
    if (!video) return alert("Pick a video first.");

    const formData = new FormData();
    formData.append("file", {
      uri: video.uri,
      name: "video.mp4",
      type: "video/mp4",
    });

    formData.append("metadata", JSON.stringify(overlays));

    try {
      await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Uploaded successfully!");
    } catch (err) {
      console.log(err);
      alert("Upload failed.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Video preview */}
      <View style={styles.videoBox}>
        {video ? (
          <Video
            source={{ uri: video.uri }}
            style={{ width: "100%", height: "100%" }}
            useNativeControls
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.placeholder}>No video selected</Text>
        )}

        {/* Overlays preview */}
        {overlays.map((item) => (
          <View key={item.id} style={[styles.overlay, { top: item.y, left: item.x }]}>
            {item.type === "text" && <Text style={styles.overlayText}>{item.content}</Text>}
            {item.type === "image" && <Image source={{ uri: item.content }} style={styles.overlayImage} />}
          </View>
        ))}
      </View>

      {/* controls */}
      <TouchableOpacity style={styles.btn} onPress={pickVideo}>
        <Text style={styles.btnTxt}>Pick Video</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Enter overlay text"
        value={textInput}
        onChangeText={setTextInput}
        style={styles.input}
      />

      <TouchableOpacity style={styles.btn} onPress={addText}>
        <Text style={styles.btnTxt}>Add Text Overlay</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={addImage}>
        <Text style={styles.btnTxt}>Add Image Overlay</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={submit}>
        <Text style={styles.btnTxt}>Submit To Backend</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, backgroundColor: "#111" },
  videoBox: {
    width: "100%",
    height: 300,
    backgroundColor: "#222",
    marginBottom: 20,
    position: "relative",
  },
  placeholder: { color: "#888", textAlign: "center", marginTop: 120 },
  overlay: {
    position: "absolute",
  },
  overlayText: {
    color: "yellow",
    fontWeight: "bold",
    fontSize: 20,
  },
  overlayImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  btn: {
    padding: 12,
    backgroundColor: "#0277BD",
    marginVertical: 5,
    borderRadius: 6,
  },
  submitBtn: {
    padding: 14,
    backgroundColor: "#00C853",
    marginVertical: 15,
    borderRadius: 6,
  },
  btnTxt: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
