# Custom Subathon Countdown Timer Widget

A fully customizable **Subathon Countdown Timer** widget for [StreamElements](https://streamelements.com/) overlays, designed for Twitch streamers.  
It features:
- A large countdown timer that increases with subs, gifts, donations, or cheers.
- Configurable **time additions** for each event type.
- **Special event counter** with dynamic circular image and overlaid text.
- Rotating **hint text** with fade animations to show how much time is added for each action.
- Pirate-themed frame design with optional kraken art and color scheme.

---

## Features
- **Live Subathon Countdown** – Add minutes or seconds based on user actions.
- **Special Event Tracker** – Track large gifts (e.g., 50+ total gifted subs).
- **Dynamic Image & Text** – Configure through StreamElements widget settings.
- **CSS Animations** – Smooth fade transitions for hint messages.
- Fully customizable through HTML/CSS/JS in the StreamElements editor.

---

## How to Use

### 1. Create a New Overlay in StreamElements
1. Go to [StreamElements Overlays](https://streamelements.com/dashboard/overlays).
2. Click **"Create Blank Overlay"**.
3. Set your base resolution (1920x1080 is standard for OBS scenes).

### 2. Add the Custom Widget
1. Click **"Add Widget"** → **"Static / Custom"** → **"Custom Widget"**.
2. In the widget editor:
   - Replace the **HTML**, **CSS**, and **JavaScript** tabs with the files from this repository.
   - Update the **Fields** tab with the provided JSON configuration.
3. Save the widget.

### 3. Import into OBS
1. In OBS Studio, add a **Browser Source** to your scene.
2. Paste the **overlay URL** from your StreamElements overlay into the browser source URL field.
3. Set the width/height to match your overlay (e.g., 1920x1080).
4. Position and scale the widget wherever you like on your stream.

---

## Notes
- The widget listens for Twitch events through StreamElements in real-time.
- Special event logic (e.g., large gift detection) can be configured in the JS file.
- Image uploads for the **special counter image** are done in the widget settings under `image-input`.
