import os
import sys
import cv2
import time
from ultralytics import YOLO

# ─────────────────────────────────────────────────────────
#  SAFETY HELMET DETECTION - Real-Time Application
# ─────────────────────────────────────────────────────────

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(PROJECT_ROOT, "output", "best.pt")

# Class colors (BGR)
CLASS_COLORS = {
    0: (0, 200, 0),      # helmet  -> Green
    1: (0, 0, 255),      # head    -> Red (DANGER)
    2: (255, 180, 0),    # person  -> Blue-ish Orange
}
CLASS_NAMES = ['helmet', 'head', 'person']


def load_model():

    """Load the YOLO model."""
    if not os.path.exists(MODEL_PATH):
        print(f"\n  [ERROR] Model not found at: {MODEL_PATH}")
        print("  Please ensure 'best.pt' exists in the output/ folder.")
        sys.exit(1)

    print(f"  Loading model from: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print("  Model loaded successfully!\n")
    return model


def draw_detections(frame, results, threshold=0.45):
    """Draw bounding boxes and labels on frame."""
    helmet_count = 0
    head_count = 0
    person_count = 0

    for det in results.boxes.data.tolist():
        x1, y1, x2, y2, score, class_id = det
        class_id = int(class_id)

        if score < threshold:
            continue

        if class_id == 0:
            helmet_count += 1
        elif class_id == 1:
            head_count += 1
        elif class_id == 2:
            person_count += 1

        color = CLASS_COLORS.get(class_id, (255, 255, 255))
        label = CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"cls_{class_id}"
        label_text = f"{label.upper()} {score:.2f}"

        # Bounding box
        thickness = 2
        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness)

        # Label background
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        (tw, th), baseline = cv2.getTextSize(label_text, font, font_scale, 2)
        cv2.rectangle(frame, (int(x1), int(y1) - th - 8), (int(x1) + tw + 4, int(y1)), color, -1)
        cv2.putText(frame, label_text, (int(x1) + 2, int(y1) - 4), font, font_scale, (255, 255, 255), 2, cv2.LINE_AA)

    return frame, helmet_count, head_count, person_count


def draw_dashboard(frame, fps, helmet_count, head_count, person_count):
    """Draw a status dashboard overlay on the frame."""
    h, w = frame.shape[:2]

    # Semi-transparent dark panel at top
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 70), (30, 30, 30), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

    # Title
    cv2.putText(frame, "SAFETY HELMET DETECTION", (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

    # FPS
    cv2.putText(frame, f"FPS: {fps:.0f}", (w - 120, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2, cv2.LINE_AA)

    # Stats bar
    stats_x = 10
    stats_y = 55

    # Helmet count (green)
    cv2.putText(frame, f"Helmets: {helmet_count}", (stats_x, stats_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 200, 0), 2, cv2.LINE_AA)

    # Head count (red - warning)
    cv2.putText(frame, f"No Helmet: {head_count}", (stats_x + 180, stats_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2, cv2.LINE_AA)

    # Person count
    cv2.putText(frame, f"Persons: {person_count}", (stats_x + 390, stats_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 180, 0), 2, cv2.LINE_AA)

    # Warning banner if heads without helmets detected
    if head_count > 0:
        banner_y = h - 50
        cv2.rectangle(frame, (0, banner_y), (w, h), (0, 0, 200), -1)
        warning_text = f"WARNING: {head_count} WORKER(S) WITHOUT HELMET!"
        (tw, _), _ = cv2.getTextSize(warning_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
        text_x = (w - tw) // 2
        cv2.putText(frame, warning_text, (text_x, banner_y + 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)

    return frame


def try_open_camera():
    """Try to open camera with multiple backends and indices."""
    # Windows backends to try in order
    backends = [
        (cv2.CAP_DSHOW, "DirectShow"),
        (cv2.CAP_MSMF, "MSMF"),
        (cv2.CAP_ANY, "Default"),
    ]
    indices = [0, 1, 2]

    for idx in indices:
        for backend, name in backends:
            print(f"  Trying camera index {idx} with {name} backend...", end=" ")
            cap = cv2.VideoCapture(idx, backend)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    print("SUCCESS!")
                    return cap
                else:
                    cap.release()
                    print("no frame")
            else:
                print("failed")

    return None


def run_stream(model, source):
    """Run real-time detection on any video source (webcam, IP cam, etc)."""
    if isinstance(source, str):
        # IP camera or URL
        print(f"  Connecting to: {source}")
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            print("  [ERROR] Could not connect to camera stream.")
            print("  Check the URL and make sure the app is running.")
            return
        print("  Connected successfully!")
    else:
        # Already opened cv2.VideoCapture object
        cap = source

    # Set camera resolution for smoother performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    prev_time = time.time()
    fps = 0

    print("\n  Camera/Stream opened successfully!")
    print("  Controls:")
    print("    Q / ESC  - Quit")
    print("    S        - Save screenshot")
    print("")

    screenshot_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("  [WARNING] Failed to read frame. Retrying...")
            time.sleep(0.1)
            continue

        # Run detection
        results = model(frame, verbose=False)[0]
        frame, hc, hdc, pc = draw_detections(frame, results)

        # Calculate FPS
        curr_time = time.time()
        fps = 1.0 / (curr_time - prev_time) if (curr_time - prev_time) > 0 else 0
        prev_time = curr_time

        # Draw dashboard
        frame = draw_dashboard(frame, fps, hc, hdc, pc)

        # Show frame
        cv2.imshow("Safety Helmet Detection - Live", frame)

        # Key handling
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q') or key == 27:  # Q or ESC
            break
        elif key == ord('s') or key == ord('S'):
            screenshot_count += 1
            save_path = os.path.join(PROJECT_ROOT, "test_output", f"screenshot_{screenshot_count}.jpg")
            cv2.imwrite(save_path, frame)
            print(f"  Screenshot saved: {save_path}")

    cap.release()
    cv2.destroyAllWindows()
    print("\n  Camera/Stream closed.")


def run_camera(model):
    """Run real-time detection using webcam."""
    print("  Detecting webcam...\n")

    cap = try_open_camera()
    if cap is None:
        print("\n  [ERROR] No webcam detected on this device.")
        print("  ─────────────────────────────────────────")
        print("  TIP: Use your Phone as a webcam!")
        print("    1. Install 'IP Webcam' app (Android) or 'EpocCam' (iPhone)")
        print("    2. Start the stream in the app")
        print("    3. Use Option [3] from the menu with the stream URL")
        print("    Example URL: http://192.168.1.5:8080/video")
        print("  ─────────────────────────────────────────")
        return

    run_stream(model, cap)


def run_video(model, video_path):
    """Run detection on a video file."""
    if not os.path.exists(video_path):
        print(f"\n  [ERROR] Video file not found: {video_path}")
        return

    print(f"  Opening video: {video_path}")
    print("  Controls:")
    print("    Q / ESC  - Quit")
    print("    SPACE    - Pause/Resume")
    print("    S        - Save screenshot")
    print("")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("  [ERROR] Could not open video file.")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    print(f"  Video info: {w}x{h}, {video_fps} FPS, {total_frames} frames")

    # Output video
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    output_path = os.path.join(PROJECT_ROOT, "test_output", f"{video_name}_detected.mp4")
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), video_fps, (w, h))

    prev_time = time.time()
    fps = 0
    frame_count = 0
    paused = False
    screenshot_count = 0

    while True:
        if not paused:
            ret, frame = cap.read()
            if not ret:
                print(f"\n  Video finished! ({frame_count} frames processed)")
                break

            frame_count += 1

            # Run detection
            results = model(frame, verbose=False)[0]
            frame, hc, hdc, pc = draw_detections(frame, results)

            # Calculate FPS
            curr_time = time.time()
            fps = 1.0 / (curr_time - prev_time) if (curr_time - prev_time) > 0 else 0
            prev_time = curr_time

            # Draw dashboard
            frame = draw_dashboard(frame, fps, hc, hdc, pc)

            # Progress info on frame
            progress = f"Frame: {frame_count}/{total_frames}"
            cv2.putText(frame, progress, (w - 250, 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

            # Write to output
            out.write(frame)

            # Print progress
            if frame_count % 50 == 0:
                pct = (frame_count / total_frames) * 100 if total_frames > 0 else 0
                print(f"  Progress: {frame_count}/{total_frames} ({pct:.1f}%)", end='\r')

        # Show frame
        cv2.imshow("Safety Helmet Detection - Video", frame)

        # Key handling
        wait_time = 1
        key = cv2.waitKey(wait_time) & 0xFF
        if key == ord('q') or key == ord('Q') or key == 27:
            print(f"\n  Stopped at frame {frame_count}/{total_frames}")
            break
        elif key == ord(' '):  # Space to pause
            paused = not paused
            state = "PAUSED" if paused else "PLAYING"
            print(f"\n  [{state}]")
        elif key == ord('s') or key == ord('S'):
            screenshot_count += 1
            save_path = os.path.join(PROJECT_ROOT, "test_output", f"video_screenshot_{screenshot_count}.jpg")
            cv2.imwrite(save_path, frame)
            print(f"\n  Screenshot saved: {save_path}")

    cap.release()
    out.release()
    cv2.destroyAllWindows()
    print(f"\n  Output saved to: {output_path}")


def show_menu():
    """Display the main menu."""
    print("\n")
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║          SAFETY HELMET DETECTION SYSTEM              ║")
    print("  ║                                                      ║")
    print("  ║   Detects: Helmet | Head (No Helmet) | Person        ║")
    print("  ╠══════════════════════════════════════════════════════╣")
    print("  ║                                                      ║")
    print("  ║   [1]  Use Camera (Webcam)                           ║")
    print("  ║   [2]  Use Video File                                ║")
    print("  ║   [3]  Use Phone/IP Camera (stream URL)              ║")
    print("  ║   [4]  Exit                                          ║")
    print("  ║                                                      ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print("")


def main():
    show_menu()

    # Load model once
    model = load_model()

    while True:
        choice = input("  Enter your choice (1/2/3/4): ").strip()

        if choice == '1':
            print("\n  ── Camera Mode ──")
            run_camera(model)
            show_menu()

        elif choice == '2':
            print("\n  ── Video Mode ──")
            video_path = input("  Enter video file path: ").strip()

            # Remove quotes if user wraps path in them
            video_path = video_path.strip('"').strip("'")

            # Check if relative path, try from project root
            if not os.path.isabs(video_path):
                video_path = os.path.join(PROJECT_ROOT, video_path)

            run_video(model, video_path)
            show_menu()

        elif choice == '3':
            print("\n  ── Phone/IP Camera Mode ──")
            print("  For Android: Install 'IP Webcam' app, start server")
            print("  Example URL: http://192.168.1.5:8080/video")
            print("")
            url = input("  Enter stream URL: ").strip().strip('"').strip("'")
            if url:
                run_stream(model, url)
            else:
                print("  No URL entered.")
            show_menu()

        elif choice == '4':
            print("\n  Goodbye!\n")
            break

        else:
            print("  Invalid choice. Please enter 1, 2, 3, or 4.")


if __name__ == "__main__":
    main()
