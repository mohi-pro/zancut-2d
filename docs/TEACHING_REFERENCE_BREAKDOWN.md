# Five reference films — teaching evidence, 2026-11-09

All five films have full-film technical measurements from the earlier reference study, 20-frame contact sheets, and this run's two 36-second audio excerpts plus four additional precisely timestamped frames per film. **This is sampled semantic/visual study, not exhaustive shot-by-shot understanding of every minute.** The raw excerpts are local study artifacts, never product assets or training quotations.

This run inspected all five existing contact sheets (100 sampled frames) and the 20 new timestamped frames. Audio excerpts were processed by the project's existing local Whisper speech listener, using an already cached model; no external model API was called. Bengali ASR contains conspicuous spelling/repetition errors. Those transcripts were not treated as trustworthy labels or fed into the classifier. Word timing and speech recognition are not visual understanding.

| Film | Earlier length | New listening ranges | Visual observations at exact timestamps | New teaching interpretation |
|---|---:|---|---|---|
| Dui Bon / ref1 | 606 s | 152–188, 364–400 s | 160: worried woman at doorway; 176: painter and easel in room; 372: house at night; 388: woman in bed | Keep a reaction readable; use a separate exterior to establish time; keep medical/bedside context rather than inserting an unrelated icon. |
| Sonsari Bou / ref2 | 650 s | 162–198, 390–426 s | 170: interior doorway detail; 186: two seated women; 398: sky and tree; 414: man standing in room | Conversations can use paired framing and reactions; a time/environment bridge can separate dialogue sequences. Still frames alone do not establish a motion trajectory. |
| Bouer Chakor / ref3 | 779 s | 195–231, 467–503 s | 203: woman in domestic interior; 219: man and child at doorway over foreground shoulder; 475: worried man outdoors; 491: stylized overhead carrying | Domestic setting, screen relationships and reaction shots matter. A fantasy interaction outside the current rig's capabilities must be simplified or authored; text examples do not manufacture that rig ability. |
| Iron and Gold / ref4 | 951 s | 238–274, 571–607 s | 246: conversational hand gesture; 262: mansion exterior; 579: seated man in ornate room; 595: dark transition frame | A location-wide establishes context between character views. Do not put a data chart over an important exchange merely because dialogue mentions quantities. A sampled black transition is not evidence that a whole film failed. |
| Plastic Bottle Recycle / ref5 | 621 s | 155–191, 373–409 s | 163: woman outside; 179: man holding a cup, another person exercising behind; 381: two people at a work area; 397: close view of a tray/process | Object/process inserts clarify a practical task; return to the people and result instead of continuously replaying the same insert. |

The interpretations above are assistant observations, not labels supplied by the film authors. New examples in `scripts/data/teaching-curriculum.mjs` use original situations and phrasing. The films' character artwork, sound, dialogue and backgrounds are not copied into the product.

Artifacts: `data/teaching/2026-11-09/references/`, including `sampled-sequences.jpg`, raw excerpt JSON and WAV files. Earlier metrics: `data/references/summary.json`; earlier observations: `docs/REFERENCE_STUDY.md`. The old palette output includes a recurring green slot; no new art direction was trained from that slot.

The reference-derived examples cover domestic reactions, bedside concern, cooking, paired conversation and offering a useful object. Their family identifiers start with `ref1` through `ref5`. These are structural lessons with original wording, not evidence that the model has learned the complete films.
