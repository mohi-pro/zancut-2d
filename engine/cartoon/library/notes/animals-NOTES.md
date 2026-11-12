# Zancut 2D Library — Brief 3: Animals and Birds (`NOTES.md`)

## Delivery Summary
- **Nothing was skipped.** All **35 requested pieces** across **P1** (13), **P2** (10), and **P3** (12) are completed, tested, and verified.
- **8 Bonus Pieces Added** (`doel`, `egret`, `cuckoo`, `jackal`, `cobra`, `fireflies`, `dragonfly`, `crab`) to enrich Bangladeshi village, river/haor, monsoon, fable, and night scenes (**43 pieces total** in `set/`).
- Every file is strictly under **60 lines** (well below the 120-line limit) and under **45 SVG shapes** (well below the 200-shape limit).
- Every piece uses **purely deterministic `g.tick(t)`** driven solely by `t` and `k.rngOf(seed)` (zero `Math.random`, timers, or external assets).
- Every piece follows Zancut's visual rules: flat fills, no outlines, top-left lighting (`k.light` on top/left, `k.dark` on underbelly/back legs), grounded contact shadows (`k.ground`), realistic anatomical proportions, and planted feet/hooves during walk cycles.

---

## Shared Options & Motion API
Every piece accepts:
- `x = 0, y = 0`: Ground anchor under the middle of the animal (or sky height for flying flocks/insects).
- `h`: Pixel height of the standing animal (real height in `cm` is documented in every piece's `about` string for 1:1 scaling against Zancut's `27 * scale U` people).
- `seed = 1`: Deterministic variation (coat colours, spot placement, flock offsets, motion phase).
- `color`, `color2`: Override primary/secondary fill colours.
- `flip` / `facing`: Horizontal mirror (`facing` aliases `flip` as specified in Brief 3).
- `speed = 1`: Scales the animation cycle speed.
- `act`: Selects the motion state:
  - **Walkers**: `"idle"` (default breathing, ear flick, tail swish), `"walk"` (4-phase articulated leg cycle with planted hooves/paws), `"eat"` (neck/head lowered and chewing/grazing).
  - **Birds**: `"perch"` / `"idle"` (breathing, head bob/tilt, tail twitch), `"fly"` (wings flapping, flocks moving as a group), `"peck"` / `"eat"` (head pitching down to peck).
  - **Water & Special**:
    - `duck`: `act: "swim"` places the duck in water with animated concentric ripples.
    - `buffalo`: `act: "wade"` submerges the buffalo up to its back in water with animated surface ripples.
    - `hen`: `rooster: true` (or automatic by seed) switches to a rooster with tall arched tail sickles, larger comb/wattles, and golden hackles.
    - `chick`, `crowFlock`, `flockOfBirds`, `fireflies`: option `n` controls the number of individuals in the group.

---

## Complete Catalogue (43 Pieces)

### P1 — Village and Street (13/13 Complete)
| ID | File | Real Height (`about`) | Key Options & Motion (`act`) |
|---|---|---|---|
| `cow` | `set/cow.js` | about 125 cm | Deshi cow with hump & dewlap; white/brown/black/spotted by `seed`; `"idle"`, `"walk"`, `"eat"` |
| `goat` | `set/goat.js` | about 55 cm | Black Bengal goat with beard & perky tail; `"idle"`, `"walk"`, `"eat"` |
| `hen` | `set/hen.js` | about 35 cm | Village hen or rooster (`rooster: true`); `"idle"`, `"walk"`, `"peck"`, `"fly"` |
| `chick` | `set/chick.js` | about 12 cm | Fluffy yellow chicks (`n = 4` default, 1–8); `"idle"`, `"walk"`, `"peck"` |
| `duck` | `set/duck.js` | about 42 cm | Pond duck (drake/hen by `seed`); `"idle"`, `"walk"`, `"peck"`, `"swim"`, `"fly"` |
| `streetDog` | `set/streetDog.js` | about 52 cm | Bangladeshi pariah dog with curled tail & panting tongue; `"idle"`, `"walk"`, `"eat"` |
| `cat` | `set/cat.js` | about 28 cm | Courtyard cat with S-curve swaying tail; `"idle"`, `"walk"`, `"eat"` |
| `crow` | `set/crow.js` | about 40 cm | Bangladeshi house crow (*pati kak*) with grey collar; `"perch"`, `"peck"`, `"walk"`, `"fly"` |
| `crowFlock` | `set/crowFlock.js` | about 40 cm | `n = 5` crows perched on a wire (`"perch"`) or flapping in formation (`"fly"`) |
| `sparrow` | `set/sparrow.js` | about 15 cm | House sparrow (*chorui*); hopping, pecking, wing flutter; `"perch"`, `"peck"`, `"walk"`, `"fly"` |
| `pigeon` | `set/pigeon.js` | about 32 cm | Rock pigeon (*kabutor*) with green-purple neck sheen; `"perch"`, `"peck"`, `"walk"`, `"fly"` |
| `butterfly` | `set/butterfly.js` | about 8 cm | Flits in a smooth figure-eight around `(x, y)` (`"fly"`) or rests (`"perch"`) |
| `fishInPond` | `set/fishInPond.js` | about 30 cm | Rui/katla fish leaping in a parabolic arc with expanding water ripples |

### P2 — Fields, Rivers and Trees (10/10 Complete)
| ID | File | Real Height (`about`) | Key Options & Motion (`act`) |
|---|---|---|---|
| `buffalo` | `set/buffalo.js` | about 140 cm | Water buffalo (*mohish*); `"idle"`, `"walk"`, `"eat"`, or `"wade"` (in water up to its back) |
| `horse` | `set/horse.js` | about 155 cm | Bay/chestnut/white horse with flowing mane & tail; `"idle"`, `"walk"`, `"eat"` |
| `sheep` | `set/sheep.js` | about 65 cm | Woolly village sheep (*bhera*); `"idle"`, `"walk"`, `"eat"` |
| `kingfisher` | `set/kingfisher.js` | about 18 cm | Turquoise & orange *machranga* on a branch (`"perch"`, `"peck"`) or diving (`"fly"`) |
| `myna` | `set/myna.js` | about 23 cm | Common myna (*shalik*) with yellow eye patch & beak; `"perch"`, `"peck"`, `"walk"`, `"fly"` |
| `parrot` | `set/parrot.js` | about 38 cm | Rose-ringed parakeet (*tiya*) with red hooked beak & collar; `"perch"`, `"peck"`, `"fly"` |
| `squirrel` | `set/squirrel.js` | about 18 cm | Striped palm squirrel (*kathbirali*) nibbling a nut or hopping (`"idle"`, `"walk"`) |
| `frog` | `set/frog.js` | about 12 cm | Green pond frog on a floating lotus leaf with pulsing vocal sac & leap (`"idle"`, `"jump"`) |
| `bee` | `set/bee.js` | about 2 cm | Striped honeybee hovering in loops around a flower stem (`"fly"`, `"perch"`) |
| `flockOfBirds` | `set/flockOfBirds.js` | about 35 cm | Distant V-formation flock (`n = 7` default) gliding across the sky |

### P3 — Stories, Sundarbans and the Zoo (12/12 Complete)
| ID | File | Real Height (`about`) | Key Options & Motion (`act`) |
|---|---|---|---|
| `royalBengalTiger` | `set/royalBengalTiger.js` | about 105 cm | Sundarbans tiger with black stripes & white ruff; `"idle"`, `"walk"`, `"eat"` |
| `elephant` | `set/elephant.js` | about 270 cm | Asian elephant with flapping ears, ivory tusks & curling trunk; `"idle"`, `"walk"`, `"eat"` |
| `monkey` | `set/monkey.js` | about 50 cm | Rhesus macaque (*banor*) with curled tail & expressive arm; `"idle"`, `"walk"`, `"eat"` |
| `deer` | `set/deer.js` | about 90 cm | Sundarbans spotted chital deer (*chitra horin*) with antlers; `"idle"`, `"walk"`, `"eat"` |
| `camel` | `set/camel.js` | about 195 cm | Desert camel with high rounded hump & curved neck; `"idle"`, `"walk"`, `"eat"` |
| `lion` | `set/lion.js` | about 115 cm | Golden lion with full brown mane & tufted tail; `"idle"`, `"walk"`, `"eat"` |
| `rabbit` | `set/rabbit.js` | about 25 cm | Soft rabbit (*khorgosh*) with twitching nose & long ears; `"idle"`, `"walk"`, `"eat"` |
| `turtle` | `set/turtle.js` | about 22 cm | Pond turtle (*kochchop*) with patterned dome shell; `"idle"`, `"walk"`, `"eat"` |
| `crocodile` | `set/crocodile.js` | about 45 cm | Sundarbans crocodile (*kumir*) with armored scutes & opening jaws; `"idle"`, `"walk"`, `"eat"` |
| `owl` | `set/owl.js` | about 36 cm | Spotted owl (*pecha*) on a branch with blinking golden eyes & head swivel; `"perch"`, `"fly"` |
| `peacock` | `set/peacock.js` | about 95 cm | Indian peafowl (*moyur*) with shimmering eye-spotted tail fan; `"idle"`, `"peck"` |
| `dolphin` | `set/dolphin.js` | about 180 cm | Bangladeshi river dolphin (*shushuk*) leaping in a smooth arc with water ripples |

### Bonus Pieces — Bangladeshi Village, Night & Fable World (+8 Extra)
| ID | File | Real Height (`about`) | Why We Added It for Zancut Films |
|---|---|---|---|
| `doel` | `set/doel.js` | about 19 cm | **National bird of Bangladesh** (*Doel pakhi*); essential for courtyard, school, and village morning scenes |
| `egret` | `set/egret.js` | about 65 cm | **White pond/paddy egret** (*Bok pakhi*); iconic in Bangladeshi rice fields, rivers, and haors |
| `cuckoo` | `set/cuckoo.js` | about 42 cm | **Asian koel** (*Kokil pakhi*); classic spring/tree-branch singing bird in Bangla stories |
| `jackal` | `set/jackal.js` | about 45 cm | **Golden jackal** (*Shiyal Pandit*); the #1 folklore/fable animal in Bangladeshi children's stories |
| `cobra` | `set/cobra.js` | about 60 cm | **Spectacled cobra** (*Gokhra shap*); essential for village folklore, charmer, and jungle adventure scenes |
| `fireflies` | `set/fireflies.js` | about 60 cm | **Glowing fireflies** (*Jonaki poka*); magical pulsing particles for Zancut night/evening village scenes |
| `dragonfly` | `set/dragonfly.js` | about 7 cm | **Pond dragonfly** (*Foring*); adds instant life to afternoon ponds, paddy fields, and monsoon reeds |
| `crab` | `set/crab.js` | about 10 cm | **Red beach crab** (*Lal kakra*); essential for Cox's Bazar, Kuakata, and Sundarbans mudflat scenes |
