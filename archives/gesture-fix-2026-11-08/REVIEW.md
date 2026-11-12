# Step 2 benchmark review

- Same saved 25-shot scene file, voice, word timings and 94.60 s duration as the original owner benchmark. Original project and original MP4 retained.
- Viewed decoded contact sheets before/after and a full-size standing three-quarter frame. The standing acting shots show the whole person and both hands; shoes stay on the ground; close shots use the waist-up rig. No additional cuts or oscillating camera were introduced.
- Production gate: all 65 gestures pass on four profiles in both rigs (93,600 character frames). Numeric checks add mirrored and half-second cases (124,800 frames). Browser checks verify fixed screen contacts and seek-invariant frame geometry.
- Static filter unchanged: `fps=5,scale=320:-2,freezedetect=n=-55dB:d=1.5`. Original 42.80 s / 45.24%; rerender 5.00 s / 5.29% nearly static. This passes the requested <8% benchmark target.
- Full HyperFrames check passes with zero errors. Two maintainability warnings (large assembled file, dense timeline track) reflect the existing compiler architecture. Camera-cropped world overflow is intentional and informational. Runtime, layout, motion, contrast and audio checks pass.
- Video QA passes: 1920×1080, 30 fps, 94.60 s, audio present, no issues. All nine active test scripts pass.
- Preserve the evidence and backup. Richer narrative acting and broader story coverage remain future work; this measurement does not guarantee every authored film will be below 8% stillness.
