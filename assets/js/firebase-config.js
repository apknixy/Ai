// assets/js/firebase-config.js

// Import and configure Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ───────────────────────────────────────────────────────────────────────────────
// 1) Initialize Firebase
// ───────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBnbLZ6GQgRDMurhcGAJ5KseTrFPNq3-js",
  authDomain: "airaview.firebaseapp.com",
  databaseURL: "https://airaview-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "airaview",
  storageBucket: "airaview.appspot.com",
  messagingSenderId: "547164172741",
  appId: "1:547164172741:web:9ffc76f0522610d91b9bac"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Export providers for login
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Utility: ensure user’s channel name is unique
export async function checkChannelName(channelName) {
  const channelRef = ref(database, `channels/${channelName}`);
  return new Promise((resolve) => {
    onValue(
      channelRef,
      (snapshot) => {
        resolve(snapshot.exists());
      },
      { onlyOnce: true }
    );
  });
}

// Utility: create or update channel info
export async function registerChannel(channelName, data) {
  await set(ref(database, `channels/${channelName}`), data);
}

// Utility: read video list (all videos and shorts)
export function fetchVideos(callback) {
  const videosRef = ref(database, "videos");
  onValue(videosRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
}

// Utility: push new video/short
export async function uploadMedia(mediaObj) {
  const newRef = push(ref(database, "videos"));
  await set(newRef, mediaObj);
  return newRef.key;
}

// Utility: increment view count
export async function incrementViewCount(videoKey, currentCount) {
  await update(ref(database, `videos/${videoKey}`), {
    viewCount: currentCount + 1
  });
}

// Utility: fetch single video details
export function fetchVideo(videoKey, callback) {
  const vidRef = ref(database, `videos/${videoKey}`);
  onValue(vidRef, (snapshot) => {
    callback(snapshot.val());
  });
}

// Utility: post a comment
export async function postComment(videoKey, commentObj) {
  const newRef = push(ref(database, `comments/${videoKey}`));
  await set(newRef, commentObj);
}

// Utility: fetch comments for a video
export function fetchComments(videoKey, callback) {
  const cRef = ref(database, `comments/${videoKey}`);
  onValue(cRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
}

// Utility: like a video
export async function likeVideo(videoKey, userEmail) {
  await set(ref(database, `likes/${videoKey}/${userEmail.replace(/\./g, "_")}`), true);
}
