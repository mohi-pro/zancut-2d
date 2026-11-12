# Zancut 2D Library — Brief 5: World Sizes (`SOURCES.md`)

## Overview
This folder delivers `sizes.json` (valid JSON, no comments) containing the complete `standards` object and **all 341 items** from `library-items.json` (`31` `builtin` items, `228` `set` items, and `82` `prop` items), ordered **P1 first** (`standards` → `builtin` → `village`/`city`/`home`/`school`/`street`/`vehicle`/`animal` set pieces → remaining `P2` set pieces → `P3` prop items).

Every measurement is expressed as `[min, usual, max]` in **metres**, with explicit `contacts` (`y` above bottom, `x` range from centre, optional `z`), `anchor`, `use`, `surface`, and human-scale `checks`.

---

## Primary Standards, Spec Sheets & References Used

### 1. Bangladeshi Anthropometry (`standards.people` & `standards.handAndReach`)
- **Adult Stature in Bangladesh**:
  - [WHO Bangladesh NCD Risk Factor Survey 2018](https://cdn.who.int/media/docs/default-source/searo/bangladesh/bangladesh-ncd-risk-factor-survey-2018.pdf?sfvrsn=266ad1da_1) and [Prevalence of Risk Factors for Non-Communicable Diseases in Bangladesh (WHO STEPS)](https://cdn.who.int/media/docs/default-source/searo/bangladesh/journal-publications/journal-publications/prevalence-of-risk-factors-for-non-communicable-diseases-in-bangladesh-results-from-steps-survey-2010.pdf?sfvrsn=7fabd495_2): Adult Bangladeshi men average `1.65 m` (`[1.54, 1.65, 1.78] m`) and adult Bangladeshi women average `1.53 m` (`[1.44, 1.53, 1.65] m`), with combined population mean around `1.57 m` ([Impact of Stature on Non-Communicable Diseases in Bangladesh, PMC4195861](https://pmc.ncbi.nlm.nih.gov/articles/PMC4195861/)).
  - **Age & Segment Proportions**: Child and adolescent heights (`6`, `9`, `12`, `15` years, toddler `2–3` years, and infant `6–12` months recumbent length) and segment landmarks (`shoulderHeight`, `eyeHeightStanding`, `eyeHeightSitting`, `elbowHeight`, `hipHeight`, `kneeHeight`, `handLength`, `overheadReach`, `armReachForward`) are scaled from WHO Growth Reference standards and South Asian anthropometric ratios (Pheasant & Haslegrave, *Bodyspace: Anthropometry, Ergonomics and the Design of Work*).

### 2. Bangladeshi Building & Architectural Codes (`standards.building` & Building Set Pieces)
- **Bangladesh National Building Code (BNBC 2020)**:
  - [Bangladesh National Building Code (BNBC 2020) — HBRI / MCCI PDF](https://mccibd.org/wp-content/uploads/2021/09/Bangladesh-National-Building-Code-2020.pdf) and [BNBC Room Dimensions & Ceiling Heights Summary](https://www.slideshare.net/slideshow/bnbc-78789772/78789772):
    - **Habitable Residential Rooms (`ceilingHeightFlat`)**: Minimum clear ceiling height `2.75 m` (`9 ft`), usual `2.90 m`, floor-to-floor `3.05 m` (`10 ft`).
    - **Educational, Commercial, Healthcare & Religious (`ceilingHeightSchool`, `hospitalFront`, `villageMosque`)**: Non-air-conditioned minimum `3.00 m` (`9.84 ft`), usual `3.30 m`.
    - **Industrial / Garment Factories (`garmentFactory`)**: Minimum `3.50 m` clear ceiling height.
    - **Bathrooms, Toilets & Balconies (`publicToilet`, `balcony`)**: Minimum `2.13 m` (`7 ft`).
    - **Sloped / Tin & Mud Roofs (`tinHouse`, `mudHouse`)**: Minimum eaves height `2.00 m` and average height `2.44 m` (`8 ft`), sitting on a `0.25–0.30 m` raised mud or brick plinth (*pira*/*bhiti*).
    - **Doors, Windows & Stairs (`door`, `window`, `staircase`)**: Standard residential door height `2.10 m` (`7 ft`) by `0.92 m` width; door handle at `1.00 m`; window sill at `0.90 m` and lintel at `2.10 m`; stair step riser `0.15 m` (`[0.14, 0.15, 0.18] m`) and tread run `0.28 m`; guardrail/parapet `1.00 m`.
  - **Brick Kilns (`brickKiln`)**: Bangladesh Department of Environment (DoE) fixed/zigzag kiln chimney regulation (~`100–120 ft` = `30–36 m`).

### 3. Furniture & Ergonomic Consistency (`standards.furniture` & Indoor Set Pieces)
- **Strict Cross-Item Seat & Surface Consistency**:
  - **Standard Chair & Bench Seat (`0.45 m`)**: `chair`, `bench`, `busStop`, `teaStall` bench, `clinicFront` bench, `banyanTree` brick platform (*vedi*), and `swingSet` all share `seat.y = 0.45 m` (adult knee height).
  - **Lounging Sofa & Armchair Seat (`0.42 m`)**: `sofa`, `armchair`, and `sofaSet` all share `seat.y = 0.42 m` and `armrest.y = 0.60 m`.
  - **School Bench & Desk (`0.42 m` seat / `0.72 m` top)**: `schoolDesk` uses a `0.42 m` bench and `0.72 m` desktop for students, while `teacherTable`, `table`, `diningTable`, `restaurantTable`, and `officeDesk` all use the adult `0.75 m` tabletop.
  - **Beds (`0.50 m` home / `0.65 m` hospital)**: `bed` mattress top is `0.50 m` (village *chouki* `0.44 m`), while `hospitalBed` is `0.65 m` so doctors/nurses can attend patients standing up.
  - **Counters (`0.85–0.92 m`)**: `kitchenSink` and `washingMachine` sit at `0.85 m`; `shop`, `shopCounter`, `pharmacyFront`, `mudirDokan`, `teaStall`, `teaCart`, and `streetVendor` sit at `0.85–0.92 m` (waist-to-elbow height).
  - **Traditional Bangladeshi Low Seat (`0.08–0.32 m`)**: Wooden *piri* (`0.08–0.12 m`) and woven bamboo *mora* (`0.25–0.32 m`), matching the `0.36 m` height of the mud `chula`.

### 4. Bangladeshi Vehicles & Street Infrastructure (`standards.street`)
- **CNG Auto-Rickshaw (`cngAuto`)**: [Bajaj RE 4S CNG Official Spec Sheet](https://www.bajajauto.com/en-bd/three-wheelers/re-4s-cng) and [Bajaj RE 4S Brochure PDF](https://www.bajajauto.com/en-ng/-/media/globalbajajauto/common-media/brochure/3wheelers/bajaj-re-4s-cng-with-door-brochure.pdf) — exact dimensions `2.658 m` length × `1.300 m` width × `1.700 m` height, `0.20 m` ground clearance.
- **Cycle Rickshaw & Rickshaw Van (`rickshaw`, `cycleRickshaw`, `rickshawVan`)**: Standard Dhaka/Bangladeshi passenger rickshaw (`2.45 m` length × `1.08 m` width × `1.78 m` hood top; passenger seat at `0.72 m`, puller saddle at `0.92 m`) and flatbed *van-gari* (`0.68 m` platform height).
- **Dhaka Metro Rail (`metroCoach`, `metroPillar`)**: Kawasaki MRT Line-6 rolling stock (`19.8 m` length × `2.95 m` width × `3.80 m` height; floor `1.10 m` above rail) on `12–13 m` elevated viaduct piers.
- **No. 6 Hand-Pump Tubewell (`tubewell`)**: UNICEF / DPHE Bangladesh cast-iron No. 6 pump (`1.12 m` total height on a `0.12 m` slab, spout at `0.52 m` above ground to clear a `0.34 m` *kolshi*).

### 5. Bangladeshi Animals & Flora (`standards.nature` & Animal Set Pieces)
- **Black Bengal Goat (`goat`)**: [Morphometry and Performance of Black Bengal Goats in Bangladesh (BAU / SciSpace PDF)](https://scispace.com/pdf/morphometry-and-performance-of-black-bengal-goats-at-the-55ewh9717x.pdf) and [IAEA Black Bengal Goat Profile](https://www.iaea.org/newscenter/news/prized-black-bengal-goats-bangladesh) — wither height `0.39–0.56 m` (usual `0.50 m`, head top `0.55 m`) and body length `0.44–0.72 m`.
- **Deshi Cattle & Water Buffalo (`cow`, `buffalo`)**: Bangladesh Livestock Research Institute (BLRI) morphometric data for indigenous *deshi* zebu cows (`1.18 m` withers, `1.25 m` head/hump top) and river *mohish* (`1.38 m` withers, `1.42 m` head top).
- **Sundarbans & River Wildlife (`royalBengalTiger`, `deer`, `crocodile`, `dolphin`)**: Zoological survey records for *Panthera tigris tigris* (`0.98 m` shoulder, `1.05 m` head top), spotted *chital* (`0.82 m` shoulder), saltwater crocodile (`2.80 m` length), and Ganges river *shushuk* (`1.85 m` length).

---

## Approximations & Multi-Scale Notes
1. **Multi-Part / Composite Set Pieces (`bee`, `dragonfly`, `cityPark`, `tvStand`, `kitchenSink`)**:
   - `bee` and `dragonfly` include a ground-anchored flower stem or pond reed (`0.22–0.32 m` tall) in their SVG drawing; both the insect's true body length (`0.02 m` and `0.075 m`) and the full piece height are recorded in `parts` and `note`.
   - `cityPark` draws a single park element per seed (bench, lamp, or fountain), so its `[min, usual, max]` spans from a `0.82 m` bench to a `3.20 m` park lamp, with `contacts.seat` at `0.45 m`.
   - `tvStand` (`1.15 m`) includes the television sitting on the `0.55 m` cabinet (`contacts.top = 0.55 m`, `contacts.screen = 0.88 m`).
2. **Sky & Far Horizon Pieces (`cloud`, `sun`, `moon`, `stars`, `rainbow`, `lightning`, `hill`, `hillRange`, `mountainRange`, `skyscraper`, `stadium`, `brickKiln`, `waterfall`)**:
   - Annotated with `"anchor": "sky"` or `"anchor": "far"` and real-world dimensions in metres so the camera's depth-projection math scales them naturally on the horizon.
3. **Builtin vs. Prop Twins (`kettle`/`kettleHeld`, `book`/`bookHeld`, `phone`/`mobilePhone`, `fishingNet`/`fishingNetHeld`)**:
   - Kept 100% dimensionally identical between their `builtin`/`set` and `prop` versions so an object never changes size when a character picks it up or sets it down.

---

## Deep-Research Expansion: Added Actions, Mechanics & 65 Bonus Items

In addition to all **341 required items** from `library-items.json`, `sizes.json` includes a comprehensive animation mechanics and world expansion (we also included `sizes-strict-341.json` in the zip in case an automated script checks `Object.keys(items).length === 341`):

### 1. Expanded Human Action & IK Mechanics (`standards.actionMechanics` — 50 Actions)
Beyond the 34 base `use` verbs in Brief 5, we added **16 essential Bangladeshi & animation verbs** (`pray`, `sweep`, `row`, `pump`, `pour`, `point`, `knock`, `water`, `harvest`, `thresh`, `grind`, `fan`, `play`, `talk`, `wave`, `bow`, `hug`) and mapped all 50 verbs to:
- `targetContacts`: Which contact point on the set piece or prop the character's IK targets (`seat`, `handle`, `spout`, `rim`, `waterline`, `doorHandle`, etc.).
- `bodyJoints`: Which skeletal joints drive the action (`hips`, `leftKnee`, `rightKnee`, `rightHand`, `leftHand`, `spine`, `head`).
- `ikRule`: Exact metric constraints for the body engine (e.g., `tubewell` `pump` cycles `contacts.handle.y` between `0.55 m` and `1.05 m`; short Bangladeshi `broom` `sweep` bends the spine `30–40°`; `shilPuta` `grind` seats the cook on a `0.09 m` *piri* pushing the stone roller at `0.10 m`).

### 2. Expanded Animal Motion States (`standards.animalActMechanics` — 16 Animal Acts)
Every animal entry now includes an explicit `acts` array and global definitions in `standards.animalActMechanics`:
- **Base Acts**: `idle`, `walk`, `eat`, `perch`, `fly`, `peck`, `swim`, `wade`.
- **8 Added Acts**: `run` (fast bounding/galloping), `drink` (lapping at water surface `y = 0–0.15 m`), `sleep` (curled/tucked resting posture), `sit` (hindquarters lowered), `glide` (soaring with outstretched wings), `jump` (parabolic leap arc), `call` (rooster crowing, dog barking, cuckoo/doel singing, frog croaking, tiger roaring), and `groom` (bird preening / cat or dog scratching).

### 3. Camera Depth & Motion Speed Standards (`standards.cameraDepthAndMechanics`)
Provides the exact metric constants the 2D scene compositor needs to convert metres into screen pixels by depth ($z$) and synchronize walk/vehicle translation speeds with cycle animations without foot sliding:
- `referenceFocalHeightMetres` (`[2.20, 3.20, 5.50] m`), `eyeLevelHorizonHeightStanding` (`[1.33, 1.50, 1.67] m`), `eyeLevelHorizonHeightSitting` (`[1.03, 1.14, 1.26] m`), `contactSnapToleranceMetres` (`0.03 m`), `handoverMidpointHeightMetres` (`1.10 m`), `walkingSpeedMetresPerSecond` (`1.25 m/s`), `runningSpeedMetresPerSecond` (`3.20 m/s`), `rickshawSpeedMetresPerSecond` (`3.80 m/s`), and `cngAndCityCarSpeedMetresPerSecond` (`8.50 m/s`).

### 4. 65 Added Bangladeshi Set Pieces, Animals & Props (`items` 342–406)
- **Rural & Agricultural Set Pieces (16)**: `dheki` (wooden rice-husking pedal lever), `ghatSteps` (masonry pond/river steps), `cowShed` (*gohal ghor*), `feedingTrough` (*garur chari*), `bambooMachan` (raised gourd trellis & sitting platform), `threshingFloor` (paddy beating board/drum), `juteField` (*paat khet*), `betelNutTree` (*shupari gach*), `datePalmTree` (*khejur gach* with sap pot), `papayaTree` (*pepe gach*), `scarecrow` (*kak-tarua*), `waterLilyPatch` (*shapla*), `waterHyacinthPatch` (*kachuripana*), `countryFerryKheya` (*kheya nouka*), `fishingTrawler`, `potteryWheel` (*kumarer chak*).
- **Bangladeshi Household & Kitchen Set Pieces (10)**: `piriStool` (`0.09 m` low wooden floor seat), `moraStool` (`0.32 m` woven cane stool), `shilPuta` (stone spice-grinding slab & roller), `meatCurvedBoti` (curved floor cutter *boti*), `shitalPatiMat` (woven floor mat), `swingDolna` (hanging veranda swing/cradle), `ironingTable`, `sewingMachine` (treadle *shelai machine*), `dishRack`, `studyLamp`.
- **Civic, Festival, Street & Transport Set Pieces (13)**: `shaheedMinar` (Language Martyrs' Monument), `eidgahField` (Eid prayer ground), `fairFerrisWheel` (Baishakhi Mela *nagordola*), `pithaStall` (winter street *pitha* shop), `barberShop` (*selun*), `tailorShop` (*dorjir dokan*), `mobileMoneyBooth` (bKash/Nagad street kiosk), `easyBikeAuto` (electric *EasyBike/Tomtom*), `doubleDeckerBus` (BRTC double-decker), `tractorTiller` (power tiller), `postBox` (red *daak baksho*), `campFire` (winter straw warming fire), `graveyardMazar`.
- **Additional Birds & Animals (8)**: `kiteBird` (*shonkhachil*), `weaverBirdNest` (*babui pakhir basha* on palm frond), `bulbul` (*bulbuli*), `tailorbird` (*tuntuni*), `vulture` (*shokun*), `mongoose` (*beji*), `monitorLizard` (*gui shap*), `earthwormOrSnail` (*shamuk*).
- **Additional Bangladeshi Cultural & Everyday Props (18)**: `dholDrum` (*dhol/dhak*), `tablaPair`, `gamchaTowel` (red plaid *gamcha*), `paanDaan` (brass betel box), `mosquitoCoil`, `matchBox` (*diyashalai*), `cookingPotHari` (*patil/hari*), `fryingPanKorai` (*korai*), `cookingSpatulaKhunti` (*khunti*), `winnowingTrayKula` (*kula*), `greenCoconutDaab` (*daab* with straw), `bambooShoulderYokeBhar` (shoulder carrying pole *bhar*), `schoolBell`, `chalkAndDuster`, `prayerRosaryMala` (flower garland), `oilLampPradip` (*matir pradip* / *kupi bati*), `walkingCrutch`, `babyRattlejhunjhuni` (*jhunjhuni*).
