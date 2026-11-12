# REFERENCE STUDY — what the owner is looking for
Five long cartoons the owner gave as examples (4 Bangla folk/family stories, 1 English fairy tale; examples/*.mp4). Measured with
ffmpeg only (`node scripts/study-references.mjs examples/*.mp4`), frames looked at by eye (contact sheets in data/references/*/sheet.jpg).
**Reference only:** these are other studios' films. Nothing from them (characters, backgrounds, frames, audio) is copied into the library, the training data or the product; only measurements and general style lessons.

| film | length | cuts/min | median shot | p90 shot | nearly still | silent | loudness (LUFS) |
|---|---|---|---|---|---|---|---|
| ref1 | 10 min | 12.4 | 3.8 s | 9.6 s | 2 % | 1 % | -9.8 |
| ref2 | 10 min | 12.8 | 3.6 s | 8.6 s | 7 % | 2 % | -9.7 |
| ref3 | 12 min | 11.8 | 4 s | 9.2 s | 5 % | 1 % | -12.9 |
| ref4 | 15 min | 13.4 | 3.2 s | 10 s | 8 % | 2 % | -16.4 |
| ref5 | 10 min | 13 | 3 s | 9.4 s | 2 % | 0 % | -9.9 |

## Lessons (measured + seen)
1. **Pacing:** a cut every ~3–4 s (12–13 cuts/min), long holds up to ~10 s. → planner: target 3.5 s shots, no cut under 2.4 s without a new action.
2. **Framing:** mostly medium and close shots; characters fill half the frame or more. Wide shots mostly show the place. → shot kinds: establish · wide · two · single (knees up) · close (waist-up rig).
3. **Scene changes** open on the place, often without people (house at night, village road, palace). → an establishing shot when the place changes and the sentence is long enough.
4. **Conversations:** two-shots, over-the-shoulder, then the speaker. → two-shot first, then close on the one who acts. (Over-the-shoulder: not built yet.)
5. **Never still** (2–8 % nearly still) and **never silent** (0–2 %): continuous music under the voice, loud (about −10 LUFS). → music bed under the whole film; idle people act a gate-safe gesture.
6. **Look:** saturated flat interiors (pink, green, yellow walls), doors and windows, night exteriors in deep blue, big expressive faces. → next: more interior places, a night version of each place.
7. One film (English) carries subtitles at the bottom. → subtitles: not built yet.

## Our film against the references (same measurements)
| | references (5 films) | ours: owner's 94 s Bangla voice, voice only, Autopilot |
|---|---|---|
| shots per minute | 12–13 | ~16 (25 shots / 94 s; the ffmpeg cut detector misses our cuts inside one place, so its own count is not used) |
| nearly still | 2–8 % | **5.29 %** after Step 2 (original MP4: 45.24 %; 65/65 gestures now pass the 30 fps gate) |
| silent | 0–2 % | 1 % (music bed) |
| loudness | −10 to −16 LUFS | -13.9 LUFS |
| framing | mostly medium/close | establish · wide · two · single · close (waist-up) |
Not yet like the references: over-the-shoulder shots, subtitles, many more places (a talk with no place words stays in one place), richer acting.

Step 2 reused the saved scene file and voice in an isolated workspace. Both videos used `fps=5,scale=320:-2,freezedetect=n=-55dB:d=1.5`; still time fell from 42.80 s to 5.00 s in the same 94.60 s film. The historical gate count was affected by a 6 fps sampling error as well as a moving render center. Diagnosis, tests and artifacts: [GESTURE_MOTION_AUDIT.md](GESTURE_MOTION_AUDIT.md). This is a benchmark result, not a promise for every authored film.
