# Sources, methods and delivery notes

Prepared 6 November 2026. English delivery for Brief 6: Body proportions.

## Read this first

This is a **research-informed animation reference, not a fully measured anthropometric standard**. The requested complete contemporary South Asian dataset—14 age/sex groups, all front widths, joint-centre dimensions and build distributions—was not established in the reviewed sources. Usable estimates are supplied and explicitly tagged. Do not describe them as measured 10th/90th percentiles.

The required import folder contains only `proportions.json` and this file. Optional data are outside it. The separate HTML is a review interface, not an animation engine or a character-clip library.

## Evidence map

| Group | Numeric basis | Evidence status |
|---|---|---|
| Toddler stature | WHO height at 30 months | Approximate source P10/P90 |
| Child6, child9, child12, teen stature | WHO at 72, 108, 144, 186 months | Reconstructed approximate P10/P90 |
| Adult stature | 200 Bangladeshi young adults, 100 of each sex | Sample mean ± 1.28155 SD; extended to requested adult age label |
| Elder stature | Adult baseline minus usual longitudinal height loss | Illustrative derivation, not measured elder distribution |
| Head, neck, torso, limbs, hands and feet | Authored age-specific geometry | Engineering estimates, not measured percentiles |
| Joint floor heights and torso joint length | Arithmetic from the rig | Derived geometry |
| Heads tall and 13 ratio ranges | Arithmetic from dimensions | Derived conservative intervals |
| Thin/heavy builds | Authored soft-tissue multipliers by sex and age | Not BMI or clinical categories |
| Walking, running, head turns, sitting and standing | Literature-informed timing choices | Authored motion estimates |
| Extra actions and global casting envelopes | Authored production defaults | Not measured norms or motion clips |

## Stature calculations

A triplet always means `[min, usual, max]`, but its evidence category matters.

WHO toddler reference: female median 0.906797 m, SD 0.035302 m; male median 0.919327 m, SD 0.034052 m. Bounds use median ± 1.281551566 × SD. They describe a representative 30-month-old, not pooled variability across every month from 2 to 3 years.

For ages 6, 9, 12 and 15.5, published WHO P15, median and P85 are used. Approximate SD = (P85 − P15) / (2 × 1.036433389); bounds = median ± 1.281551566 × SD. This is a normal interpolation from rounded tables, not a direct LMS P10/P90 extraction. It introduces small rounding/interpolation error.

The Bangladesh study's stature means/SDs are female 1566.418/58.554 mm and male 1694.057/62.236 mm. Divide by 1,000 and use mean ± 1.281551566 SD. Participants were 18–30; using this as a 25–40 preset is an explicit age extrapolation. This convenience sample is not a national survey and does not establish all South Asian adult heights. Handprint dimensions were not substituted for relaxed hand breadth.

WHO adolescent profiles and Bangladesh adult profiles use different populations. **Do not interpolate between these rows as one person's growth curve**: the teen usual height may exceed the adult usual height. Choose a consistent population/cohort before animating aging or family growth.

Elder age is represented by 75, with no upper-age guarantee. Longitudinal research reports average loss by 70 of about 3 cm in men and 5 cm in women, increasing by 80 to about 5 and 8 cm. Usual losses here are 4 cm and 6.5 cm. Bounds for height loss and stoop are authored. Elder stature subtracts the usual loss from all three adult stature entries; it does not combine worst-case loss with each endpoint. Arm and leg bones do not shrink. The torso segment shortens. A 4° stoop is an optional pose default, not a claim that all elders stoop; zero is supported.

## Dimensions and internal geometry

All lengths are metres, `headsTall` is dimensionless, and `stoopDeg` is degrees. Motion unit overrides are embedded in the JSON. Extra dimensions `hipJointHeight` and `torsoJointLength` make the skeleton auditable.

The construction is deliberately simple: head height + visible neck length + shoulder pivot height = stature. The shoulder pivot and suprasternal notch use the same height **as a rig approximation only**; real anatomy does not make them identical. Along the arm, shoulder minus upper arm gives elbow height; elbow minus forearm gives wrist height. Along the leg, ankle + shin gives knee height; knee + thigh gives hip-joint height. Torso joint length connects hip to shoulder. Head, neck, torso, thigh, shin and ankle height therefore form a complete vertical chain. Arms do not contribute to the vertical leg chain.

Hip-joint height and crotch height are separate. External hip breadth includes soft tissue and must not be equated with skeletal bitrochanteric breadth. Widths describe relaxed front silhouettes without clothes. Head width excludes the projection of the ears. Hair, shoes and garments are separate assets. Surface/tape upper-arm measurements from NHANES differ from a shoulder-to-elbow joint-centre length; they were not copied into a bone field. Circumferences were not divided by pi to invent front widths.

Head dimensions are separately authored by age; limb and torso ratios also change by age. Girls and boys use the same shape ratios before 10, with their respective height references. Differences begin gradually at 12. This is a limited preset system, not an inference rule about individuals or gender identity.

The brief's “four heads tall” toddler example is a drawing convention, not a measured requirement. These usual toddler presets are about five heads tall; the optional 15% larger cartoon head moves the style toward that convention. Head/neck/pivot placements must be recomputed when applying a head-size change.

Head bounds are usual ±5%. Soft-tissue width bounds use the reference stature endpoints multiplied by age/sex width ratios and ±9%; small joint/hand widths use ±6%. These choices are **authored envelopes**. They are not extracted from NIST, NASA or a South Asian survey. Bone lengths scale with stature within each age preset. Stored numbers have six decimal places for reproducible arithmetic, not six-decimal empirical accuracy.

## Ratios, build selection and global casting

The `real` key is retained to match the requested schema. Here it means the **base estimated envelope**. For positive dimensions, interval lower bound = sum of numerator minima / denominator maximum; upper bound = sum of numerator maxima / denominator minimum. This conservative calculation does not imply those extreme combinations are common, nor that ratios have measured percentile distributions. It can be broad; it is not proof that every drawing inside the interval looks correct.

Do not independently randomize all fields. Use usual values as the coherent default, or fit dimensions under the identities in `rig-rules.json`. Bounds are not three observed people. Do not combine population marginal percentiles and claim a particular multivariate coverage.

For thin/heavy use `buildOverrides[rowId][build]`, a full map for each row. `builds.female` and `builds.male` are adult compatibility defaults only. Every length and stature multiplier stays 1.0. Changes concentrate on waist, depth, upper arms, hips and thighs; hands, wrists and ankles move little. Child multipliers are smaller and use child baselines; sex-specific distribution starts after childhood. These values are style choices, not a medical assertion that all women/men gain weight in the same places. Recompute ratios after applying builds; 28 precomputed profiles are included as an optional convenience.

The female adult/elder “no thicker arms” rule applies to **cartoon expansion beyond the chosen build's envelope**. It does not erase the heavy build or invalidate muscular women. Exceptions should use a deliberately authored additional profile, not a claim that a real person's body is incorrect. All style gates are advisory until reviewed against the actual Zancut renderer.

The request for South Asian reference percentiles and ranges covering everyone cannot be satisfied by one honest statistical interval. `global-casting-envelopes.json` therefore supplies separate, explicitly authored stature bounds, 90% of reference minimum to 110% of reference maximum. These are casting controls, not world population percentiles; they do not guarantee all bodies. When changing stature, scale a complete age/build skeleton consistently, and update motion distances. Custom proportions remain necessary for additional body types.

## Movement and the additional acts

Walking triplets are coupled scenarios: speed = step length × cadence / 60. Cadence counts steps, not strides; a stride has two steps. This avoids independently plausible numbers that produce sliding feet. The same age timing defaults are intentionally shared between the two sex rows; anatomy and character intent can adjust stride length without imposing unnecessary gendered acting.

Running speeds are proposed usable paces, not sprint limits or capability assessments. They require a separate cadence/stride solution. Head-turn speed means mean active rotation speed; use eased starts/stops and calculate rotation duration from angle/speed. The action card's full duration includes anticipation/settling. Sit/stand timings refer to a single movement, not a five-repetition test.

Research on toddler gait, adult gait, single sit/stand cycles and head-eye coordination provides magnitude and mechanism checks. All exported motion ranges remain authored estimates. A single study is not enough to establish sex-by-age-by-build population timing bounds. Assistance and reduced mobility are selected separately from age; old age alone does not require a cane, stoop or difficulty standing.

Added 26 action specifications: idle weight shift; start/stop walk; 90°/180° turns; 45° head look; forward/overhead reach; bend; squat/rise; kneel/rise; step up/down; seated reach; pick up/put down; handover; door push; wave; nod; sit; stand; assisted stand; pre-sit pause. Each has seven age timing triplets, phase fractions and contact guidance. These are **numeric production instructions, not rendered animation or joint keyframes**. Handovers need two actors synchronized; prop attachment changes at contact; stairs and seats need world-size/contact data; transitions need gait-phase alignment. Those mechanisms are recorded in the extra rig rules.

## Validation and remaining work

The included report checks all 14 base profiles, 28 derived build profiles, required fields, sorted finite triplets, full-chain arithmetic, all 13 ratio calculations, cartoon envelopes, bone invariance, gait identity and action-phase totals. Passing these tests establishes arithmetic/structural consistency only.

Not supplied or claimed: measured distributions for every width; validated global percentile coverage; clinical safety limits; a renderer; rig joint-angle limits; actual foot/hand-contact simulation; production motion clips; Zancut engine/selfcheck results. The actual engine and its tests were not in this brief. Before importing, review these estimates in Zancut, check shoulder/head placement, inspect child silhouettes, render all three builds and test chair/stair/prop contacts. Final body-shape acceptance needs that visual review and, for a measured-chart claim, a harmonized anthropometric dataset.

## Source register

Each entry states its actual role. A methodological citation does not make authored numbers measured.

### WHO-0-5 — WHO Child Growth Standards: height-for-age, 2–5 years

https://www.who.int/tools/child-growth-standards/standards/length-height-for-age

Toddler stature at 30 months; normal approximation using published median and SD.

### WHO-5-19 — WHO Growth reference 5–19 years: height-for-age

https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/height-for-age

Stature at 72, 108, 144 and 186 months; approximate P10/P90 reconstructed from P15/P85.

### BD-ADULT — Asadujjaman et al. (2021), Stature estimation from handprint measurements

https://link.springer.com/article/10.1186/s41935-020-00215-1

Bangladeshi young-adult stature sample; not national norms. No handprint-to-hand-width conversion.

### NIST-CHILD — Snyder et al. (1977), Anthropometry of Infants, Children, and Youths to Age 18

https://math.nist.gov/~SRessler/anthrokids/datatoc77.htm

Historical measurement taxonomy only; numerical front widths were not extracted.

### CDC-ADULT — Fryar et al. (2021), Anthropometric Reference Data, United States, 2015–2018

https://www.cdc.gov/nchs/data/series/sr_03/sr03-046-508.pdf

Measurement definitions and external plausibility reference; survey arm length is not a joint-centre bone length.

### NASA-METHOD — NASA Human Integration Design Handbook, Revision 1

https://www.nasa.gov/wp-content/uploads/2023/03/human-integration-design-handbook-revision-1.pdf

Multivariate anthropometry and measurement consistency; not a source of every numeric field.

### AGING — Sorkin et al. (1999), Longitudinal change in height of men and women

https://pubmed.ncbi.nlm.nih.gov/10547143/

Longitudinal age-related stature loss; elder values here interpolate and extrapolate to a representative age of 75.

### GAIT-TODDLER — Guffey et al. (2016), Gait parameters associated with balance in healthy 2–4 year-old children

https://pmc.ncbi.nlm.nih.gov/articles/PMC4681623/

Toddler walking magnitudes; authored coherent gait triplets are not study percentiles.

### GAIT-ADULT — Oberg et al. (1993), Basic gait parameters: reference data for normal subjects, 10–79 years

https://pubmed.ncbi.nlm.nih.gov/8035350/

Age and sex context for gait; no literal per-row normative transcription.

### SIT-STAND — Kerr et al. (1997), Analysis of the sit-stand-sit movement cycle in normal subjects

https://pubmed.ncbi.nlm.nih.gov/11415728/

Single rise/descent timing reference; all exported age ranges are animation estimates.

### HEAD-TURN — Tweed et al. (1995), Eye-head coordination during large gaze shifts

https://pubmed.ncbi.nlm.nih.gov/7760133/

Eased head-turn velocity profile; exported speeds are authored, not measured norms.

### SA-BUILD — South Asian and European body-fat distribution study, PMID 8653149

https://pubmed.ncbi.nlm.nih.gov/8653149/

Supports avoiding one universal body-shape multiplier; no direct conversion of circumference or fat mass to front width.

### DISNEY — Walt Disney Animation Studios: Animation

https://www.disneyanimation.com/process/animation/

Timing, anticipation, follow-through, staging and secondary action inform optional action phases.

### AUTHOR — Zancut authored engineering estimates, 2026-11-06

All non-stature dimensions, build multipliers, cartoon limits, global art envelopes and action prescriptions are estimates; not population percentiles.


## Preview verification

The HTML logic was exercised across all 42 combinations using a DOM stub, including action and ratio counts and play/pause handlers. A full browser render could not run because the environment denied browser socket creation. Visual layout is not verified.
