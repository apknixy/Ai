// assets/js/main.js
import {
  auth,
  database,
  googleProvider,
  facebookProvider,
  checkChannelName,
  registerChannel,
  fetchVideos,
  uploadMedia,
  fetchVideo,
  incrementViewCount,
  postComment,
  fetchComments,
  likeVideo
} from "./firebase-config.js";

// ───────────────────────────────────────────────────────────────────────────────
// UTILITY: Show Adsterra popup / banner / native ads in any div/container
// Place these calls wherever you want to show ads.
//
// Example: showBannerAd("ad-container-468x60");
// ───────────────────────────────────────────────────────────────────────────────
export function showPopunderAd() {
  const script = document.createElement("script");
  script.src = "//pl26835142.profitableratecpm.com/db/27/6d/db276d3b5f1289379bbe5d365485ac52.js";
  document.body.appendChild(script);
}

export function showNativeAd() {
  const script = document.createElement("script");
  script.setAttribute("async", "async");
  script.setAttribute("data-cfasync", "false");
  script.src = "//pl26835150.profitableratecpm.com/39628927897b21d6c45567203000ccc6/invoke.js";
  document.getElementById("ad-native").appendChild(script);
}

export function showDirectLinkAd() {
  window.open("https://www.profitableratecpm.com/ekqigjxxf?key=7cc9b0386975c414c8ab9629f405b0dc", "_blank");
}

export function showSocialBarAd() {
  const script = document.createElement("script");
  script.src = "//pl26835180.profitableratecpm.com/51/87/c3/5187c39d0d72d45de29e9c62b51aaba2.js";
  document.getElementById("ad-socialbar").appendChild(script);
}

export function showBannerAd468x60() {
  const script = document.createElement("script");
  script.text = `
    atOptions = {
      'key' : '7281653bd62d5d460d6daa8793f19c5e',
      'format' : 'iframe',
      'height' : 60,
      'width' : 468,
      'params' : {}
    };`;
  document.getElementById("ad-468x60").appendChild(script);

  const script2 = document.createElement("script");
  script2.src = "//www.highperformanceformat.com/7281653bd62d5d460d6daa8793f19c5e/invoke.js";
  document.getElementById("ad-468x60").appendChild(script2);
}

export function showBannerAd160x30() {
  const script = document.createElement("script");
  script.text = `
    atOptions = {
      'key' : 'bc56d12282cadec7b8753ae823c22319',
      'format' : 'iframe',
      'height' : 300,
      'width' : 160,
      'params' : {}
    };`;
  document.getElementById("ad-160x30").appendChild(script);

  const script2 = document.createElement("script");
  script2.src = "//www.highperformanceformat.com/bc56d12282cadec7b8753ae823c22319/invoke.js";
  document.getElementById("ad-160x30").appendChild(script2);
}

export function showBannerAd320x50() {
  const script = document.createElement("script");
  script.text = `
    atOptions = {
      'key' : 'f4fd46187fcf3a252df23d7277e02fd7',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };`;
  document.getElementById("ad-320x50").appendChild(script);

  const script2 = document.createElement("script");
  script2.src = "//www.highperformanceformat.com/f4fd46187fcf3a252df23d7277e02fd7/invoke.js";
  document.getElementById("ad-320x50").appendChild(script2);
}

// ───────────────────────────────────────────────────────────────────────────────
// PAGE-SPECIFIC CODE
// ───────────────────────────────────────────────────────────────────────────────

/* ======================================
   1) LOGIN / CHANNEL-RESERVATION (index.html)
   ====================================== */
export async function handleGoogleLogin() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const email = user.email;
    const displayName = user.displayName;
    const profilePic = user.photoURL;

    // Generate unique channelName from email
    let channelName = email.split("@")[0].replace(/\./g, "_");
    let exists = await checkChannelName(channelName);
    if (exists) {
      alert("Channel name “" + channelName + "” already taken. Please edit your email alias.");
      await signOut(auth);
      return;
    }

    // Save channel info
    await registerChannel(channelName, {
      email,
      displayName,
      profilePic,
      createdAt: Date.now(),
      totalViews: 0
    });

    // Save to localStorage & notify App Inventor
    const userInfo = { uid: user.uid, email, displayName, channelName };
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    if (window.AppInventor) {
      window.AppInventor.setWebViewString(JSON.stringify(userInfo));
    }
    // Redirect inside web to home.html
    window.location.href = "home.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
}

/* ======================================
   2) HOME SCREEN: List Videos & Shorts (home.html)
   ====================================== */
export function renderHomePage() {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    localStorage.removeItem("userInfo");
    window.location.href = "index.html";
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  if (!userInfo.email) {
    window.location.href = "index.html";
    return;
  }

  // Show welcome
  document.getElementById("welcomeMsg").innerText =
    "Welcome, " + userInfo.displayName;

  // Search functionality
  document.getElementById("searchBtn").addEventListener("click", () => {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    loadVideos((data) => {
      renderVideoGrid(data, query);
      renderShortsRow(data, query);
    });
  });

  // Initial load
  loadVideos((data) => {
    renderVideoGrid(data, "");
    renderShortsRow(data, "");
  });
}

// Helper: load videos from Firebase
function loadVideos(callback) {
  fetchVideos((data) => {
    // Convert to array of [key, obj]
    const arr = Object.entries(data).map(([key, obj]) => ({ key, ...obj }));
    // Separate into shorts (isShort: true) and normal (false)
    callback(arr);
  });
}

// Render grid of normal videos
function renderVideoGrid(videos, query) {
  const grid = document.getElementById("videoGrid");
  grid.innerHTML = "";
  videos
    .filter((v) => !v.isShort && (v.title.toLowerCase().includes(query) || (v.tags || "").toLowerCase().includes(query)))
    .forEach((video) => {
      const div = document.createElement("div");
      div.className = "thumb-card card";
      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${extractYouTubeID(video.link)}/hqdefault.jpg" alt="Thumbnail" />
        <div class="thumb-info">
          <h4>${video.title}</h4>
          <p>${video.channelName} · ${video.viewCount || 0} views · ${timeSince(video.createdAt)} ago</p>
        </div>`;
      div.addEventListener("click", () => {
        // Show video ad then open video page
        showBannerAd468x60();
        setTimeout(() => {
          window.location.href = `video.html?vid=${video.key}`;
        }, 2000); // 2-second ad delay
      });
      grid.appendChild(div);
    });
}

// Render a horizontal row of shorts
function renderShortsRow(videos, query) {
  const row = document.getElementById("shortsRow");
  row.innerHTML = "";
  let count = 0;
  videos
    .filter((v) => v.isShort && (v.title.toLowerCase().includes(query) || (v.tags || "").toLowerCase().includes(query)))
    .forEach((short, idx) => {
      const div = document.createElement("div");
      div.className = "shorts-card card";
      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${extractYouTubeID(short.link)}/mqdefault.jpg" alt="Short Thumbnail" />
        <div class="shorts-info">
          <h4>${short.title}</h4>
          <p>${short.channelName} · ${short.viewCount || 0} views</p>
        </div>`;
      div.addEventListener("click", () => {
        // 1 ad every 9 shorts
        if (idx % 9 === 0) {
          showBannerAd320x50();
        }
        setTimeout(() => {
          window.location.href = `video.html?vid=${short.key}`;
        }, 1500);
      });
      row.appendChild(div);
      count++;
    });
}

// Extract YouTube video ID from URL
function extractYouTubeID(url) {
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/;
  const match = url.match(regExp);
  return match ? match[1] : "";
}

// Convert timestamp to “x days ago”
function timeSince(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m";
  return Math.floor(seconds) + "s";
}

/* ======================================
   3) UPLOAD PAGE (upload.html)
   ====================================== */
export function setupUploadPage() {
  document.getElementById("uploadBtn").addEventListener("click", async () => {
    const title = document.getElementById("titleInput").value.trim();
    const description = document.getElementById("descInput").value.trim();
    const tags = document.getElementById("tagsInput").value.trim();
    const link = document.getElementById("linkInput").value.trim();
    const isShort = document.getElementById("mediaType").value === "short";

    if (title.length < 2 || title.length > 100) {
      alert("Title must be between 2–100 characters.");
      return;
    }
    if (description.length > 4000) {
      alert("Description can be up to 4000 characters.");
      return;
    }
    if (!link) {
      alert("You must provide a YouTube link (or short link).");
      return;
    }

    // Get currently logged-in user
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!userInfo.email) {
      window.location.href = "index.html";
      return;
    }

    // Prepare media object
    const mediaObj = {
      channelName: userInfo.channelName,
      uploaderEmail: userInfo.email,
      title,
      description,
      tags,
      link,
      isShort,
      createdAt: Date.now(),
      viewCount: 0
    };

    try {
      const newKey = await uploadMedia(mediaObj);
      alert("Upload successful! Video ID: " + newKey);
      document.getElementById("titleInput").value = "";
      document.getElementById("descInput").value = "";
      document.getElementById("tagsInput").value = "";
      document.getElementById("linkInput").value = "";
    } catch (err) {
      alert("Error uploading: " + err.message);
    }
  });
}

/* ======================================
   4) VIDEO PAGE (video.html)
   ====================================== */
export function setupVideoPage() {
  // Parse URL to get ?vid=VIDEO_KEY
  const params = new URLSearchParams(window.location.search);
  const videoKey = params.get("vid");
  if (!videoKey) {
    alert("No video selected.");
    window.location.href = "home.html";
    return;
  }

  // Fetch video data
  fetchVideo(videoKey, (video) => {
    if (!video) {
      alert("Video not found.");
      window.location.href = "home.html";
      return;
    }

    // Increment view count after 7% watch time
    const player = document.getElementById("ytPlayer");
    player.src = `https://www.youtube.com/embed/${extractYouTubeID(video.link)}?autoplay=1`;
    document.getElementById("videoTitle").innerText = video.title;
    document.getElementById("videoDesc").innerText = video.description;
    document.getElementById("videoStats").innerText =
      video.channelName + " · " + (video.viewCount || 0) + " views";

    // After 7% of total duration: increment view
    player.addEventListener("loadedmetadata", () => {
      const duration = player.duration || 0; // fallback
      const threshold = duration * 0.07 * 1000; // ms
      setTimeout(async () => {
        await incrementViewCount(videoKey, video.viewCount || 0);
        document.getElementById("videoStats").innerText =
          video.channelName + " · " + (video.viewCount + 1) + " views";
      }, threshold);
    });

    // Show popunder ad before play
    showPopunderAd();
    // After 30 seconds, show banner in-page
    setTimeout(() => showBannerAd320x50(), 30000);

    // Like button
    document.getElementById("likeBtn").addEventListener("click", async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      if (!userInfo.email) {
        alert("Please log in first.");
        window.location.href = "index.html";
        return;
      }
      await likeVideo(videoKey, userInfo.email);
      alert("You liked this video.");
    });

    // Comment
    document.getElementById("commentBtn").addEventListener("click", async () => {
      const commentText = document.getElementById("commentInput").value.trim();
      if (!commentText) {
        alert("Enter a comment first.");
        return;
      }
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const commentObj = {
        userEmail: userInfo.email,
        comment: commentText,
        timestamp: Date.now()
      };
      await postComment(videoKey, commentObj);
      document.getElementById("commentInput").value = "";
    });

    // Load comments
    fetchComments(videoKey, (data) => {
      const list = document.getElementById("commentsList");
      list.innerHTML = "";
      Object.values(data).forEach((c) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${c.userEmail}:</strong> ${c.comment}`;
        list.appendChild(li);
      });
    });

    // Related videos (simply re-use home list)
    loadVideos((allData) => {
      const related = document.getElementById("relatedList");
      related.innerHTML = "";
      allData
        .filter((v) => v.key !== videoKey && !v.isShort)
        .slice(0, 5)
        .forEach((v) => {
          const li = document.createElement("li");
          li.innerHTML = `<a href="video.html?vid=${v.key}">${v.title}</a>`;
          related.appendChild(li);
        });
    });
  });
}

/* ======================================
   5) PROFILE PAGE (profile.html)
   ====================================== */
export function setupProfilePage() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  if (!userInfo.email) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("uname").innerText = userInfo.channelName;
  document.getElementById("emailAddr").innerText = userInfo.email;
  document.getElementById("logoutProfileBtn").addEventListener("click", async () => {
    await signOut(auth);
    localStorage.removeItem("userInfo");
    window.location.href = "index.html";
  });

  // Show emoji picker for profile picture
  const emojis = ["😀","🎬","📽️","🎥","📸","🎵","🔥","⭐","🔥","🎉"];
  const picker = document.getElementById("emojiPicker");
  emojis.forEach((e) => {
    const btn = document.createElement("button");
    btn.textContent = e;
    btn.style.fontSize = "24px";
    btn.style.margin = "4px";
    btn.addEventListener("click", () => {
      document.getElementById("profilePic").innerText = e;
      // Save chosen emoji as profilePic in database
      const channelName = userInfo.channelName;
      update(ref(database, `channels/${channelName}`), { profilePic: e });
    });
    picker.appendChild(btn);
  });

  // Show channel info
  const channelRef = ref(database, `channels/${userInfo.channelName}`);
  onValue(channelRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    document.getElementById("profilePic").innerText = data.profilePic || "🙂";
    document.getElementById("channelDesc").innerText = data.channelDesc || "";
    document.getElementById("totalViews").innerText = `Total Views: ${data.totalViews || 0}`;
  });

  // Display user’s uploads
  loadVideos((allData) => {
    const myVideos = allData.filter((v) => v.uploaderEmail === userInfo.email);
    const vidList = document.getElementById("myUploads");
    vidList.innerHTML = "";
    myVideos.forEach((v) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="video.html?vid=${v.key}">${v.title}</a>`;
      vidList.appendChild(li);
    });
  });
}

/* ======================================
   6) ENTRY POINT: decide which page’s setup to run
   ====================================== */
window.addEventListener("load", () => {
  const path = window.location.pathname.split("/").pop();
  switch (path) {
    case "index.html":
    case "":
      // index.html: login
      document.querySelector(".btn.google").addEventListener("click", handleGoogleLogin);
      document.querySelector(".btn.facebook").addEventListener("click", async () => {
        try {
          const result = await signInWithPopup(auth, facebookProvider);
          const user = result.user;
          // same logic as Google
          const email = user.email;
          const displayName = user.displayName;
          const profilePic = user.photoURL;
          let channelName = email.split("@")[0].replace(/\./g, "_");
          const exists = await checkChannelName(channelName);
          if (exists) {
            alert("Channel “" + channelName + "” taken. Use another alias.");
            await signOut(auth);
            return;
          }
          await registerChannel(channelName, {
            email,
            displayName,
            profilePic,
            createdAt: Date.now(),
            totalViews: 0
          });
          const userInfo = { uid: user.uid, email, displayName, channelName };
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
          if (window.AppInventor) {
            window.AppInventor.setWebViewString(JSON.stringify(userInfo));
          }
          window.location.href = "home.html";
        } catch (err) {
          alert("Facebook Login Failed: " + err.message);
        }
      });
      break;

    case "home.html":
      renderHomePage();
      break;

    case "upload.html":
      setupUploadPage();
      break;

    case "video.html":
      setupVideoPage();
      break;

    case "profile.html":
      setupProfilePage();
      break;

    default:
      console.warn("No script for this page.");
  }
});
