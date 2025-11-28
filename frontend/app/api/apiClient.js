import axios from 'axios';
const API_BASE = 'http://10.0.2.2:8000'; // emulator/local: use 10.0.2.2 for Android emulator; use LAN IP for real device

async function uploadVideo({ videoUri, metadata }) {
  const form = new FormData();
  // fetch blob for expo uri
  const filename = videoUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `video/${match[1]}` : 'video/mp4';
  // For Expo, fetch the file as blob
  const res = await fetch(videoUri);
  const blob = await res.blob();
  form.append('file', { uri: videoUri, name: filename, type });
  form.append('metadata', JSON.stringify(metadata));

  const r = await axios.post(`${API_BASE}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data;
}

export default { uploadVideo };
