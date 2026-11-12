# Zancut 2D Library — Brief 4: Props (`NOTES.md`)

## Delivery Summary
- **Nothing was skipped.** All **74 requested props** across **P1 Food & Home** (10), **P1 School & Work** (12), **P1 Everyday** (13), **P2 Play & Sport** (9), **P2 Work & Village** (11), **P2 Care & Faith** (8), and **P3** (11) are completed, tested, and verified.
- **8 Bonus Props Added** (`reportCard`, `bambooFlute`, `boatOar`, `clayBank`, `sweetBox`, `shuttlecock`, `babyBottle`, `megaphone`) to complete common Bangladeshi story interactions (**82 props total** in `props/`).
- Every prop is drawn strictly around its **grip point at `(0, 0)`** (where the fingers close on it—shown by the red cross in `preview.html`) so `ZC.carry` and `ZC.handover` work without floating off the hand.
- Every prop defines `kind: "prop"`, `grip` (`"grip"`, `"pinch"`, `"flat"`, or `"two"` with `grip2: [x, y]`), `base: [x, y]` for resting on a table/floor (or head top for `basketOnHead`), real size in `cm` inside `about`, and non-empty `tags`.
- Every file is between **10 and 38 lines** (well below the 120-line limit) and under **30 SVG shapes** (well below the 200-shape limit), with flat fills, top-left lighting, no outlines, and purely deterministic `tick(t)` where motion/glow applies.

---

## Complete Catalogue (82 Props)

### P1 — Food and Home (10/10 Complete)
| ID | File | Grip (`grip`) | Real Size (`about`) | Options & Motion (`tick`) |
|---|---|---|---|---|
| `teaCup` | `props/teaCup.js` | `"grip"` | about 8 cm | Handle at `(0,0)`, saucer below; `full` option; animated steam `tick(t)` |
| `teaGlass` | `props/teaGlass.js` | `"grip"` | about 10 cm | Tong-stall fluted glass; `full` option; animated steam `tick(t)` |
| `plateOfRice` | `props/plateOfRice.js` | `"flat"` | about 26 cm | Steel plate on palm `(0,0)` with steamed rice, dal, curry & chili (`full`) |
| `waterGlass` | `props/waterGlass.js` | `"grip"` | about 12 cm | Drinking glass held at middle `(0,0)`; `full` option |
| `waterJug` | `props/waterJug.js` | `"grip"` | about 22 cm | Stainless-steel water jug held by side handle at `(0,0)` |
| `kolshi` | `props/kolshi.js` | `"two"` | about 34 cm | Terracotta/metal water pot carried on hip; `grip2: [36, 18]` |
| `tiffinCarrier` | `props/tiffinCarrier.js` | `"grip"` | about 24 cm | 3-tier stainless-steel tiffin carrier held by top handle at `(0,0)` |
| `fruit` | `props/fruit.js` | `"grip"` | about 12 cm | Option `kind`: `"mango"`, `"banana"`, `"apple"`, `"litchi"`, `"jackfruit"`, `"orange"` |
| `breadOrRuti` | `props/breadOrRuti.js` | `"pinch"` | about 18 cm | Handmade Bangladeshi flatbread (*ruti*) with toasted spots, pinched at edge `(0,0)` |
| `kettle` | `props/kettle.js` | `"grip"` | about 24 cm | Held aluminium tea-stall kettle with top handle at `(0,0)` and spout steam `tick(t)` |

### P1 — School and Work (12/12 Complete)
| ID | File | Grip (`grip`) | Real Size (`about`) | Options & Motion (`tick`) |
|---|---|---|---|---|
| `book` | `props/book.js` | `"two"` | about 24 cm | `open: true` (spread pages) or `open: false` (closed hardcover); `grip2: [38, 0]` |
| `notebook` | `props/notebook.js` | `"pinch"` | about 22 cm | Stitched/spiral school exercise *khata* with cover label |
| `pen` | `props/pen.js` | `"pinch"` | about 14 cm | Ballpoint pen angled at writing grip `(0,0)` |
| `pencil` | `props/pencil.js` | `"pinch"` | about 16 cm | Yellow wooden pencil with pink eraser & graphite tip at writing grip `(0,0)` |
| `schoolBagHeld` | `props/schoolBagHeld.js` | `"grip"` | about 38 cm | Student backpack held by top loop handle at `(0,0)` |
| `examPaper` | `props/examPaper.js` | `"pinch"` | about 29 cm | Marked exam sheet with red checkmark & score circle |
| `certificate` | `props/certificate.js` | `"two"` | about 30 cm | Bordered award certificate with gold seal & ribbon; `grip2: [48, 0]` |
| `trophy` | `props/trophy.js` | `"grip"` | about 28 cm | Golden winner's cup gripped at the stem `(0,0)` above wooden base |
| `medal` | `props/medal.js` | `"pinch"` | about 14 cm | Gold medal on V-ribbon pinched at top `(0,0)` with gentle sway `tick(t)` |
| `laptopHeld` | `props/laptopHeld.js` | `"two"` | about 32 cm | Open laptop held at base `(0,0)`; `on: true` glows via `tick(t)`; `grip2: [45, 0]` |
| `clipboard` | `props/clipboard.js` | `"pinch"` | about 32 cm | Wooden clipboard with metal clip & checklist |
| `idCard` | `props/idCard.js` | `"pinch"` | about 10 cm | Student/office ID badge with portrait & neck lanyard |

### P1 — Everyday (13/13 Complete)
| ID | File | Grip (`grip`) | Real Size (`about`) | Options & Motion (`tick`) |
|---|---|---|---|---|
| `phone` | `props/phone.js` | `"grip"` | about 15 cm | Smartphone held at middle `(0,0)`; `on: true` screen glow `tick(t)` |
| `umbrella` | `props/umbrella.js` | `"grip"` | about 85 cm | Big black Bangladeshi umbrella; `open: true` or `false`; gripped above J-handle `(0,0)` |
| `shoppingBag` | `props/shoppingBag.js` | `"grip"` | about 38 cm | Jute/polythene bazar bag held by handles at `(0,0)`; `full: true` shows groceries |
| `takaNotes` | `props/takaNotes.js` | `"pinch"` | about 15 cm | Fanned Bangladeshi Taka banknotes pinched at lower corner `(0,0)` |
| `coin` | `props/coin.js` | `"pinch"` | about 3 cm | Silver/gold Bangladeshi Taka coin pinched at bottom edge `(0,0)` |
| `letter` | `props/letter.js` | `"pinch"` | about 16 cm | Sealed postal envelope (*chithi*) with stamp & seal |
| `key` | `props/key.js` | `"pinch"` | about 7 cm | Brass padlock key on ring pinched at `(0,0)` |
| `walletHeld` | `props/walletHeld.js` | `"grip"` | about 11 cm | Folded brown leather wallet with peeking green Taka note |
| `newspaper` | `props/newspaper.js` | `"pinch"` | about 32 cm | Folded newspaper (*kagoj*) with masthead & columns |
| `handFan` | `props/handFan.js` | `"grip"` | about 34 cm | Woven palm-leaf *haat pakha* with red cloth frill, gripped at handle `(0,0)` |
| `walkingStick` | `props/walkingStick.js` | `"grip"` | about 88 cm | Wooden cane / bamboo *lathi* gripped near top `(0,0)` |
| `giftBox` | `props/giftBox.js` | `"two"` | about 24 cm | Wrapped gift box with ribbon bow; `grip2: [42, 0]` |
| `flowerBouquet` | `props/flowerBouquet.js` | `"grip"` | about 32 cm | Wrapped bouquet of marigolds & roses gripped at stem wrap `(0,0)` |

### P2 — Play and Sport (9/9 Complete)
| ID | File | Grip (`grip`) | Real Size (`about`) | Options & Motion (`tick`) |
|---|---|---|---|---|
| `football` | `props/football.js` | `"two"` | about 22 cm | Classic black-and-white panelled football; `grip2: [36, 0]` |
| `cricketBat` | `props/cricketBat.js` | `"grip"` | about 85 cm | Willow cricket bat gripped on rubber handle at `(0,0)` |
| `cricketBall` | `props/cricketBall.js` | `"grip"` | about 7 cm | Red leather cricket ball with white seam |
| `kite` | `props/kite.js` | `"grip"` | about 45 cm | Diamond paper *ghuri* with wooden reel (*natai*) at `(0,0)` and swaying `tick(t)` |
| `marbles` | `props/marbles.js` | `"flat"` | about 2 cm | 5 colourful swirled glass marbles (*guli*) on open palm `(0,0)` |
| `badmintonRacket` | `props/badmintonRacket.js` | `"grip"` | about 66 cm | Badminton racket gripped at handle `(0,0)` |
| `toyCar` | `props/toyCar.js` | `"grip"` | about 14 cm | Bright colourful toy car with wheels |
| `doll` | `props/doll.js` | `"grip"` | about 22 cm | Traditional Bangladeshi cloth doll (*putul*) held at waist `(0,0)` |
| `balloon` | `props/balloon.js` | `"pinch"` | about 35 cm | Party balloon on string pinched at `(0,0)` with gentle floating `tick(t)` |

### P2 — Work and Village (11/11 Complete)
| ID | File | Grip (`grip`) | Real Size (`about`) | Options & Motion (`tick`) |
|---|---|---|---|---|
| `broom` | `props/broom.js` | `"grip"` | about 65 cm | Short bound Bangladeshi coconut-rib/grass broom (*jharu*), no handle, gripped at top bind `(0,0)` |
| `hoe` | `props/hoe.js` | `"grip"` | about 85 cm | Digging hoe (*kodal*) with bamboo shaft gripped at `(0,0)` & angled iron blade |
| `sickle` | `props/sickle.js` | `"grip"` | about 32 cm | Curved paddy-harvesting sickle (*kaste*) gripped at wooden handle `(0,0)` |
| `fishingRod` | `props/fishingRod.js` | `"grip"` | about 140 cm | Bamboo fishing rod (*borshi*) with bobbing red-and-white float `tick(t)` |
| `fishingNet` | `props/fishingNet.js` | `"grip"` | about 110 cm | Triangular bamboo-framed fishing net (*jaal*) gripped at pole junction `(0,0)` |
| `bucket` | `props/bucket.js` | `"grip"` | about 32 cm | Household water bucket (*balti*) held by top bail handle `(0,0)`; `full` option |
| `basketOnHead` | `props/basketOnHead.js` | `"two"` | about 42 cm | Woven bamboo *tukri* carried on head (`base: [0, 0]` = head top, `grip2: [48, -12]`) |
| `hammer` | `props/hammer.js` | `"grip"` | about 32 cm | Carpenter's claw hammer gripped on wooden shaft `(0,0)` |
| `spade` | `props/spade.js` | `"grip"` | about 95 cm | Digging spade (*belcha*) with D-grip at `(0,0)` and pointed steel blade |
| `paintBrush` | `props/paintBrush.js` | `"grip"` | about 22 cm | Paintbrush with wet paint on bristles, gripped at handle `(0,0)` |
| `toolBox` | `props/toolBox.js` | `"grip"` | about 38 cm | Red metal toolbox with latches, gripped at top handle `(0,0)` |

### P2 — Care and Faith (8/8 Complete)
| ID | File | Grip (`grip`) | Real Size (`about`) | Options & Motion (`tick`) |
|---|---|---|---|---|
| `medicineStrip` | `props/medicineStrip.js` | `"pinch"` | about 10 cm | Foil blister strip of tablets/capsules pinched at lower corner `(0,0)` |
| `thermometer` | `props/thermometer.js` | `"pinch"` | about 13 cm | Clinical fever thermometer pinched at `(0,0)` |
| `syringe` | `props/syringe.js` | `"grip"` | about 14 cm | Doctor's medical syringe with graduated barrel & needle |
| `stethoscope` | `props/stethoscope.js` | `"pinch"` | about 45 cm | Doctor's stethoscope anchored at neck point `(0,0)` hanging down chest |
| `tasbih` | `props/tasbih.js` | `"pinch"` | about 24 cm | Loop of prayer beads (*tasbih*) with tassel, swaying gently via `tick(t)` |
| `prayerCap` | `props/prayerCap.js` | `"pinch"` | about 18 cm | Embroidered white Muslim prayer cap (*tupi*) held at rim `(0,0)` |
| `lantern` | `props/lantern.js` | `"grip"` | about 30 cm | Kerosene hurricane lantern (*hariken*) held at top wire `(0,0)` with flickering glow `tick(t)` |
| `torch` | `props/torch.js` | `"grip"` | about 20 cm | Electric torchlight gripped at barrel `(0,0)`; `on: true` light beam `tick(t)` |

### P3 — Media, Music, Travel and Expression (11/11 Complete)
| ID | File | Grip (`grip`) | Real Size (`about`) | Options & Motion (`tick`) |
|---|---|---|---|---|
| `camera` | `props/camera.js` | `"two"` | about 15 cm | Handheld camera with lens barrel; `grip2: [32, 0]` |
| `microphone` | `props/microphone.js` | `"grip"` | about 22 cm | Stage/reporter microphone with station badge cube |
| `guitar` | `props/guitar.js` | `"two"` | about 95 cm | Acoustic wooden guitar; neck at `(0,0)`, `grip2: [52, 24]` over strings |
| `harmonium` | `props/harmonium.js` | `"two"` | about 55 cm | Traditional wooden Bangladeshi harmonium with bellows & keys; `grip2: [58, 0]` |
| `ektara` | `props/ektara.js` | `"grip"` | about 58 cm | Baul one-stringed gourd & bamboo *ektara* gripped at `(0,0)` |
| `placard` | `props/placard.js` | `"grip"` | about 75 cm | Handheld placard on wooden stick; option `text` (default `"স্বাগতম"` in `'Hind Siliguri'`) |
| `flag` | `props/flag.js` | `"grip"` | about 55 cm | Handheld waving flag on stick; option `country` (default `"BD"`), waving `tick(t)` |
| `suitcase` | `props/suitcase.js` | `"grip"` | about 52 cm | Travel suitcase with straps & latches held by top handle `(0,0)` |
| `ticket` | `props/ticket.js` | `"pinch"` | about 14 cm | Bus/train/launch ticket with perforated stub |
| `remote` | `props/remote.js` | `"grip"` | about 17 cm | TV/AC remote control with power & channel buttons |
| `glasses` | `props/glasses.js` | `"pinch"` | about 14 cm | Pair of eyeglasses held by temple arm at `(0,0)` |

### Bonus Props — Extra Bangladeshi & Story Essentials (+8 Extra)
| ID | File | Grip (`grip`) | Real Size (`about`) | Why We Added It for Zancut Films |
|---|---|---|---|---|
| `reportCard` | `props/reportCard.js` | `"pinch"` | about 22 cm | Mentioned in Brief 4's intro & Appendix example (`ZS.reportCard`), so included directly in `props/` |
| `bambooFlute` | `props/bambooFlute.js` | `"grip"` | about 42 cm | **Bangladeshi bamboo flute (*banshi*)**; iconic for village cowherd, riverside, and folk music scenes |
| `boatOar` | `props/boatOar.js` | `"grip"` | about 135 cm | **Country-boat paddle (*noukar boitha*)**; essential whenever a boatman (*majhi*) rows a river boat |
| `clayBank` | `props/clayBank.js` | `"two"` | about 18 cm | **Terracotta coin bank (*matir bank*)**; classic Bangladeshi children's savings prop |
| `sweetBox` | `props/sweetBox.js` | `"flat"` | about 24 cm | **Mishtir packet** tied with red twine; essential whenever guests visit a home or celebrate exam results |
| `shuttlecock` | `props/shuttlecock.js` | `"pinch"` | about 9 cm | **Feathered badminton shuttlecock**; pairs directly with `badmintonRacket` |
| `babyBottle` | `props/babyBottle.js` | `"grip"` | about 16 cm | **Baby feeding bottle**; essential for family and parenting scenes |
| `megaphone` | `props/megaphone.js` | `"grip"` | about 32 cm | **Handheld loudspeaker (*miking*)**; classic in Bangladeshi village/street announcements and school sports days |
