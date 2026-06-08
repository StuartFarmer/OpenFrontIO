# Competitive AI Notes

This note captures the current thinking on AI for a Foundation-like game that is
closer to a battle royale than a pure colony sim. The important difference from
OpenFront is that the game still has strong economic and logistical dynamics,
but the end goal is competitive survival and domination rather than only
internal optimization.

## Core framing

The AI should not be treated as one monolithic decision-maker. A better shape
is a layered system:

1. `Economy manager`
   - keeps food, labor, production, and logistics stable
   - chooses build order and expansion priorities

2. `Strategic planner`
   - decides when to turtle, expand, tech, pressure, or attack
   - models opponent threat, timing windows, and map control

3. `Tactical layer`
   - executes fights, raids, retreats, positioning, and focus fire

The economy is still important, but it exists in service of competitive goals.
That means the AI needs to understand both long-horizon growth and opponent
pressure.

## What algorithms fit

The most useful algorithm families are:

1. `Utility AI`
   - good for choosing the current priority across many competing needs
   - useful for economy stabilization and high-level goal scoring

2. `Search with rollout simulation`
   - useful for comparing candidate build orders, attacks, and recovery plans
   - `beam search`, `A*`, or `MCTS` can all work depending on branching factor

3. `GOAP` or `HTN` planning
   - useful for multi-step strategic actions with explicit dependencies
   - good when the AI needs to reason about prerequisites and transitions

4. `Optimization / scheduling`
   - useful for labor allocation, production balancing, and logistics
   - useful anywhere the problem is mostly constrained resource assignment

5. `Bandits`
   - useful for repeated recurring choices with a small action set
   - useful for selecting among known tactical or economic policies

6. `Evolutionary tuning`
   - useful for tuning utility weights and balance parameters
   - often cheaper and easier to iterate than direct RL

## Where RL fits

`RL` becomes more relevant in a competitive setting because self-play can
produce opponent-aware behavior. But it is still usually a bad idea to start
with pure end-to-end RL for the whole game.

Recommended split:

1. `Economy layer`
   - mostly explicit rules, heuristics, and utility scoring
   - keep the hard constraints visible and debuggable

2. `Strategy / combat layer`
   - good place for self-play RL
   - useful for timing attacks, defending windows, and adapting to opponents

3. `Value estimation`
   - a neural net can score states or candidate plans
   - useful as a helper inside search, not necessarily as the whole policy

This division keeps the expensive learned part where the game is most
competitive and most difficult to hand-script.

## Why not pure end-to-end learning

Pure neural control tends to break down when:

1. the action space is large
2. rewards are delayed
3. there are many hard constraints
4. the system has long causal chains

That is exactly the shape of a colony-plus-strategy game. The economy layer is
usually better modeled explicitly, while self-play can focus on the competing
decisions that actually benefit from adversarial training.

## Practical architecture

A workable implementation would look like this:

1. Build explicit world-state features
   - resources
   - labor
   - production rates
   - storage pressure
   - territory control
   - threat level
   - growth potential
   - bottlenecks

2. Score candidate goals with utility functions
   - survive
   - stabilize economy
   - expand
   - deny opponent
   - attack at a good timing window

3. Use search or rollouts for expensive decisions
   - test multiple build orders
   - test attack timing choices
   - compare recovery plans after losses

4. Tune weights and thresholds with automation
   - evolutionary search for utility tuning
   - self-play for strategic adaptation

5. Keep the AI debuggable
   - show current goals and scores
   - show why a plan was chosen
   - show what alternatives were rejected

## Working hypothesis

The best default assumption is:

- `economy = explicit planner + heuristics`
- `strategy/combat = self-play-trained policy`
- `tuning = search or evolutionary optimization`

That gives a tractable system that can still learn from competition without
trying to learn the entire game from scratch.

## Open questions

1. How much of the game is actually zero-sum versus economically coupled?
2. Which parts of the decision space are most expensive to hand-script?
3. Do we have replay data or simulation throughput sufficient for self-play?
4. Which layer needs to be strong first: survival, expansion, or combat timing?
