# Universal Human Anatomy & Rigging Rules: the card

These rules are strict, for every human of any age, build, gender or clothes. A body mistake is never acceptable. The engine draws the body and the body gate checks every frame, but both only catch what they can measure, so you stop the rest. Use the kit's bodies and poses. If you extend a pose, every rule below still holds. (Rule ids match the gate's lines. Full contract for engine work: `human-anatomy-rigging.md`.)

**The body (H01–H09, H14–H17)**
- One skeleton per person, fixed for the film: bone lengths, head size and identity never change between poses, views or shots. Same spec in every shot. A child, an elderly person and a broad adult have their own proportions from the spec; never scale one into another.
- Everything is connected: head on neck, neck on chest, arm on shoulder, hand on wrist, leg on hip, foot on ankle. No gap, floating part or detached joint. Knees and elbows bend only the natural way, with no backward or flipped joint.
- Limits: head turn ±75° (`headYaw`), `headPitch` −45…50, `headRoll` ±30, `spinePitch` −35…45, `armSpread` −25…65, `elbowZ` ±60, `stanceWidth` −6…20. To look further round, turn chest, hips and feet too. Elbows never fold under 30°, wrists never bend past 45°.
- Hands have four fingers and a thumb on the correct side. Never stretch a limb or teleport a thing to reach: move the person or the thing.

**The picture (the engine draws it; send it back if it reads wrong)**
- No outlines on any body part: flat fills, soft shade, cloth folds. Never draw a body part, finger, thumb, bag, strap, outline or fold by hand. A raised finger is the hand's own: `ZC.fingerUp()`, waist up `handPoses: ["rest", "point"]`. Carried bag: `spec: { bag: { color } }`.
- Shoulders slope: no round lump or ball at the shoulder. A raised hand comes up forward and outside the head, never covering the person's own face.
- Order: neck → clothes → head. A hijab hides the neck. In a turned head with short hair the near ear shows.
- A long garment is one piece of cloth, never strips or trouser legs. A shirt ends in a straight hem. The heeled shoe's mouth sits inside the hem, with no foot showing.
- The lower body matters as much as the upper body. The body is chosen by where the frame cuts the person: the frame shows the hips or below (medium, knee, full, wide shots) → the full body (`ZC.actor`, any size), with legs, trousers, hem, shoes and feet on the floor; the frame cuts at the chest or waist (close-ups, the speaker of an over-the-shoulder) → the waist-up person, its lower edge outside the frame. Never a waist-up body ending inside the frame or a shirt stretched (`longer`) to fill where the legs should be (gate W1). The over-the-shoulder foreground is the full body from behind (`view: "back"` or `"three"`), big, cut by the frame edge, softly blurred. Same collar, sleeves, hem and clothes in every framing; a shirt is never stretched to the floor (`longer` only for a crop that hides it).

**Weight and contact (H10–H13: no code checks most of this, so you must)**
- Support: feet on the floor; hips on a real seat at `floor - b.seatHeight()`. Never hide missing legs behind scenery to fake a pose. No body floats or sinks.
- Sit ↔ stand: preparation → weight forward → up → settle (`b.rise`). No pose snaps: blend between poses.
- Walk and run: the steps come from the distance covered, a planted foot never slides (`b.arrive`, or `ZC.walk` with matching speed); starts and stops show weight.
- A held thing stays in its hand every frame (`ZC.carry`), with fingers visibly on it. Hand-over: giver's grip → both touching → receiver's grip → giver lets go (`ZC.handover`). Pickup: approach → contact → grip → thing follows the hand → body rises. Nothing floats or slides by itself.
- Hand or arm near another person: never in their face unless the story calls for that touch.
- Arms at rest hang close to the body with a soft elbow. An arm that has finished its job (after giving, pointing, waving) goes back down to rest in one arc, never stays folded across the belly or chest with the elbow sticking out, unless the action is that (holding the belly, a hand on the heart). A raised arm needs a reason and a target, and an elbow stays on one side through a move (`bend`).
- A hard cut changes the camera, never the body, clothes, who holds what or the side of the screen.
- Same time gives the same picture: move from `t` only, no random numbers or timers.

**Check every physical action** on its before, contact and after frames, on every person and both arms, listeners too. Passing the gate does not approve the acting.
