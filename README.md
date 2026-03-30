# Orion

**Local audio transcription and AI summarization — record or upload audio, get a transcript and summary, export as .docx.**

> 📸 _Screenshot placeholder — add one after first run_

---

## Features

- **Browser recording** — record directly with your microphone; live waveform visualizer + timer
- **File upload** — drag & drop or browse for WAV, MP3, M4A, WebM, OGG, or FLAC files
- **Local transcription** — powered by [OpenAI Whisper](https://github.com/openai/whisper) (runs 100% on your machine, no API key needed for transcription)
- **AI summarization** — four formats via Anthropic Claude: Meeting Notes, Key Takeaways, Executive Summary, or a Custom prompt
- **Editable outputs** — correct errors in the transcript or tweak the summary before exporting
- **Professional .docx export** — two formatted Word documents (transcript + summary) ready to share
- **Dark / light mode** — with a toggle in the header
- **Cross-platform** — Mac, Windows, Linux

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| ffmpeg | any recent | Required by Whisper for audio decoding |

### Installing ffmpeg

**macOS (Homebrew)**
```bash
brew install ffmpeg
```

**Windows (winget)**
```powershell
winget install Gyan.FFmpeg
```

**Ubuntu / Debian**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Arch Linux**
```bash
sudo pacman -S ffmpeg
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/kratos.git
cd kratos

# 2. Configure
cp .env.example .env

# 3. Run
chmod +x start.sh
./start.sh          # Mac / Linux
# — or —
start.bat           # Windows
```

Then open **http://localhost:5173** in your browser. You can add your Anthropic and Hugging Face keys from the in-app Settings page, or edit `.env` manually if you prefer.

---

## Detailed Setup

### 1. Get an Anthropic API key

Sign up at [console.anthropic.com](https://console.anthropic.com), create an API key, and either paste it into `.env` or save it from the frontend Settings page after the app starts.

### 2. Configure the Whisper model

Open `.env` and set `WHISPER_MODEL` to one of:

| Model | Disk size | Speed | Accuracy |
|-------|-----------|-------|----------|
| `tiny` | ~75 MB | Fastest | Lower |
| `base` | ~150 MB | Very fast | OK |
| `small` | ~500 MB | Fast | Good ✓ default |
| `medium` | ~1.5 GB | Moderate | Better |
| `large` | ~3 GB | Slow | Best |
| `large-v2` / `large-v3` | ~3 GB | Slow | Best |

**The model is downloaded automatically on first run** and cached in `~/.cache/whisper/`.

### 3. (Optional) GPU acceleration

If you have an NVIDIA GPU, Whisper will automatically use CUDA for much faster transcription. No extra config needed — just make sure your PyTorch installation matches your CUDA version.

```bash
# Verify CUDA is available after install
python -c "import torch; print(torch.cuda.is_available())"
```

---

## Usage Walkthrough

1. **Open** `http://localhost:5173`
2. **Record** — click the blue microphone button and speak; click the red stop button when done
   — _or_ — **Upload** an existing audio file via drag & drop
3. **Transcribe** — click "Transcribe"; the progress bar shows Whisper working locally
4. **Edit** — fix any errors directly in the transcript text area
5. **Summarize** — choose a format and click "Summarize"; Claude generates the summary
6. **Edit** — refine the summary if needed
7. **Export** — click "Export as .docx"; two download links appear for the transcript and summary files

---

## Configuration Reference

All options live in `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...   # Required
WHISPER_MODEL=small             # Optional (default: small)
HOST=127.0.0.1                  # Optional (default: 127.0.0.1)
BACKEND_PORT=8000               # Optional (default: 8000)
FRONTEND_PORT=5173              # Optional (default: 5173)
```

---

## Running in Production (single server)

Build the frontend and let the FastAPI backend serve it:

```bash
cd frontend && npm run build && cd ..
cd backend && python app.py
```

Then open `http://127.0.0.1:8000`.

---

## Troubleshooting

### `ffmpeg not found`
Whisper requires ffmpeg for audio decoding. Install it with your system package manager (see Prerequisites above) and make sure it's on your `PATH`.

### Whisper downloads model on first run
The first `Transcribe` click will download the model weights. This is normal — subsequent runs use the cached copy.

### `ANTHROPIC_API_KEY` error
Make sure `.env` exists at the repo root and contains a valid key. Double-check there are no extra spaces or quotes around the key value.

### Port already in use
Change `BACKEND_PORT` or `FRONTEND_PORT` in `.env`. Also update the proxy target in `frontend/vite.config.js` if you change the backend port.

### CUDA / GPU issues
If Whisper crashes with a CUDA error, you can force CPU mode by editing `backend/app.py`:
```python
whisper_model = whisper.load_model(WHISPER_MODEL_SIZE, device="cpu")
```

### `python-docx` styling issues on Windows
Ensure you have the `Calibri` font installed (it ships with Microsoft Office). Any missing font gracefully falls back to the system default.

---

## Project Structure

```
kratos/
├── backend/
│   ├── app.py              FastAPI server + all backend logic
│   ├── requirements.txt
│   └── outputs/            Exported .docx files (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         Single-page React app
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── .env.example
├── .gitignore
├── start.sh                Mac / Linux launcher
├── start.bat               Windows launcher
├── LICENSE
└── README.md
```

---

## License

MIT — see [LICENSE](LICENSE).
