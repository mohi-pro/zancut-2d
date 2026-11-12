# Universal Human Anatomy & Rigging Rules

Version: 3.0 · Updated: 2026-11-04
Status: canonical specification; unisex base biometric, orthographic & dynamic garment engine (`engine/cartoon/anatomy.js`) implemented and verified across all postures, demographics, views, and garments (see §13 & §16–§23).

This is the single source of truth for human anatomy, rigging, physical posing, and articulated garment draping in Zancut's 2D animation.
The script planner, director, character designer, shot designer and reviewer must follow it. Where another animation
skill conflicts with this contract on anatomy or garment rigging, this contract takes precedence. Section 13 distinguishes implemented
behavior from requirements that still need implementation. All technical rules and documentation are written in English.

These are stylized animation requirements, not medical limits. Existing implementation values are recorded separately
from proposed acceptance criteria. The rules do not prescribe a camera, cast arrangement, crop, location or story.

## 1. One human system, distinct character appearances

- Use one shared joint hierarchy, constraint solver and validation system (`engine/cartoon/anatomy.js`). Do not implement different anatomy logic
  per shot or character. Custom poses and rig extensions must satisfy the same contract.
- Correctness rules apply to every gender. Skin, face, hair, clothing and body build may vary on top of the unisex base rig.
- Child, teen, adult, broad/athletic and elderly profiles may have different proportions, including head-to-body ratio, limb lengths
  and shoulder width. A child need not be a scaled-down adult.
- Lock a character's profile and local bone dimensions when creating the character. Sitting, walking and changing the
  view must not change that character's actual limb lengths, head size or identity. An elderly stoop is articulation (`kyphosisDeg`).
- Projection and declared foreshortening may change apparent lengths; local bone dimensions remain fixed. Never
  lengthen a limb arbitrarily to conceal an unreachable target.

## 2. Joint hierarchy and coordinate spaces — H01

```text
root / world placement (Y = 0 floor plane, +Y up, +Z forward, +X character's left)
└─ pelvis (0, 95, 0)
   ├─ hipL (12, 92, 0) → kneeL (12, 49, 2) → ankleL (12, 8, -2)
   │  ├─ heelL (12, 3, -7)
   │  └─ footL / ball (13, 3, 14) → toeL (13, 2, 21)
   ├─ hipR (-12, 92, 0) → kneeR (-12, 49, 2) → ankleR (-12, 8, -2)
   │  ├─ heelR (-12, 3, -7)
   │  └─ footR / ball (-13, 3, 14) → toeR (-13, 2, 21)
   └─ lumbar / waist (0, 118, 2) → thorax / chest (0, 146, -1)
      ├─ shoulderL / clavicle (22, 144, -1) → elbowL (25, 112, -3) → wristL (24, 84, 4) → handL / palm (23, 72, 6) → fingers / thumb
      ├─ shoulderR / clavicle (-22, 144, -1) → elbowR (-25, 112, -3) → wristR (-24, 84, 4) → handR / palm (-23, 72, 6) → fingers / thumb
      └─ neckBase (0, 148, 0) → neckTop / head attachment (0, 155.5, 2) → head center (0, 169.5, 3; r=13.5, crown=183) → face / hair
```

- Declare each point's local/world coordinate space. Apply each transform once.
- Derive head, neck, shoulder and torso anchors from their parent transforms and local articulation. Independent
  world-position controls must not disconnect connected parts.
- Use character-relative head units `H` or the canonical normalized biometric unit `U` (`1H ≈ 27U` for the `189.5U` adult crown height). Pixel size, framing and screen placement
  must not alter anatomy.
- Pose data identifies root, pelvis, spine/chest articulation, limb targets, support/contact and view. The skeleton
  does not choose camera placement or visible cast; those belong to shot direction.

## 3. Continuous head–neck connection — H02

- Connect `neckBase` to the `thorax` anchor and `neckTop` to the `head` attachment. Use `neckBase` as the pivot
  for head nods (`headPitch`) and turns (`headYaw`).
- Update neck geometry in the same frame as a head turn, nod or body bend. Do not move the head above an unchanged neck.
- No visible gap is permitted between head base/chin and neck top, or between neck base and chest. Build a continuous capsule hull from `neckTop` (`r = 6.0U`) to `head` (`r = 13.5U`) to prevent seams at different scales and during anti-aliasing.
- **Fixed drawing order, every pose and view:** neck → clothes → head (face, ears, hair, beard). The neck is never drawn over the head.
- These picture rules hold for every human, in both bodies (full body and waist-up), whatever the age, build, skin or clothes. Fix them in the engine, never for one character.
- **Close shots use the waist-up person** (`ZC.person`), never a zoomed full body (gate C5). The cloth stops at a collar below the neck's base: the neck is always seen.
- **No outlines on any body part.** Bones and capsules are the mechanism and never the look. Face, hair, hijab, neck, torso, sleeves, arms, hands, trousers and shoes are flat fills. The form comes from soft shade (under the chin: the jaw's own shade on the top of the throat only, longer when the head bows, gone when it looks up, never a band down the whole neck; one side of the chest, the far arm and leg a step darker) and cloth folds (armpit, waist, elbow, knee, hem). A sleeve is the shirt's own colour, so no round edge shows at the shoulder. Folds lighten on very dark cloth so they stay visible.
- **A long garment is one piece of cloth** (abaya, saree, kameez, punjabi, kurta, on anyone): the outline of the solved cloth from the waist to the hem, front and back together. It never splits into strips or trouser legs when walking, never slides off a leg in a turned view, and no round hip or seat shows through it. Legs start inside the hips.
- **Body shape:** the waist-up woman's body comes in at the waist and returns at the hips, never a straight tube. On any person the far limb is one clean step darker, never a muddy grey; white stays white.
- **Shoulders slope.** The drawn shoulder sits below its joint, so the arm hangs from a slope and never rises round beside the neck. A shirt ends in a straight hem, never a round egg.
- **Ears:** in a turned head the far ear goes away and the near one stays visible on the head's edge. Long hair and a hijab cover them. A hijab never lends its colour to the brows.
- **A raised hand** comes up forward and outside the head with a bent elbow, so it never covers the person's own face from any side. The shoulder only drops as far as the arm hangs, and a raised arm starts at its joint. The forearm tapers to the hand's width, with no step at the wrist.
- **Fingers:** a raised finger is the hand's own index finger (`ZC.fingerUp()`, or `handPoses: ["rest", "point"]` waist up). Never draw a finger, a hand or a thumb as an added shape. Both bodies use the one hand library, `hands.js`.
- **Carried bag:** a school bag or backpack is part of the person: `spec: { bag: { color } }`. It follows every pose and view (straps over the shoulders and down the chest, the bag with its pocket and handle behind). Never draw a bag or straps by hand.
- **The neck has no outline** (a stroke makes it read as a separate part). It is thinner than the head's capsule and about a third of the head long on screen: neckBase → neckTop is the body chart's neckLength (3.9 % of stature, 7.5 U), never longer. An adult is 7–8 heads tall. In a hijab the neck is inside the hijab.
- Every person wears the standard short boot with a heel unless the action calls for bare feet (`sleep`, `ruku`, `sajdah`, or `barefoot: true`).
- **Shoe rule:** the shoe's mouth always sits inside the trouser, pajama or skirt hem, with the hem drawn over it. No part of the foot, heel or ankle ever shows under, beside or above a shoe, and there is no gap between hem and shoe. A floor-length saree or abaya has no coloured hem in side view: beside the shoe it reads as the foot showing. Enforced by the drawing and by `scripts/cartoon-test.mjs` in every pose and view. The shoe colour differs per person: a real shoe colour chosen from their look (`outfit.shoe` sets it).
- Hair cannot conceal a failed connection. Validate front, side, three-quarter and back views.
- **A man reads as a man at phone size, whatever his hair.** A man's `long` hair ends at the jaw (`STYLES.longMale`, side view
  `hairLen` 0.3), never a woman's fall to the back, and a beardless long-haired man gets stubble. Enforced in `people.js`, checked in
  `cartoon-test.mjs` §0.
- **Headwear sits on the hair in every view**: the prayer cap and the crown (`extras: ["crown"]`, flat gold, a darker band, no
  outline) are drawn front / three-quarter / waist-up from `overHead`, and by their own shapes in the side and back views.
- Neck length follows the character profile. Do not stretch it to compensate for reach or torso lean.
- **Strict Anti-Spin Rule:** Never spin the head 360° or turn it past the shoulder line (`headYaw` trim clamped to `[-75°, +75°]`, hard ceiling `±90°`). Turning to look behind requires rotating the chest, pelvis and feet.

## 4. Flexible torso and spine — H03

- Use an articulated 3-joint centerline through `pelvis` → `lumbar` (waist) → `thorax` (chest) rather than a rigid rectangular torso.
- Combine hip hinge, spine curvature and chest rotation during sitting, bending (`ruku`), prostrating (`sajdah`) and reaching. Clothing, collar, scarf
  and shoulder anchors follow the same deformation.
- Sitting may introduce a gentle back curve, pelvic weight and abdominal compression without abruptly shrinking the torso.
- During a crouch or forward bend, move the chest forward/down with the connected head–neck chain, not just the face.
- Keep curves smooth: spine bend between lower (`pelvis→lumbar`) and upper (`lumbar→thorax`) segments must not exceed `50°`. No sharp waist kink, self-intersecting body or disconnected garment.
- Upright sitting, relaxed sitting and an elderly stoop (`kyphosisDeg: 14°`) are different poses of the same connected rig, not compulsory
  postures imposed on every character.

## 5. Shoulder attachment and smooth arm roots — H04

- Keep the upper-arm root attached to its shoulder socket (`shoulderL`, `shoulderR`). The arm rotates about that socket; its root must not drift
  upward/outward and detach from the torso.
- The shoulder socket and sleeve/deltoid cap share the torso surface and coordinate space via the clavicle yoke (`thorax → shoulder`, radii `9.5U → 8.0U`). In a resting pose, the cap
  must not form a separate raised ball or floating arm above the shoulder contour.
- Neutral shoulders follow the profile's shoulder line. Lean, perspective and deliberate shoulder articulation may
  change screen height; distinguish these from accidental joint drift.
- Raising an arm is allowed while retaining socket continuity. This is not a blanket prohibition on an elbow or hand
  appearing above the shoulder during a wave or reach.
- Maintain a smooth neck → shoulder → sleeve → upper-arm silhouette. Avoid duplicate thick seams, floating capsules
  and visible ball joints where the intended style calls for a continuous body.

## 6. Arms, elbows, wrists and palms — H05–H07 (legacy R1–R8)

**H05 · Bones and joints:** Keep upper-arm (`32.2U`) and forearm (`28.9U`) profile lengths fixed. Use a continuous elbow bend branch;
never snap to the opposite solution as a target crosses the body. For an unreachable target, revise the pose/direction
or report the reach failure. Do not silently stretch the character or teleport the prop.

**H06 · Wrist and palm:** Place the hand's wrist origin at the forearm endpoint. Match position, orientation and wrist
width. Maintain one continuous silhouette rather than a floating palm. Wrist twisting cannot compensate for missing arm reach.

**H07 · Surface:** Draw a smooth tapered silhouette from shoulder (`7.4U`) through elbow (`5.9U`) to wrist (`4.3U`). Separate joint balls/rings
are not required. Upper/forearm clothing remains one coherent garment with consistent light and material.

**Natural elbow (gate R8, R9):** seen from the front, the elbow sits at the side of the body, outside the line from the shoulder to the
wrist. An upper arm that goes in over the chest while the forearm comes back out (a Z-shaped arm) is never natural and fails the
gate (R8); only a hand that really reaches across the body turns the elbow in, and then the forearm keeps going across. An arm
left folded across the belly with the elbow out is a note (R9): natural only for a hand on the heart or the belly. An arm that has
finished its job returns to rest down the side in one arc.

**Framing (gate W1):** the lower body has the same priority as the upper body. The body is chosen by where the frame cuts the
person: when the frame shows the hips or anything below (medium, knee, full and wide shots), the full body (`anatomy.js`, any
size: it carries a medium shot with legs, trousers, hem, shoes and feet on the floor); when the frame cuts at the chest or
the waist (close-ups, the speaker of an over-the-shoulder), the waist-up person (`rig.js`, which has no legs), placed so its
lower edge is outside the frame. A waist-up body that ends inside the frame, or a shirt stretched with `longer` where the legs
should be, fails the gate (W1). The over-the-shoulder foreground is the full body from behind or three-quarter, big, cut by the
frame edge, softly blurred.

Existing upper-body production values, recorded as implementation baselines rather than universal calibration:

| Legacy rule | Current value / behavior | Implementation |
|---|---|---|
| R1 | Fixed bone lengths; declared arm foreshortening `0.6…1` | `rig.js`, `anatomy.js` |
| R2 | Connected wrist/palm position and matching width | `rig.js`, `hands.js` |
| R3 | Elbow interior angle at least 30°; approximately 180° when straight | `rig.js`, `anatomy.js` |
| R4 | Wrist bend limited to ±45° | `rig.js`, `anatomy.js` |
| R5 | Same-shot wrist/elbow jump threshold: 70 px/frame | `check-body.mjs` |
| R6 | Held-target reach error threshold: 6 px | `check-body.mjs` |
| R7 | Detect accidental hand intersection with another character's face | `check-body.mjs` |
| R8 | Connected arm silhouette and open wrist seam | `rig.js`, `hands.js` |

The pixel thresholds and subpixel width tolerances need scale-, time- and projection-aware calibration in the shared
validator. They do not prove natural motion. Intentional contact, such as touching another person's cheek, must be
explicitly authored and validated; it cannot excuse an accidental intersection.

## 7. Fingers and thumbs — H08 (legacy R9–R10)

- Maintain a consistent structure of four fingers and one thumb. Occlusion may hide fingers without changing anatomy.
  Finger joints curl toward the palm rather than breaking backward.
- Keep the thumb on the correct anatomical side. Mirroring also mirrors finger structure and prop contact.
- Taper wrist, palm and finger widths coherently. The open wrist seam joins the forearm.
- Reuse or extend `hands.js` drawn poses and finger chains: `rest`, `open`, `point`, `fist`, `pencil`, `phone`, `drape`.
  These are helpers, not an action whitelist. New grips must satisfy the same structure and attachment rules.
- R10 is a three-frame solid fold (`zc.js`, `rig.js`, by elapsed time; the old hand shrinks behind the new one, never see-through; a jump in time starts clean). An equivalent elapsed-time transition must be explicit and seek-safe;
  changing frame rate must not introduce a snap.
- A held object's thumb/finger contacts must read clearly. Do not obscure the entire object with a palm or suspend it
  outside the grip without contact.

## 8. Pelvis, legs, knees, ankles and feet — H09

- Start both legs at pelvis hip anchors (`hipL`, `hipR`). Connect thigh (`43.0U`) → knee → calf/shin (`41.2U`) → ankle, then ankle → heel (`7.1U`), foot/ball (`16.8U`) and toe (`7.1U`).
- Keep femur and shin profile lengths fixed; the two lengths need not be equal (`43.0U` vs `41.2U` in `anatomy.js`, `1.75H` vs `1.68H` in `body.js`).
- Preserve anatomical knee bend direction across view changes and mirroring; no backward knee snap (flamingo leg is strictly forbidden).
- Model heel, ball (`foot`) and toe as distinct contact landmarks. Distinguish flat support, heel strike and toe-off; feet must
  not penetrate the support surface (`Y >= 1.5U` joint center clearance, `Y = 0` ground plane).
- Near/far leg ordering may change during crossing without recreating the bones or changing their dimensions.
- Resolve an unreachable foot target through hip/root/posture placement (`plantFeet`) or a diagnostic, not shin stretch or shoe teleport.

## 9. Walking and running — H10 (legacy L1–L6)

- Represent stance, heel contact, weight acceptance, toe-off and swing phases for each foot.
- During stance, lock the contact foot in the support surface's space: world space for fixed ground, platform-local
  space for a moving boat/platform. Root movement must not cause foot sliding.
- Derive root speed, stride length and cycle duration from the same travelled-distance clock. Do not run an unchanged
  gait cycle at an unrelated translation speed. Walking and running share constraints but differ in timing/flight.
- Lift and advance the swing foot before landing. The two feet must not move identically in phase.
- Normal gait swings arms opposite their corresponding legs. A carrying hand keeps its object contact while walking.
- Coordinate pelvis, chest and head follow-through. Moving the entire figure with one vertical bob is insufficient.
- Include acceleration and weight transfer in starts, stops and turns. On stairs, land each foot on its tread; do not
  slide the entire figure down a slope.

Current `body.js` helper parameters: walk stance `0.62`, step `1.05 H`, lift `0.32 H`; run stance `0.38`, step `1.6 H`,
lift `0.9 H`. In `anatomy.js`, `walk` and `run` cycles operate on continuous phase `0°…360°` with fixed bone lengths, opposite arm swing, high-knee sprint drive, and dynamic garment slit (`chaak`) flare.

## 10. Sitting, standing up, bending and crouching — H11

**Sitting (`sit`):** Establish pelvis–seat contact (`seat.top + 2.5U`), knee bend (`~90°` over seat front edge) and foot support. Seat height and leg proportions determine ankle
targets. Hands may rest on a desk/table, knees, hang beside the body or hold objects; no universal resting-hand pose is imposed.

**Floor Squat (`squat`):** Deep knee flexion (`pelvis Y = 24U`, `knees Y = 44U, Z = 20U`) with feet planted flat on `Y = 0` and garment hems pooling cleanly on the floor without ground penetration.

**Back/torso:** Use pelvic tilt and spine/chest curvature. Lowering a standing torso and hiding its missing legs behind
foreground scenery does not establish a seated pose.

**Sit ↔ stand:** Preparation → forward weight shift → foot loading → pelvis lift/lower → settle. Transfer support before
leaving the seat; do not teleport the body during the transition.

**Bowing (`ruku`) & Prostration (`sajdah`):**
- In `ruku` (90° bow), the spine hinges horizontally at the pelvis (`pelvis Y = 92U, Z = -18U` → `thorax Y = 94U, Z = 40U`), hands rest on knees, and the head aligns with the torso (`headForwardVec = (0, -1, 0.2)`).
- In `sajdah` (7-point prostration), forehead/nose (`head Y = 12U, Z = 56U`), both palms (`handL/R Y = 2U, Z = 58U`), both knees (`kneeL/R Y = 6U, Z = -10U`), and both sets of toes (`toeL/R Y = 2U, Z = -40U`) contact the ground plane while elbows stay raised (`elbowL/R Y = 22U`).

**Supine Lying Down (`sleep`):** Spine rests horizontally along the ground/bed plane (`Y = 10…15U`), head supported on a pillow (`Y = 15U, Z = -72U`), gaze directed upward (`headForwardVec = (0, 1, 0)`).

**Pickup:** Approach → hand contact → grip closure → object follows the hand → body rises. Unassisted prop sliding is
not a substitute for this sequence.

## 11. Weight, support, contact and depth — H12

- Judge root/pelvis movement against support and balance. Static poses need credible weight support; dynamic poses need
  acceleration, momentum and recovery to explain weight transfer.
- Ground (`Y = 0`), stairs, seats (`chair_table`) and pillows (`pillow`) have explicit support geometry. Place feet/pelvis on that geometry. Unintended
  feet outside a boat or unsupported sitting fail review; foreground occlusion cannot conceal impossible support.
- Boarding coordinates first-foot contact, grip, weight transfer, second-foot transfer and platform/hull response.
- A held object's transform follows its hand/contact frame. Handoff: giver grip → shared contact → receiver grip → giver
  release. Preserve object identity, ownership and position continuously.
- Declare contact start/end times. Order near/far limbs, garment panels and hand/object occlusion according to the shot's depth (`Painter's Algorithm` Z-sort in `anatomy.js`).

## 12. Temporal continuity, projection and identity — H13

- Evaluating the same time produces the same geometry. No wall clock, unseeded randomness or dependence on the previous
  rendered frame. IK bend branches must be explicit and continuous.
- Maintain joint position, angle and velocity continuity. A hard camera cut does not permit anatomy or held-prop changes.
- Preserve anatomical left/right when screen direction changes. Project the same 3D skeleton (`anatomy.js`) into `front`, `side`, `sideLeft`, `back`, `threeQuarter` and `top`
  views instead of creating disconnected replacement bodies.
- This contract imposes no camera angle, cast limit, mandatory table or waist crop. Shot authors retain those decisions;
  connection, proportion and support constraints still apply in every framing.

## 13. Implementation inventory and remaining gaps

| File / system | What it does | Remaining work |
|---|---|---|
| `engine/cartoon/anatomy.js` | The one full body: 26-joint skeleton, fixed bone lengths, 2-bone IK with hinge limits, 4 profiles + custom bounds, 15 postures (`stand`, `walk`, `run`, `sit`, `squat`, `ruku`, `sajdah`, `sleep`, `wave`, `point`, `reach`, `clap`, `cheer`, `hold`, `jump`), `blend`, garment solver (`punjabi`, `sari`, `shirt_pant`, `kameez`, `abaya`, `none`), projection, the person's head from `people.js` in every view, and `check()` (H01–H07, H09, H11, H15, H16, H18–H21) | Object grips in the hand, animals |
| `engine/cartoon/rig.js`, `hands.js` | The waist-up acting person (R1–R10): richer hands and arms for close shots | Keep the look in step with `anatomy.js`, which shares its head paths |
| `engine/cartoon/body.js` | Bridge from a person's look to `anatomy.js` | |
| `engine/cartoon/people.js` | A spec → the look: face, hair, hijab, marks, clothes colours, `biometrics` (profile, garment, cloth) | |
| `engine/cartoon/zc.js` | The designers' kit: `ZC.world`, `ZC.clock`, `ZC.person`, `ZC.actor`, `ZC.crowd`, the named poses | Scene prop interaction helpers |
| `engine/cartoon/check-body.mjs` | **The body gate:** every frame in real Chrome: R1–R8 (R8 the Z-shaped arm), `ZANATOMY.check`, H13 jumps, scene crashes, W1 (a waist-up body ending in the frame or a stretched shirt), M1 (only the speaker's mouth moves); notes for R9 (an arm left folded), S1 (sides swapped across a cut) and a speaker whose mouth never opens. Runs in the designer's `look`, after every build and change round (`bodyGate`) and in `zen finish`, which refuses to render on a failure | It checks numbers: drawing quality stays with the reviewers |
| `scripts/cartoon-test.mjs` | No AI: every profile × posture × garment, limits, drawn neck-to-head contact in every view, and the gate on real composed pages including deliberately broken bodies | Add a fixture for each new posture |

Rules H08 (fingers), H10 (gait timing), H12 (contact) and H14, H17 (skeleton, projection) hold by construction in the solver and drawing; they are not measured separately. H13 is measured by the gate. Knee fold is limited to 20° interior (a deep squat and sajdah need it), elbows to 30°.

## 14. Pose tests and review acceptance

Test the same global rig across child, teen, adult, athletic and elderly profiles, multiple builds/scales, all garment presets (`punjabi`, `sari`, `shirt_pant`, `kameez`, `abaya`, `none`), and `front`, `threeQuarter`, `side` and `back` views. Validate the core posture set before scene production:

1. Neutral stand (`stand`) and head turn/nod/tilt: head–neck continuity, collar alignment, and strict anti-360° head yaw clamp (`±75°`).
2. Arms down, forward reach, point and raised wave: shoulder root, elbow branch and wrist attachment.
3. Open hand, grip, point and object handoff: fingers, thumb and contact.
4. Walk (`walk`) and Sprint (`run`): heel/ball/toe, foot lock, stride/root synchronization, and dynamic side-slit (`chaak`) opening as thighs drive forward/back.
5. Chair & Table sitting (`sit`) and sit ↔ stand: pelvis on seat (`Y = 45.5U`), `Hip Breaking Point` fold at groin, front tunic riding on top of thighs (`+Y`), and vertical gravity drop from kneecaps (`Patella`).
6. Deep Floor Squat (`squat`): deep knee fold and garment hem pooling cleanly on `Y = 0` without ground clipping.
7. Prayer / Bowing (`ruku`) and 7-Point Prostration (`sajdah`): 90° horizontal spine hinge in Ruku with gravity-draped front panel; 7-point floor contact in Sajdah with zero floor penetration (`Y >= 2.5U`).
8. Supine Lying Down (`sleep`): horizontal rest on bed/floor with pillow support and gravity-settled garment panels.

Show silhouette, joints, support/contact markers and profile/bone measurements. Review anticipation, contact, transfer
and recovery frames plus a short motion clip, not just the middle still. Generated media/projects stay outside the
repository; generic test code generates synthetic fixtures in temporary directories.

Report every rule as `PASS`, `FAIL` or `UNVERIFIED`, with frame/time evidence. Missing evidence is not a pass. Rig/lint
success is not artistic approval. Fix disconnected parts, sliding feet, stretched limbs, unsupported sitting, static-box garment clipping, invalid
fingers and teleporting objects before scene production.

## 15. Maintenance and next steps

- Change anatomy and garment rigging requirements here first. Implement the corresponding shared solver/drawing/checker behavior in `engine/cartoon/anatomy.js` and regression
  tests in `scripts/cartoon-test.mjs` without maintaining separate per-character or per-story rule copies.
- Other skills reference this contract for anatomy and retain their own shot, style, audio and workflow instructions.
  Source comments may reference rule IDs (`H01–H21`, `R1–R10`, `L1–L6`) and explain local implementation; executable constraints and validators remain in `engine/cartoon/`.

---

## 16. Canonical 3D Biometric Skeleton & Coordinate Space — H14

To guarantee zero sideways limb splay in Front/Back views, exact bone-length preservation across camera angles, and true volumetric occlusion, `engine/cartoon/anatomy.js` defines the canonical 26-joint skeleton in normalized biometric units `U`:

- **World & Local Axes:**
  - `+Y`: Vertical up against gravity (`Y = 0` is the immutable ground plane).
  - `+Z`: Anterior direction (the direction the body faces in neutral stand).
  - `+X`: Character's anatomical left (`-X` is character's anatomical right).
- **Neutral Adult (`stand`) Joint Coordinates (`U`) and Fixed Rest Bone Lengths:**

| Joint Name | Parent | Neutral `(X, Y, Z)` in `U` | Fixed Bone Length (`U`) | Anatomical Role |
|---|---|---|---|---|
| `pelvis` | `null` (root) | `(0, 95, 0)` | — | Center of gravity & root pivot |
| `lumbar` | `pelvis` | `(0, 118, 2)` | `23.09` | Waist / belt / tuck breaking point |
| `thorax` | `lumbar` | `(0, 146, -1)` | `28.16` | Upper chest & clavicle hub |
| `neckBase` | `thorax` | `(0, 148, 0)` | `2.24` | Collar ring & head-turn pivot |
| `neckTop` | `neckBase` | `(0, 162, 2)` | `14.14` | Skull base attachment |
| `head` | `neckTop` | `(0, 176, 3)` | `14.04` | Cranium center (`r = 13.5U`, crown `189.5U`) |
| `shoulderL / R` | `thorax` | `(±22, 144, -1)` | `22.09` | Glenohumeral socket & sleeve root |
| `elbowL / R` | `shoulderL / R` | `(±25, 112, -3)` | `32.20` | Upper arm (humerus) endpoint |
| `wristL / R` | `elbowL / R` | `(±24, 84, 4)` | `28.88` | Forearm (radius/ulna) endpoint |
| `handL / R` | `wristL / R` | `(±23, 72, 6)` | `12.21` | Palm center |
| `hipL / R` | `pelvis` | `(±12, 92, 0)` | `12.37` | Acetabular socket & groin hinge |
| `kneeL / R` | `hipL / R` | `(±12, 49, 2)` | `43.05` | Thigh (femur) endpoint & patella wrap |
| `ankleL / R` | `kneeL / R` | `(±12, 8, -2)` | `41.20` | Shin/calf (tibia) endpoint |
| `heelL / R` | `ankleL / R` | `(±12, 3, -7)` | `7.07` | Calcaneus ground contact landmark |
| `footL / R` | `ankleL / R` | `(±13, 3, 14)` | `16.79` | Forefoot ball contact landmark |
| `toeL / R` | `footL / R` | `(±13, 2, 21)` | `7.07` | Distal phalanges toe-off landmark |

## 17. Unisex Biometric Scaling & Volumetric Body Capsules — H15

Every human character—regardless of age, gender, race, or body build—uses the exact same 26-joint topology and 21 concentric volumetric capsules (`BODY_CAPSULES`), parameterized by demographic multipliers (`PROFILES`) and custom build bounds (`PROFILE_BOUNDS`):

| Profile ID | Reference Label | `scaleY` (Height) | `scaleWidth` (Breadth) | `headScale` (Cranium) | `limbThick` (Volume) | `kyphosisDeg` (Stoop) | Measured Heads Tall |
|---|---|---|---|---|---|---|---|
| `adult` | `7.5H ADULT` | `1.00` | `1.00` | `1.00` | `1.00` | `0°` | `~7.02H` (`189.5U / 27U`) |
| `child` | `5.5H CHILD` | `0.72` | `0.78` | `1.12` | `0.86` | `0°` | `~4.69H` |
| `elderly` | `6.8H ELDERLY` | `0.94` | `0.95` | `0.98` | `0.90` | `14°` | `~6.63H` |
| `athletic` | `8.0H BROAD` | `1.05` | `1.18` | `0.98` | `1.20` | `0°` | `~7.51H` |

- **Unisex Build Dials (`PROFILE_BOUNDS`):** Characters may customize `scaleY [0.55…1.15]`, `scaleWidth [0.72…1.30]`, `headScale [0.90…1.25]`, `limbThick [0.75…1.40]`, `kyphosisDeg [0°…25°]`, `shoulderWidth [0.85…1.20]`, and `hipWidth [0.85…1.20]`. Values outside these bounds fail `H15` validation.
- **Concentric Volumetric Capsules (`RADII` in `U`, scaled by `limbThick`):**
  - `pelvis_lumbar`: front `[15.5, 13.5]`, profile `[11.5, 10.5]`
  - `lumbar_thorax`: front `[13.5, 17.5]`, profile `[10.5, 12.5]`
  - `clavicle`: `[9.5, 8.0]`, `pelvis_hip`: `[10.5, 9.0]`, `neck`: `[6.0, 5.5]`, `head`: `13.5 × headScale`
  - `upperArm`: `[7.4, 5.9]`, `forearm`: `[5.9, 4.3]`, `hand`: `[4.4, 3.5]`
  - `thigh`: `[10.0, 7.2]`, `calf`: `[7.2, 4.7]`, `heel`: `[4.7, 4.5]`, `foot`: `[4.7, 4.1]`, `toe`: `[4.1, 2.9]`
- Because every joint shares a concentric circular endpoint with its parent capsule (`buildCapsuleSvgPath`), limbs never exhibit gaps, pinching, or detached ball joints at any bend angle.

## 18. Joint Range of Motion (ROM), Anti-Unreal Clamps & Breaking Points — H16

To prevent robotic or unnatural distortions (such as spinning a head 360°, bending knees backward, or folding elbows inside out), `ZANATOMY` enforces strict trim clamps (`TRIM`) and hard anatomical checks (`ROM`):

1. **Head & Neck (`neckBase` pivot):**
   - `headYaw`: Clamped to `[-75°, +75°]` in art-direction trim; hard validator ceiling `±90°`. **Never spin a head 360°.**
   - `headPitch`: Clamped to `[-45°, +50°]`; `headRoll`: `[-30°, +30°]`; total neck-to-chest angle `neckFlexMax <= 60°`.
2. **Spine & Torso (`pelvis → lumbar → thorax`):**
   - `spinePitch`: Clamped to `[-35°, +45°]`.
   - `spineBendMax`: Angle between lower and upper spine segments must not exceed `50°`.
   - Chest twist relative to hips must remain `< 90°` (`dot(shoulderL - shoulderR, hipL - hipR) > 0`).
3. **Shoulders, Elbows & Wrists:**
   - `armSpread`: `[-25°, +65°]`; `shoulderExtMax`: upper arm never extends more than `60°` behind the back.
   - `elbowZ`: `[-60°, +60°]`; interior elbow angle `elbowInteriorMin >= 30°` (never folds onto itself or hyper-extends backward).
   - `wristBendMax`: `<= 45°`.
4. **Hips, Knees & Stance:**
   - `stanceWidth`: `[-6U, +20U]`.
   - `hipFlexMax <= 160°` (deep squat/prostration), `hipExtMax <= 30°` (rear stride push-off), `hipAbdMax <= 45°` (side spread).
   - `kneeInteriorMin >= 20°`; knees bend strictly anteriorly (`dot(cross(thigh, shin), left) >= 0` when flexed).
5. **Anatomical Breaking Points (`BREAKING_POINTS`):**
   - Every garment and body mesh hinges at 7 mandatory breaking points: `neck` (`neckBase`), `shoulder` (`shoulderL/R`), `elbow` (`elbowL/R`), `waist` (`lumbar`), `hipGroin` (`hipL/R`), `knee` (`kneeL/R`), and `ankle` (`ankleL/R`).

## 19. Multi-View Orthographic & Orbit Projection Engine — H17

All 2D views are mathematical projections (`ZANATOMY.project`) of the single 3D skeleton and garment chains—never disconnected per-view drawings:

- **`front` (Coronal Anterior):** `screenX = +x`, `screenY = +y`, `depth = +z`.
- **`back` (Coronal Posterior):** `screenX = -x`, `screenY = +y`, `depth = -z`.
- **`side` (Right Sagittal Profile, facing right):** `screenX = +z`, `screenY = +y`, `depth = -x`.
- **`sideLeft` (Left Sagittal Profile, facing left):** `screenX = -z`, `screenY = +y`, `depth = +x`.
- **`threeQuarter` (3/4 Orbit View):** Rotates around `Y = 60U` by `yaw` (default `38°`) and `pitch` (default `18°`).
- **`top` (Plan View):** Rotates by `yaw = 0°`, `pitch = 82°`.
- **Painter's Algorithm Z-Sorting:** Every body capsule, prop box, lower trouser segment, upper bodice, sleeve, front apron quad, back apron quad, and pallu/dupatta segment is sorted by its projected `depth + DRAW_BIAS` from back (`-Z`) to front (`+Z`).

## 20. Global Postures, Ground Clamp (`Y = 0`) & 3D Context Props — H18

`ZANATOMY` provides 8 canonical postures (`REF_POSTURES`) plus smooth keyframe blending (`ZANATOMY.blend(poseA, poseB, t)`):

- **`P-01 stand`:** Neutral upright balance, feet planted at `Y = 2…3U`.
- **`P-02 walk`:** Continuous phase cycle (`0°…360°`), alternating stride (`±26U`), foot lift (`14U`), pelvic bob (`3.5U`), and counter-rotating arm swing.
- **`P-03 run`:** High-knee sprint cycle with flight phase (`8U`), forward torso lean, and high heel curl.
- **`P-04 sit`:** Seated on the 3D Chair (`seat.top = 45.5U`) before the 3D Desk/Table (`table.top = 68.5U`, `Z = 32…64U`), thighs horizontal (`Y = 48U`), shins vertical (`ankle Z = 26U`), forearms resting toward the table (`hand Y = 70U, Z = 40U`).
- **`P-05 squat`:** Deep floor sit (`pelvis Y = 24U`), knees elevated (`Y = 44U`), heels planted.
- **`P-06 ruku`:** 90° bowing posture (`pelvis Y = 92U`, `thorax Y = 94U, Z = 40U`), hands gripping knees (`hand Y = 47U, Z = -4U`).
- **`P-07 sajdah`:** 7-point prostration on the floor (`head Y = 12U`, `hands Y = 2U`, `knees Y = 6U`, `toes Y = 2U`).
- **`P-08 sleep`:** Supine horizontal rest along the bed/ground (`Y = 10…15U`) with head on the 3D Pillow (`center = (0, 4, -72)`).
- **Strict Floor & Seat Clamp (`H18`):** No joint center may drop below `Y = 1.5U`, and no cloth node may drop below `Y = 2.5U`. When strides lengthen, `plantFeet` lowers the pelvis naturally rather than stretching the shin or floating the foot.

## 21. Anti-"Static Box Dress Bug" & 4-Zone Articulated Garment Engine — H19–H20

### H19 · Prohibition of the "Static Box Dress Bug"
In naive 2D rigs, a long garment (such as a Punjabi, Kurta, Kameez, or Gown) is attached as a single rigid polygon to the chest/torso bone. When the character sits on a chair, squats, walks, runs, or bows in Ruku, a rigid torso-locked box clips straight through the thighs and chair seat (`opts.staticBox = true`, flagged as a critical `H20` failure by `ZANATOMY.check`). **Rigid torso-locked tunic boxes are strictly forbidden.**

### H20 · The 4-Zone Articulated Drape & Collision Solver (`ZANATOMY.drape`)
Every tunic, skirt, or long outer garment is divided below the waist into two independent 5-node (4-segment) articulated quad chains—**Front Apron (`front[0..4]`)** and **Back Apron (`back[0..4]`)**—governed by four physical rules:

1. **Zone 1 — Hip-Groin Breaking Point (`front[0]`, tag `HIP BREAKING POINT`):**
   - Anchored at the anterior pelvic hinge (`hipMid + fwd * 9.5U + up * 3U`). When the hips flex in `sit`, `squat`, `ruku`, or `sajdah`, the garment breaks cleanly at the groin crease rather than projecting along the stiff chest vector.
2. **Zone 2 — Lap Compression & Thigh Collision Envelope (`front[1..2]`, tag `LAP / THIGH ENVELOPE`):**
   - The front apron rides **on top of** the anterior thigh capsules (`thighSurface` + `resolveNode` capsule-penetration solver with `1.5U` clearance gap). It never penetrates a thigh or shin capsule (`H20` check tolerance `<= 0.5U`).
3. **Zone 3 — Patella / Kneecap Wrap (`front[3]`, tag `KNEE PATELLA WRAP`):**
   - The cloth wraps smoothly over the leading kneecap (`knee + rKnee`).
4. **Zone 4 — Knee Gravity Drop & Floor Pooling (`front[4]`, tag `GRAVITY KNEE DROP`):**
   - Past the kneecap, the remaining tunic length hangs vertically downward under gravity (`-Y` vector blended with `cloth.stiffness * 0.35`).
   - If the hem reaches a support surface (`seat` or `floor` at `Y = 2.5U`), `layAlong` folds and pools the fabric horizontally along the support surface—never clipping underground or sliding through the chair backrest.
5. **Side Slit / Chaak Separation (`cloth.chaakHeight`):**
   - During walking, sprinting, or sitting, the leading thigh pushes the Front Apron forward (`+Z`) while the rear thigh or seat holds the Back Apron (`-Z`), opening the side slit (`Chaak`) into a natural V-profile controlled by `freedom = 0.35 + 0.65 * chaakHeight`.

## 22. Canonical Garment Presets & Cultural Dress Rules — H21

`ZANATOMY.GARMENTS` defines 5 built-in garment rigs (and maps directly from `people.js` outfit types):

- **`G-01 punjabi` (Punjabi / Panjabi & Pajama):**
  - Knee-length tunic (`drop = 48U`), full hip-level side slit (`chaak = 1.0`), full articulated sleeves with elbow creases, Mandarin collar & button placket, worn over articulated white/slate Pajama trousers (`lower = "pajama"`).
- **`G-02 sari` (Nivi Sari with Kuchi Pleats & Gravity Pallu):**
  - Ankle-length pleated skirt (`drop = 84U`, `chaak = 0.2`, `pleats = true` rendering vertical accordion Kuchi lines that fan with stride and drape over the lap when seated), half-sleeve Choli blouse with Zari border, diagonal Nivi chest sash (`hipR → shoulderL`), and a 4-node gravity `pallu` tail hanging from `shoulderL` (drops vertically toward the floor in `ruku`/`sajdah` and trails in `run`).
- **`G-03 shirt_pant` (Formal Button-Down Shirt & Tailored Pant):**
  - Tucked upper bodice (`apron = false, tucked = true`), pelvic belt strip at `lumbar` (`belt = true`), button placket, full sleeves with elbow creases, and tailored trousers (`lower = "pant"`) with groin and knee flexion creases.
- **`G-04 kameez` (Salwar Kameez & Dupatta):**
  - Flared long tunic (`drop = 54U`, `chaak = 1.0`), gathered loose Salwar leg envelopes (`lower = "salwar"`, radii `[13.2, 11.5, 6.8]`) tapering to ankle Poncha cuffs, U-draped chest Dupatta (`shoulderL → lowChest → shoulderR`), and gravity shoulder tails (`pallu = "dupatta"`).
- **`G-05 none` (Base Anatomical Mannequin):**
  - Unclothed concentric volumetric body capsules for raw anatomical inspection and custom costume authoring.

## 23. Using the Base Engine Across `people.js`, `body.js`, and `zc.js`

Every character created in Zancut inherits this base structure automatically:
1. **`ZPEOPLE.biometrics(spec)`** translates any character `spec` (`age`, `gender`, `build`, `outfit`) into canonical `ZANATOMY` profile parameters (`profile`), garment preset (`garment`), and color palette.
2. **`ZANATOMY.pose({ posture, phase, profile, trim })`** or **`ZANATOMY.transition(poseA, poseB, u)`** solves the exact 3D joint positions, enforces fixed bone lengths and floor/seat support, and returns any `faults`.
3. **`ZANATOMY.drape(pose, garment, cloth)`** solves the 4-zone front/back apron chains and gravity pallu/dupatta tails.
4. **`ZBODY.draw3D(g, { pose, garment, cloth, view, H, look })`** or **`ZC.actor(layer, opts)`** renders the Z-sorted volumetric character and dynamic clothing directly into any scene's SVG layer.

## 24. Measured bodies, the relaxed stand and the world scale — H15b, H24, Z1–Z2, A1

**H25 (Step 2): anchored upper-body gestures and alive motion.** An arm gesture keeps the base pose's pelvis, hips and every leg/foot contact unchanged; its render centre must not follow the centroid of moving arms. A timed gesture eases from/to its base over six 30 fps frames. Breathing uses a 1.75% chest/shoulder cycle, seeded blinks have 2.8–4.2 s intervals, and small speech nods follow the lip-sync syllable envelope. All are pure functions of shot time/identity, with explicit authored blink/eyes-closed/`alive: false` overrides. Walking, jumping and seated actions retain their own root/support motion. H13 retains its 40 U per 30 fps frame limit; other sample rates compare the equivalent displacement per second.

**Implementation status (Nov 2026): implemented and tested.** This section supersedes the profile table in §17 for anyone made
from a spec; the four legacy profiles stay as the fallback when `bodies.js` is not loaded.

- **H15b Measured bodies.** One profile per gender × age (`toddler`, `child6`, `child9`, `child12`, `teen`, `adult`, `elder`) × build
  (`thin`, `average`, `heavy`; `stocky` = halfway), from the body chart `engine/cartoon/library/body-chart.json` (Brief 6) through
  `scripts/build-bodies.mjs` → `engine/cartoon/bodies.js`. `spec.years` picks the age row; `spec.age` alone maps child → child9,
  elderly → elder. Thickness is per part: `armThick`, `legThick`, `chestThick`, `waistThick`, `pelvisThick` (the neck and straps keep
  `limbThick`); shoulders and hips move sideways by `shoulderWidth` / `hipWidth`. Cartoon look on top of the chart: children's
  heads up to 15% big, arms 10% fuller than life but never past the chart's cartoon maximum, elders stoop 8°. Legs and pelvis stay
  ≤ 1.0 until the long-garment drape is retuned for fuller thighs. Enforced by `scripts/cartoon-test.mjs` §0: head, upper arm,
  shoulder and hip widths ÷ stature and upper arm ÷ thigh inside the chart's cartoon range for every row and build; a woman's arms
  and shoulders slimmer than a man's. Bone rest lengths are measured on the symmetric `neutral` stand (never drawn).
- **H24 The relaxed stand.** `stand` = weight on the right leg (pelvis shifted over it, shoulders tilting the other way; hips level so
  a long garment covers both knees in every view), soft elbows bending forward and in, the two arms never mirror copies, breathing
  on `phase` (one breath per cycle; `ZC.idle(t)` breathes every 3.6 s). `hold` keeps the elbows at the sides with the forearms in
  toward the belly.
- **Waist-up arms from the skeleton.** `r.pose` / `r.named` pass the skeleton's own elbow to the rig (`elbows`), so a bone may look shorter than it is (it points at the camera), never longer than the arm (R1 given arms). R3 does not judge a bone that short on screen. Tested by `scripts/film-kit-test.mjs` §15.
- **A1 Arms out (a note, not yet a fault).** Seated, only a hand up near shoulder height counts: a hand on a lap or a table is naturally in front. A hand more than 35 U in front of its shoulder for 0.5 s or longer in a pose that is
  not reaching (`reach`, `point`, a library action with `"reach": true` or in the `object` / `pair` group). Becomes a fault once
  the library's actions carry the `reach` flag (Brief 8).
- **Z1 / Z2 World scale.** In a place with a world view (`engine/cartoon/world.js`, `P.Z`), a full body's size must match where its
  feet are (±18% of a real person of its stature at that depth) and the feet must be below the horizon. People are placed with
  `Z.person(spec, { x, dz })`, pieces with `Z.put(id, layer, { x, dz })`; statures are Bangladeshi national averages
  (`engine/cartoon/library/sizes.json` standards). Tested by `scripts/world-test.mjs` and `scripts/film-kit-test.mjs` §9–10.
