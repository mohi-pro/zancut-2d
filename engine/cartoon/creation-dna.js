// Shared schema for persisted procedural recipes. Plain data only; no user JavaScript or arbitrary SVG.
(function(root) {
  const PROPS = ['sword','car','shield','umbrella','stick','book','lantern','boat','tree','house'];
  const CREATURES = ['horse','monster','dragon','ghost','tiger','dog','cat','cow','fish','bird'];
  const QUADRUPEDS = ['horse','tiger','dog','cat','cow'];
  const ARCHETYPES = ['monster','warrior','human','robot','dragon','king','ghost', ...QUADRUPEDS.filter(a => a !== 'horse'), 'horse','fish','bird', ...PROPS];
  const kindOf = a => PROPS.includes(a) ? 'prop' : CREATURES.includes(a) ? 'creature' : 'character';
  // Humanoids use the anatomy solver (arms, hands, held props); quadrupeds, fish and birds have their own bodies and no arms.
  const isHumanoid = a => kindOf(a) !== 'prop' && !QUADRUPEDS.includes(a) && a !== 'fish' && a !== 'bird';
  const EFFECTS = ['fire_aura','ice_tint','cracked_overlay'];
  function validate(d, depth = 0) {
    if (!d || typeof d !== 'object' || Array.isArray(d) || d.version !== 1 || !ARCHETYPES.includes(d.archetype)) throw new Error('Unsupported creation DNA.');
    const kind = kindOf(d.archetype);
    if (d.kind !== kind || !Number.isFinite(d.scale) || d.scale < 0.4 || d.scale > 2) throw new Error('Invalid creation kind/scale.');
    if (!Number.isInteger(d.headCount) || d.headCount < (kind === 'prop' ? 0 : 1) || d.headCount > (kind === 'prop' ? 0 : 6)) throw new Error('Head count must be 1–6 (0 for props).');
    if (!Number.isInteger(d.armCount) || d.armCount < 0 || d.armCount > 8 || (!isHumanoid(d.archetype) && d.armCount !== 0)) throw new Error('Arm count must be 0–8 (0 for props, animals, fish and birds).');
    if (!Array.isArray(d.headAngles) || d.headAngles.length !== d.headCount || d.headAngles.some(a => !Number.isFinite(a) || Math.abs(a) > 25)) throw new Error('Invalid neck mounting angles.');
    if (!d.palette || !['primary','secondary','accent'].every(k => /^#[\da-f]{6}$/i.test(d.palette[k] || ''))) throw new Error('Invalid creation palette.');
    if (!d.traits || !['horns','fangs','glowingEyes'].every(k => typeof d.traits[k] === 'boolean')) throw new Error('Invalid creature traits.');
    if (!Array.isArray(d.effects) || d.effects.length > 3 || new Set(d.effects).size !== d.effects.length || d.effects.some(x => !EFFECTS.includes(x))) throw new Error('Invalid elemental effects.');
    if (!Array.isArray(d.attachments) || d.attachments.length > 1 || d.attachments.some(x => x !== 'wings_attachment') || typeof d.floating !== 'boolean') throw new Error('Invalid attachments.');
    if (!Array.isArray(d.held) || d.held.length > 2 || depth > 1 || (!isHumanoid(d.archetype) && d.held.length)) throw new Error('Invalid composite attachments.');
    for (const p of d.held) { if (!['L','R'].includes(p.hand) || p.dna?.kind !== 'prop') throw new Error('Held objects must be props mounted to a hand.'); validate(p.dna, depth + 1); }
    return d;
  }
  root.ZDNA = { validate, ARCHETYPES, EFFECTS, PROPS, CREATURES, QUADRUPEDS, kindOf, isHumanoid };
})(typeof window !== 'undefined' ? window : globalThis);
