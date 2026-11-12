# GLOSSY + STORYTELLING — ONE UNBROKEN MORPHING CHAIN

Nobody is on screen: the voice (the customer's recording or the AI voice) drives a continuous chain of full-screen glossy scenes.

## Rules
- Rows are full-screen graphics (`"piece": "custom"`), with short stock moments where the words name a real thing and a real
  picture says it better (`stock-photo` / `stock-video`), and the customer's own pictures and clips where their notes say (`mine`).
- The chain never breaks: every graphic row's `anchorIn` is the previous graphic row's `anchorOut` (cut join). After a stock or
  customer moment, the next graphic arrives with zoom-blur or blur.
- The words are part of the graphics (kinetic typography inside the scene: the key phrase of each row appears word-locked); the
  video has no separate captions (`"captions": "hide"` on every row).
- Usually `"music": "none"` under the animations (the sound effects carry the video) unless the customer asked for music or gave their own.
- Vary the hero's position (left / right / centre-high) and the archetype every row. The ground stays the same through a run of joined rows and changes only at a pivot.
<!-- graphic -->
## Your scene
A complete full-frame glossy scene: the `bgStage` ground, the hero acting out the metaphor, ≥ 2 supporting chips, and the row's
key phrase as kinetic typography appearing word by word on its wordLocks (short, from the speech).
