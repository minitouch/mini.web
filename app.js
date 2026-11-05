import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
import { getDatabase, ref, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

let redirectTimeout;
window.dynamicTargetUrl = ""; 

function startRedirectTimer() { 
    clearTimeout(redirectTimeout);
    if (!window.dynamicTargetUrl) return; 
    redirectTimeout = setTimeout(function() { 
        if (navigator.onLine && window.dynamicTargetUrl) {
            window.location.href = window.dynamicTargetUrl; 
        }
    }, 10000); 
}

function checkInternet() {
    const offlineNotice = document.getElementById('offlineNotice');
    const normalContent = document.getElementById('normalContent');
    if (!navigator.onLine) {
        clearTimeout(redirectTimeout); 
        if (offlineNotice) offlineNotice.style.display = 'block'; 
        if (normalContent) normalContent.style.display = 'none';
    } else {
        if (offlineNotice) offlineNotice.style.display = 'none'; 
        if (normalContent) normalContent.style.display = 'block'; 
        startRedirectTimer();
    }
}

window.onload = function() { checkInternet(); };
window.addEventListener('online', checkInternet); 
window.addEventListener('offline', checkInternet);

const handleVideoScale = function() {
    const width = this.videoWidth;
    const height = this.videoHeight;
    
    if (height > width) {
        this.style.width = 'auto';
        this.style.height = 'auto';
        this.style.maxHeight = '350px'; 
        this.style.margin = '0 auto'; 
        this.style.display = 'block';
        this.style.aspectRatio = 'auto';
    } else {
        this.style.width = '100%';
        this.style.height = 'auto';
        this.style.maxHeight = 'none';
        this.style.aspectRatio = '16/9';
    }
};

const myVideoPlayer = document.getElementById('myVideoPlayer');
if (myVideoPlayer) {
    myVideoPlayer.onloadedmetadata = handleVideoScale;
}

const mediaVideo = document.getElementById('mediaVideo');
if (mediaVideo) {
    mediaVideo.onloadedmetadata = handleVideoScale;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-rvwlsYHk5T-6Z0qsXfk2Mk1Xtxh4fXE",
  authDomain: "imovisitors.firebaseapp.com",
  databaseURL: "https://imovisitors-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "imovisitors",
  storageBucket: "imovisitors.firebasestorage.app",
  messagingSenderId: "159209243974",
  appId: "1:159209243974:web:8b1c143d27c5e638f75147",
  measurementId: "G-6VRYVK38KE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search);
let pageId = urlParams.get('id');

if (!pageId || pageId.trim() === '') { 
    pageId = '1'; 
}

const pageRef = ref(db, 'dynamic_pages/' + pageId);

const dateObj = new Date();
const todayDate = dateObj.toISOString().split('T')[0]; 
const currentMonth = todayDate.substring(0, 7); 

if (navigator.onLine) {
  runTransaction(pageRef, (currentData) => {
    if (currentData === null) {
      let initialData = {
        site_name: "",
        logo_url: "",
        redirect_url: "",
        video_url: "", 
        extra_media_url: "", 
        total: 1,
        months: {},
        days: {}
      };
      initialData.months[currentMonth] = 1;
      initialData.days[todayDate] = 1;
      return initialData;
    } else {
      currentData.total = (currentData.total || 0) + 1;
      if (!currentData.months) currentData.months = {};
      if (!currentData.days) currentData.days = {};
      
      currentData.months[currentMonth] = (currentData.months[currentMonth] || 0) + 1;
      currentData.days[todayDate] = (currentData.days[todayDate] || 0) + 1;
      return currentData;
    }
  });
}

onValue(pageRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
      if (data.site_name) {
          const siteBrowserTitle = document.getElementById('siteBrowserTitle');
          const dynamicHeading = document.getElementById('dynamicHeading');
          const subText = document.getElementById('subText');

          if (siteBrowserTitle) siteBrowserTitle.innerText = data.site_name;
          if (dynamicHeading) dynamicHeading.innerHTML = `<br>${data.site_name}<br>প্রবেশ করা হচ্ছে<br>10 সেকেন্ড অপেক্ষা করুন।`;
          if (subText) subText.style.display = 'block';
      }

      if (data.logo_url && data.logo_url.trim() !== "") { 
          const logoImg = document.getElementById('dynamicLogo');
          if (logoImg) {
              logoImg.src = data.logo_url; 
              logoImg.style.display = 'block';
          }
      }
      
      const visToday = document.getElementById('vis-today');
      const visMonth = document.getElementById('vis-month');
      const visTotal = document.getElementById('vis-total');

      if (visToday) visToday.innerText = (data.days && data.days[todayDate]) ? data.days[todayDate] : 1;
      if (visMonth) visMonth.innerText = (data.months && data.months[currentMonth]) ? data.months[currentMonth] : 1;
      if (visTotal) visTotal.innerText = data.total || 1;
      
      if (data.redirect_url && data.redirect_url.trim() !== "") {
          window.dynamicTargetUrl = data.redirect_url;
          const rBtn = document.getElementById('redirectBtn');
          if (rBtn) {
              rBtn.href = window.dynamicTargetUrl;
              rBtn.style.display = 'inline-block';
          }
          startRedirectTimer();
      }

      if (data.video_url && data.video_url.trim() !== "") {
          const videoContainer = document.getElementById('videoContainer');
          const videoPlayer = document.getElementById('myVideoPlayer');
          if (videoContainer) videoContainer.style.display = 'block';

          if (videoPlayer) {
              if (data.video_url.includes('.m3u8')) {
                  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                      const hls = new Hls();
                      hls.loadSource(data.video_url);
                      hls.attachMedia(videoPlayer);
                  } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                      videoPlayer.src = data.video_url;
                  }
              } else {
                  videoPlayer.src = data.video_url;
              }
          }
      }

      if (data.extra_media_url && data.extra_media_url.trim() !== "") {
          const mediaBoxContainer = document.getElementById('mediaBoxContainer');
          const mediaImage = document.getElementById('mediaImage');
          const mediaVideo = document.getElementById('mediaVideo');
          const mediaYoutube = document.getElementById('mediaYoutube');
          
          if (mediaBoxContainer) mediaBoxContainer.style.display = 'block';
          
          if (mediaImage) mediaImage.style.display = 'none';
          if (mediaVideo) mediaVideo.style.display = 'none';
          if (mediaYoutube) mediaYoutube.style.display = 'none';
          
          const rawUrl = data.extra_media_url.trim();
          const lowerUrl = rawUrl.toLowerCase();
          
          if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
              if (mediaYoutube) {
                  mediaYoutube.style.display = 'block';
                  mediaYoutube.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(rawUrl) + '&show_text=false';
              }
          }
          else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
              if (mediaYoutube) {
                  mediaYoutube.style.display = 'block';
                  const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|.*[?&]v=))([\w-]{11})/i;
                  const match = rawUrl.match(ytRegex);
                  
                  if (match && match[1]) {
                      mediaYoutube.src = 'https://www.youtube.com/embed/' + match[1];
                  }
              }
          } 
          else if (lowerUrl.includes('.mp4') || lowerUrl.includes('.m3u8') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg')) {
              if (mediaVideo) {
                  mediaVideo.style.display = 'block';
                  if (lowerUrl.includes('.m3u8')) {
                      if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                          const mediaHls = new Hls();
                          mediaHls.loadSource(rawUrl);
                          mediaHls.attachMedia(mediaVideo);
                      } else if (mediaVideo.canPlayType('application/vnd.apple.mpegurl')) {
                          mediaVideo.src = rawUrl;
                      }
                  } else {
                      mediaVideo.src = rawUrl;
                  }
              }
          } 
          else {
              if (mediaImage) {
                  mediaImage.style.display = 'block';
                  mediaImage.src = rawUrl;

                  mediaImage.onload = function() {
                      const width = this.naturalWidth;
                      const height = this.naturalHeight;
                      
                      if (height > width) {
                          this.style.width = 'auto';
                          this.style.height = 'auto';
                          this.style.maxHeight = '350px'; 
                          this.style.margin = '0 auto'; 
                          this.style.display = 'block';
                      } 
                      else {
                          this.style.width = '100%';
                          this.style.height = 'auto';
                          this.style.maxHeight = 'none';
                      }
                  };
              }
          }
      } else {
          const mediaBoxContainer = document.getElementById('mediaBoxContainer');
          if (mediaBoxContainer) mediaBoxContainer.style.display = 'none';
      }
  }
});
