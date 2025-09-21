// Simple harness to test BYE assignment logic copied from server/server.js
function positions(size) {
  function build(n) {
    if (n === 2) return [1, 2];
    const prev = build(n / 2);
    const out = [];
    for (let i = 0; i < prev.length; i++) {
      out.push(prev[i]);
      out.push(n + 1 - prev[i]);
    }
    return out;
  }
  return build(size);
}

function assignSlots(N, seedCount, rankedList) {
  const M = rankedList.length;
  const S = Math.min(seedCount || 0, 32, N, M);
  const seeds = rankedList.slice(0, S);
  const rest  = rankedList.slice(S);

  // randomization removed for deterministic test
  const order = positions(N);
  const slots = new Array(N).fill(0);
  for (let i = 0; i < S; i++) {
    const slotIndex = order[i] - 1;
    slots[slotIndex] = seeds[i];
  }
  const byes = N - M;
  const seedSet = new Set(seeds);
  const rankedNotSeeded = rankedList.map(r => r).filter(pid => !seedSet.has(pid));
  const orderPositions = order.map(x => x - 1);

  let byeAssigned = 0;
  const seedSlots = new Set(order.slice(0, S).map(x => x - 1));

  // First pass: top seeds
  for (let i = 0; i < S && byeAssigned < byes; i++) {
    const pid = seeds[i];
    const seedSlot = order[i] - 1;
    const curIndex = slots.findIndex(s => s === pid);
    if (curIndex !== -1 && curIndex !== seedSlot) {
      const tmp = slots[seedSlot];
      slots[seedSlot] = pid;
      slots[curIndex] = tmp;
    } else if (curIndex === -1) {
      slots[seedSlot] = pid;
    }
    const opp = seedSlot ^ 1;
    if (slots[opp] === 0) {
      slots[opp] = -1;
      byeAssigned++;
      continue;
    }
    if (slots[opp] > 0) {
      const occupant = slots[opp];
      let emptyIndex = -1;
      for (let k = 0; k < N; k++) {
        if (slots[k] === 0 && !seedSlots.has(k) && k !== opp) { emptyIndex = k; break; }
      }
      if (emptyIndex !== -1) {
        slots[emptyIndex] = occupant;
        slots[opp] = -1;
        byeAssigned++;
        continue;
      }
      const reservedOpps = new Set();
      for (let j = 0; j < i; j++) reservedOpps.add((order[j] - 1) ^ 1);
      let swapIndex = -1;
      for (let k = 0; k < N; k++) {
        if (slots[k] > 0 && !seedSlots.has(k) && !reservedOpps.has(k) && k !== opp) { swapIndex = k; break; }
      }
      if (swapIndex !== -1) {
        slots[swapIndex] = occupant;
        slots[opp] = -1;
        byeAssigned++;
        continue;
      }
    }
  }

  // Second pass: assign remaining BYEs to next-ranked (non-seeded) entrants
  if (byeAssigned < byes) {
    const orderedNonSeeds = rankedNotSeeded.slice();
    for (const pid of orderedNonSeeds) {
      if (byeAssigned >= byes) break;
      let foundDesired = -1;
      for (const desired of orderPositions) {
        const opp = desired ^ 1;
        if (slots[desired] === pid) { foundDesired = desired; break; }
        if (slots[desired] === 0 && slots[opp] === 0) { foundDesired = desired; break; }
      }
      if (foundDesired === -1) continue;
      const curIndex2 = slots.findIndex(s => s === pid);
      if (curIndex2 !== -1 && curIndex2 !== foundDesired) {
        const temp = slots[foundDesired];
        slots[foundDesired] = slots[curIndex2];
        slots[curIndex2] = temp;
      } else if (curIndex2 === -1) {
        slots[foundDesired] = pid;
      }
      const opp2 = foundDesired ^ 1;
      if (slots[opp2] === 0) {
        slots[opp2] = -1;
        byeAssigned++;
      } else if (slots[opp2] > 0) {
        const occupant2 = slots[opp2];
        const emptyIndex2 = slots.findIndex(s => s === 0);
        if (emptyIndex2 !== -1) {
          slots[emptyIndex2] = occupant2;
          slots[opp2] = -1;
          byeAssigned++;
        }
      }
    }
  }

  // Fill remaining with rest
  let rIdx = 0;
  for (let i = 0; i < N && rIdx < rest.length; i++) {
    if (slots[i] === 0) {
      while (rIdx < rest.length && slots.includes(rest[rIdx])) rIdx++;
      if (rIdx < rest.length) slots[i] = rest[rIdx++];
    }
  }

  return slots;
}

function describe(slots) {
  return slots.map(s => (s === 0 ? '.' : s === -1 ? 'BYE' : String(s))).join('|');
}

// Test cases
const scenarios = [
  { N:4, seedCount:2, ranked:[1,2,3] },
  { N:4, seedCount:2, ranked:[10,20,30] },
  { N:8, seedCount:4, ranked:[1,2,3,4,5] },
  { N:8, seedCount:2, ranked:[1,2,3,4,5,6] }
];

for (const s of scenarios) {
  const slots = assignSlots(s.N, s.seedCount, s.ranked);
  console.log(`N=${s.N} seeds=${s.seedCount} ranked=${JSON.stringify(s.ranked)} -> ${describe(slots)}`);
}
