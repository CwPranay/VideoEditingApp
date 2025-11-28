import React, { useState } from "react";
import { View, Text, Button, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import Draggable from "react-native-draggable";
import { v4 as uuidv4 } from "uuid";
import apiClient from "../api/apiClient";

export default function VideoEditor() {
  const [videoUri, setVideoUri] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [text, setText] = useState("");

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const addTextOverlay = () => {
    setOverlays([
      ...overlays,
      {
        id: uuidv4(),
        type: "text",
        content: text || "Sample Text",
        x: 50,
        y: 50
      }
    ]);
  };

  const addImageOverlay = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setOverlays([
        ...overlays,
        {
          id: uuidv4(),
          type: "image",
          content: result.assets[0].uri,
          x: 80,
          y: 80,
        }
      ]);
    }
  };

  // ---- SEND TO BACKEND ----
  const submitToBackend = async () => {
    if (!videoUri) return alert("Pick a video first!");

    let metadata = overlays.map(o => ({
      id: o.id,
      type: o.type,
      content: o.content,
      x: o.x,
      y: o.y,
      start_time: 0,
      end_time: 5
    }));

    const form = new FormData();
    form.append("file", {
      uri: videoUri,
      type: "video/mp4",
      name: "video.mp4"
    });

    form.append("metadata", JSON.stringify(metadata));

    const res = await apiClient.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    alert("Uploaded! Job ID: " + res.data.job_id);
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.pickBtn} onPress={pickVideo}>
        <Text style={styles.pickText}>Pick a Video</Text>
      </TouchableOpacity>

      {videoUri && (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
          />

          {overlays.map((o) => (
            <Draggable
              key={o.id}
              x={o.x}
              y={o.y}
              onDragRelease={(e, gesture) => {
                o.x = gesture.moveX - 200;
                o.y = gesture.moveY - 200;
              }}
            >
              {o.type === "text" ? (
                <Text style={styles.overlayText}>{o.content}</Text>
              ) : (
                <Image source={{ uri: o.content }} style={styles.overlayImage} />
              )}
            </Draggable>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.smallBtn} onPress={addTextOverlay}>
        <Text style={styles.btnTxt}>Add Text Overlay</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.smallBtn} onPress={addImageOverlay}>
        <Text style={styles.btnTxt}>Add Image Overlay</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={submitToBackend}>
        <Text style={styles.submitTxt}>Submit to Backend</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f4f4f4", flex: 1 },
  pickBtn: { backgroundColor: "#007bff", padding: 12, borderRadius: 8 },
  pickText: { color: "white", textAlign: "center", fontWeight: "bold" },

  videoContainer: {
    marginTop: 20,
    width: "100%",
    height: 400,
    backgroundColor: "#000",
    position: "relative",
  },

  video: { width: "100%", height: "100%" },
  overlayText: {
    color: "yellow",
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  overlayImage: { width: 80, height: 80 },

  smallBtn: {
    backgroundColor: "orange",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  btnTxt: { textAlign: "center", color: "#fff" },

  submitBtn: {
    backgroundColor: "green",
    padding: 12,
    marginTop: 20,
    borderRadius: 8,
  },
  submitTxt: { textAlign: "center", color: "white", fontWeight: "bold" },
});
