# RESEARCH (checked 2026-11-06)
- Local LLM option (Qwen3.5 4B / Gemma 3 4B via Ollama): tested Qwen3.5-4B, Apache-2.0, works offline on M4/16 GB; Homebrew's Ollama 0.40.14 lacked the xgrammar library, so schema-constrained output was unavailable (prompted JSON + code validation was used). **Not used now: owner rule.**
- Own-model approach: linear models on hashed char n-grams (feature hashing, "fastText-style") — standard, small, fast, license-free (our code).
- Not yet researched (future gates): licensed web reference search, vision QA, LoRA training. ffmpeg build license still to review. Chrome via puppeteer-core is used to render frames.
