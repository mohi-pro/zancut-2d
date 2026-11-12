# Minimal — Interview & the Customer's Own Pictures and Clips

Used for interview videos (two or more people talking, a podcast, a conversation filmed with one camera) and whenever the
customer added their own pictures or clips.

## Interview rules
- The people stay on screen most of the time (full frame); the cut-out layouts (pop-out card, behind the head, background
  replacement) are not used: several people in the picture break the cut-out.
- Introduce each speaker with a crisp Minimal lower third (`lower-third-kinetic`): an embossed white logo/avatar coin + the
  bold speaker name in the ink colour + an inverted black label bar for their role or title.
- Change the layout with the meaning, on sentence boundaries; never the same layout twice in a row.

## The customer's own pictures and clips
- **Never raw, unframed media**: never dump a customer photo or clip edge-to-edge. Mount it inside one of these 3 Minimal frames over the ground:
  - **Floating Ceramic Frame**: a centred white card frame (`border-radius: 24px`, `padding: 12px`, a white mat border, a deep soft shadow `0 24px 56px rgba(11,11,15,0.12)`, a subtle grey pillar behind) with a slow `1.0 -> 1.05` push-in inside the frame and a bold black-bar caption underneath.
  - **Pop-Out Speaker + Framed Media**: the top half shows the customer's clip or screenshot with a `#FF4D5E` red highlight box or a `#1 / SOURCE` pill; the bottom half shows the speaker in the pop-out card.
  - **Editorial Split Collage**: the customer's photo or clip on one side of a centred comparison card while bold stacked caps and sparkle bullets (`✦`) build beside it.

<!-- graphic -->
## Minimal Interview & Customer-Media Rules for the scene file
- Reference a customer file by its path (`assets/mine/…`) in `src`; use `<video muted playsinline>` for clips, never `<img>` for a video.
- **Ceramic Mat Framing**: frame customer images and clips inside `.gx-media-card` (`background: var(--zk-glass); padding: 12px; border-radius: 24px; border: 1px solid var(--zk-line); box-shadow: 0 20px 50px rgba(11,11,15,0.10);`) with a top kicker pill (`#1 / PROOF`) and a bottom black label bar (`var(--zk-ink)`).
