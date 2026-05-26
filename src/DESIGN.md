<|user|>
how does offworld trading company (economic rts game) determine market prices and how can i create a similar mechanic in my own game?

<|assistant|>
Offworld’s exact source code formula is not public, but the visible mechanic is basically:

**Buying a resource pushes its price up. Selling pushes it down.** Colony consumption also continuously buys certain resources, and shortages/surpluses simulate repeated buy/sell pressure over time. The wiki notes that shortages “simulate buying units” every second, while surpluses simulate selling units; Steam discussion also confirms the colony consumes resources and affects prices. ([Offworld Trading Company Wiki][1])

A good cloneable version:

```python
class Market:
    def __init__(self, base_prices):
        self.price = dict(base_prices)
        self.min_price = 1
        self.max_price = 999

    def buy(self, resource, units):
        """
        Player buys from market.
        Price rises as demand consumes liquidity.
        """
        total_cost = 0

        for _ in range(units):
            p = self.price[resource]
            total_cost += p
            self.price[resource] = min(self.max_price, p + self.price_step(p))

        return total_cost

    def sell(self, resource, units):
        """
        Player sells into market.
        Price falls as supply floods liquidity.
        """
        total_revenue = 0

        for _ in range(units):
            p = self.price[resource]
            total_revenue += p
            self.price[resource] = max(self.min_price, p - self.price_step(p))

        return total_revenue

    def price_step(self, price):
        """
        Higher prices move in larger chunks.
        Tune this curve for game feel.
        """
        if price < 20:
            return 1
        elif price < 100:
            return 2
        elif price < 500:
            return 5
        else:
            return 10
```

Then add **background demand**:

```python
def tick_market(market, colony_demand, dt):
    for resource, demand_per_second in colony_demand.items():
        units = int(demand_per_second * dt)
        market.buy(resource, units)
```

And add **shortage / surplus events**:

```python
def apply_shortage(market, resource, units_per_second, duration_seconds):
    for _ in range(duration_seconds):
        market.buy(resource, int(units_per_second))

def apply_surplus(market, resource, units_per_second, duration_seconds):
    for _ in range(duration_seconds):
        market.sell(resource, int(units_per_second))
```

The core design trick is: **do not calculate price from global inventory directly**. Instead, price is a state variable moved by transactions. That makes the market feel reactive, manipulable, and gameable in the fun Offworld way.

A more tunable version is:

```python
price_change = impact * units / liquidity
```

Where:

```python
new_price = old_price * exp(price_change)
```

For buying:

```python
price *= math.exp(units / liquidity)
```

For selling:

```python
price *= math.exp(-units / liquidity)
```

This gives you a clean market model:

```python
import math

def buy(market, r, units):
    p0 = market.price[r]
    market.price[r] *= math.exp(units / market.liquidity[r])
    return p0 * units

def sell(market, r, units):
    p0 = market.price[r]
    market.price[r] *= math.exp(-units / market.liquidity[r])
    return p0 * units
```

Use **low liquidity** for volatile resources like electronics, chemicals, glass. Use **high liquidity** for basics like water, iron, food.

For your game, I’d implement:

```python
ResourceMarket:
    price
    min_price
    max_price
    liquidity
    background_demand
    background_supply
```

Every tick:

```python
net_flow = background_demand - background_supply
price *= exp(net_flow * dt / liquidity)
```

Every player action:

```python
buy  -> price rises immediately
sell -> price falls immediately
```

That gets you the Offworld-style loop:

**produce what is expensive → selling crashes it → inputs rise if everyone needs them → shortages create spikes → players speculate → market becomes the battlefield.**

[1]: https://offworldtradingcompany.fandom.com/wiki/Market?utm_source=chatgpt.com "Market - Official Offworld Trading Company Wiki - Fandom"

<|user|>
great. so the game has a ton of players constantly making resources and so i want people to be able to trade between them with real market dynamics. there is no 'currency' yet, just three resources and a global mmo map (openfront). the more territory you own, the more you harvest over time and depending on the land type, which resources you specialize in changes. so im thinking of a market where you can add extra resources to a liquidity pool to sell them over time vs an immediate exchange where i need a certain resource ASAP from other players and how to make that as simple as a mechanic as possible while still having supply and demand dynamics

<|assistant|>
You are basically describing a hybrid of:

- an RTS resource economy,
- a player-driven commodity market,
- and an MMO-scale territorial production simulation.

The important thing is:

> You do NOT actually want a “realistic financial market.”
>
> You want:
>
> - intuitive player behavior,
> - visible supply/demand,
> - strategic geography,
> - and emergent economic warfare.

The simplest successful design is usually:

# 1. Separate the economy into TWO layers

## A. Instant Market (“spot market”)

Players:

- buy instantly,
- sell instantly,
- price changes immediately.

This solves:

- urgency,
- gameplay fluidity,
- resource balancing.

Think:

- “I need iron NOW.”
- “I have excess food NOW.”

This is the Offworld-style layer.

---

## B. Passive Sell Orders (“market supply”)

Players can:

- deposit resources into a regional/global market,
- which slowly fills demand over time,
- earning currency automatically.

This solves:

- specialization,
- long-term production,
- trade gameplay,
- regional economics.

Think:

- “I control forests so I produce wood efficiently.”
- “I’ll continuously export wood.”

---

# 2. DO NOT start with an order book

A real bid/ask order book sounds cool but creates:

- illiquidity,
- complexity,
- dead markets,
- weird UX,
- noob confusion.

You probably want:

```text
Players interact with ONE visible price.
```

Like:

| Resource | Price |
| -------- | ----- |
| Food     | 12    |
| Iron     | 48    |
| Energy   | 30    |

That price moves dynamically.

This is psychologically important.

Players immediately understand:

- scarcity,
- opportunity,
- specialization.

---

# 3. The cleanest MMO model: “Global Liquidity Buckets”

Instead of matching buyers/sellers directly:

Each resource has:

```python
ResourceMarket:
    price
    liquidity
    pooled_supply
    recent_volume
```

Players:

- add resources to the supply pool,
- or instantly buy from it.

---

# 4. Core mechanic

## Selling passively

Player deposits:

```text
1000 wood
```

into market supply.

The market slowly absorbs it.

As global buyers consume wood:

- suppliers receive payout,
- supply decreases,
- price responds naturally.

This creates:

- producers,
- exporters,
- regional economies.

WITHOUT requiring:

- matching engines,
- online sellers,
- complicated auctions.

---

# 5. Instant buys create demand spikes

If a player suddenly buys:

```text
500 iron
```

then:

```python
price += impact
available_supply -= 500
```

Now:

- iron spikes globally,
- iron-producing territories become valuable,
- wars emerge naturally.

That is exactly the emergent gameplay you want.

---

# 6. The MOST important variable is liquidity

Liquidity determines:

- volatility,
- manipulation resistance,
- market feel.

Low liquidity:

- prices explode easily,
- markets are unstable,
- good for rare resources.

High liquidity:

- stable economy,
- smooth prices,
- good for staple resources.

Formula:

```python
price *= exp(order_size / liquidity)
```

or simpler:

```python
price += order_size / liquidity
```

---

# 7. Regional markets are where this becomes REALLY interesting

Instead of one global market:

```text
North Market
South Market
Island Market
Frontier Market
```

Each has:

- independent prices,
- independent supply,
- transport costs.

Then geography matters.

Now territory ownership matters economically.

Players become:

- exporters,
- smugglers,
- monopolists,
- pirates/blockaders.

This creates natural politics.

---

# 8. A VERY strong simple model

Honestly, this is probably enough:

```python
class ResourceMarket:
    price
    supply_pool
    liquidity
```

## Sell

```python
market.supply_pool += amount
price *= exp(-amount / liquidity)
```

## Buy

```python
if amount > market.supply_pool:
    amount = market.supply_pool

market.supply_pool -= amount
price *= exp(amount / liquidity)
```

That alone creates:

- supply/demand,
- speculation,
- hoarding,
- shortages,
- boom/bust cycles.

---

# 9. Avoid “currencyless barter” initially

Without a universal unit:

- pricing becomes unreadable,
- players struggle to reason economically,
- markets fragment badly.

Even if lore-wise there’s no money:

just invent:

- credits,
- logistics points,
- trade vouchers,
- energy units,
- influence,
- “market access.”

You REALLY want:

- a numeraire,
- a common pricing denominator.

Otherwise:

- Wood ↔ Iron ↔ Food triangles become chaotic.

---

# 10. The hidden genius of Offworld

The market itself becomes:

- the battlefield,
- the balancing system,
- the anti-snowball mechanic.

If one faction dominates iron:

- iron crashes,
- profits collapse,
- alternative industries become better.

That self-balancing dynamic is incredibly powerful.

---

# 11. What I would build first

## MVP

Three resources:

- Food
- Iron
- Energy

Global market only.

Each resource:

```python
price
liquidity
supply_pool
```

Actions:

- instant buy,
- instant sell,
- passive supply deposit.

Then:

- prices move continuously,
- charts visible globally,
- territory types specialize production.

That is already enough for emergent gameplay.

---

# 12. The REALLY important design decision

Decide whether:

- resources are destroyed on use,
- or conserved.

This changes EVERYTHING.

## Conserved economy

(resources mostly transfer)

Leads to:

- accumulation,
- wealth concentration,
- stagnation.

## Consumptive economy

(resources constantly sink)

Leads to:

- permanent demand,
- active trade,
- healthy economy.

MMOs almost always need:

- strong sinks.

Examples:

- upkeep,
- unit maintenance,
- fuel,
- construction consumption,
- spoilage,
- ammo,
- war attrition.

Without sinks:
economies die.

<|user|>
The three resources are biomass fuel and metals. There are troops and the potential for gold. Building things like cities and factories to increase troop and resource capacity costs resources. Ports ship across water. Nations can attack each other in a Risk style fashion where the number of attacking troops can grind out against the defenders totals

<|assistant|>
This is actually a very strong setup for an emergent macroeconomic war game because your resources already map naturally into economic roles:

| Resource | Economic Role                        | Strategic Meaning |
| -------- | ------------------------------------ | ----------------- |
| Biomass  | population / food / growth           | sustain expansion |
| Fuel     | logistics / mobility / warfare       | operational tempo |
| Metals   | infrastructure / military production | industrial power  |

That triangle is good because it creates:

- natural specialization,
- chokepoints,
- asymmetric warfare,
- and interdependence.

You are very close to a system where:

- wars reshape markets,
- markets reshape wars,
- geography reshapes both.

The key is to make:

> territory → production → logistics → market → military
> all part of one loop.

---

# 1. Your economy should NOT be symmetric

This is extremely important.

Different land should heavily favor different outputs.

Example:

| Territory Type |          Biomass |             Fuel |           Metals |
| -------------- | ---------------: | ---------------: | ---------------: |
| Farmland       |              +++ |                + |                - |
| Oil Basin      |                - |              +++ |                - |
| Mountains      |                - |                - |              +++ |
| Cities         |        ++ demand |        ++ demand |        ++ demand |
| Ports          | trade multiplier | trade multiplier | trade multiplier |

This naturally creates:

- trade routes,
- strategic dependence,
- wars over geography.

If every region can produce everything reasonably well:
the market dies.

---

# 2. Fuel should govern military projection

This is the MOST important balancing lever.

Troops should not simply exist.

They should require:

- fuel upkeep,
- fuel movement,
- fuel attack costs.

Example:

```python
attack_cost = troops_sent * fuel_per_troop
```

Now:

- massive invasions shock fuel demand,
- oil-rich regions matter,
- blockades matter,
- overextension matters.

This creates real geopolitics.

---

# 3. Biomass should govern troop recovery / population

Do NOT make biomass just “food.”

Instead:

```text
Biomass = demographic capacity
```

Meaning:

- troop replenishment,
- city growth,
- worker capacity,
- colonization.

Without biomass:

- armies cannot regenerate.

This creates:

- attritional warfare,
- siege dynamics,
- starvation wars.

---

# 4. Metals should gate industrial scaling

Metals should bottleneck:

- cities,
- factories,
- ports,
- max population,
- fortifications.

Meaning:

```text
Fuel wins battles.
Metals win production wars.
Biomass wins long wars.
```

That triangle is extremely healthy.

---

# 5. The market should primarily react to WAR

This is where your economy becomes exciting.

A big invasion should create:

## Fuel spike

because:

- fleets move,
- armies mobilize,
- logistics increase.

## Metal spike

because:

- players rebuild,
- produce infrastructure,
- replace losses.

## Biomass spike

because:

- replenishment needed,
- cities lost,
- populations strained.

Now:
the market becomes the “global nervous system” of war.

Players can literally see:

> “A huge war just started in the east.”

from prices alone.

That is powerful.

---

# 6. Your ports are secretly the most important structure

Ports should:

- lower transport friction,
- increase trade throughput,
- connect regional markets,
- enable naval projection.

Without ports:

- regional shortages occur,
- isolated economies emerge.

This is GOOD.

You do NOT want perfect global efficiency.

Friction creates:

- arbitrage,
- strategy,
- economic geography.

---

# 7. The best market structure for your game

I would strongly recommend:

# Regional automated markets

NOT player-to-player direct trading.

Each region has:

```python
class Market:
    biomass_supply
    fuel_supply
    metals_supply

    biomass_price
    fuel_price
    metals_price

    liquidity
```

Players:

- deposit excess automatically,
- buy instantly,
- transport between markets via ports/routes.

This keeps UX simple while preserving:

- supply/demand,
- regional economics,
- speculation.

---

# 8. The crucial mechanic: transport latency

Resources should NOT teleport instantly globally.

Instead:

```text
Port -> shipping route -> destination port
```

with:

- time delay,
- piracy risk,
- blockade risk,
- throughput caps.

This creates:

- strategic naval warfare,
- trade lane warfare,
- economic disruption gameplay.

Now fuel-rich islands matter enormously.

---

# 9. Your biggest future danger: runaway snowballing

Risk-style games naturally snowball.

The economy must counteract this.

The easiest solution:

# Expansion increases maintenance burden

Large empires consume more:

```python
fuel_upkeep_per_tick
biomass_upkeep_per_tick
city_stability_cost
```

This creates:

- imperial overstretch,
- fragmentation pressure,
- logistical warfare.

Then smaller players can:

- disrupt trade,
- attack supply chains,
- manipulate markets.

---

# 10. Gold (or currency) should probably exist eventually

You can technically do barter.

But the game becomes MUCH cleaner if you have:

```text
Credits / Treasury / Trade Currency
```

Why?

Because:

- prices become understandable,
- charts become meaningful,
- markets stabilize,
- taxation becomes possible.

You can lore-wrap it however you want:

- “state credits,”
- “shipping contracts,”
- “trade certificates,”
- etc.

---

# 11. The elegant simple implementation

Honestly, this is enough:

## Each market tracks:

```python
price
supply
liquidity
```

## Buy:

P*{new}=P*{old}e^{Q/L}

Where:

- (Q) = quantity bought
- (L) = liquidity

## Sell:

P*{new}=P*{old}e^{-Q/L}

This gives:

- smooth price curves,
- volatility,
- scarcity spikes,
- manipulability.

And it is incredibly easy to tune.

---

# 12. What will ACTUALLY emerge

If done correctly, players will naturally become:

- oil states,
- industrial powers,
- breadbasket nations,
- shipping empires,
- pirates,
- mercenaries,
- blockade specialists,
- economic manipulators.

WITHOUT you scripting any of it.

That is the magic of a good economic RTS/MMO system.

<|user|>
Great. This is an amazing base. I already have terrain specialization and the game I am modifying already has train networks, ships, naval warfare, land trade between neighbors (simple gold multiplier), alliances which boost gold generation. My modifications are around abstracting gold out and creating this trade dynamic

<|assistant|>
Then you are in an extremely strong position because the hard part already exists:

- geography,
- logistics,
- adjacency,
- naval projection,
- territorial warfare,
- alliances.

Those are the REAL foundations of an economic strategy game.

What you are really building now is:

> a resource-flow civilization layer on top of a Risk-style warfare engine.

And honestly:
removing “gold as magic abstract money generation” is probably the correct move.

Because right now your systems already imply:

- physical logistics,
- industrial geography,
- wartime supply chains.

Gold generation is likely bypassing all the interesting dynamics.

---

# The key insight

You do NOT actually need “money” initially.

You can instead model:

```text
economic power = resource throughput
```

Meaning:

- cities,
- troops,
- expansion,
- infrastructure,
- logistics

all consume REAL resources.

That is much more interesting.

---

# What gold currently does in strategy games

Gold is usually:

- compressed logistics,
- generalized labor,
- taxation abstraction,
- trade abstraction.

But you ALREADY HAVE:

- ports,
- rail,
- terrain,
- shipping,
- adjacency,
- alliances.

So you can physically simulate much of this instead.

That is much richer.

---

# The direction I would go

Instead of:

```text
territory -> gold
gold -> everything
```

Do:

```text
territory -> resources
resources -> logistics + industry + war
```

That creates:

- physical economies,
- actual supply chains,
- regional dependence.

---

# Your biggest design opportunity:

# FLOW ECONOMY

Do NOT think in:

- stockpiles only.

Think in:

- continuous flows.

Example:

```text
Biomass per minute
Fuel per minute
Metals per minute
```

Cities:

- consume continuously.

Troops:

- consume continuously.

Rail:

- transports continuously.

Ports:

- transfer continuously.

Now the game becomes:

> maintaining stable economic throughput under wartime disruption.

That is VERY compelling.

---

# The best abstraction level

Do NOT simulate:

- individual workers,
- individual trains,
- exact shipping manifests.

Instead simulate:

```python
edge_capacity_per_tick
```

Example:

```python
rail_capacity = 500 fuel/min
port_capacity = 2000 resources/min
```

Then resources “flow” through the network mathematically.

This gives:

- scalability,
- MMO feasibility,
- emergent chokepoints.

---

# Your existing alliances mechanic can become INCREDIBLE

Instead of:

- “+gold multiplier”

Alliances should become:

# Shared market access

Meaning:

- lower tariffs,
- shared rail throughput,
- shared port access,
- resource visibility,
- automatic balancing.

Now alliances become ECONOMIC unions.

Which is much more realistic and strategic.

---

# What I would remove entirely

Probably:

- direct gold income,
- magical passive money,
- arbitrary upkeep numbers disconnected from economy.

Instead:

# Everything should physically consume resources

Example:

| System         | Consumes       |
| -------------- | -------------- |
| Troops         | biomass + fuel |
| Factories      | fuel           |
| Cities         | biomass        |
| Ports          | metals + fuel  |
| Rail           | fuel + metals  |
| Ships          | huge fuel      |
| Fortifications | metals         |

Now war literally strains the economy.

---

# The market model you probably want

You are actually describing something closer to:

# An automated commodity exchange

NOT:

- direct player trading.

Meaning:

- players inject supply,
- players consume demand,
- prices emerge globally/regionally.

This is MUCH better for MMO scale.

---

# The hidden danger:

# Hoarding

Without sinks:

- dominant alliances accumulate infinite power.

You MUST have:

- attrition,
- upkeep,
- decay,
- maintenance,
- logistics strain.

Otherwise:
the economy freezes.

---

# The MOST important mechanic you can add

# Transport friction

This is where the game becomes genius.

Resources should NOT move freely.

Example:

```text
Local Market Price != Global Price
```

Fuel on an island:

- may become EXTREMELY expensive during blockade.

Metals inland:

- may become cheap near mines.

This creates:

- arbitrage,
- naval warfare importance,
- economic geography.

---

# Your rail system can become the entire economy

This is where things get really interesting.

Rail is not just movement.

Rail becomes:

- industrial bloodstream,
- strategic infrastructure,
- wartime target.

Destroy rail:

- cities starve,
- armies stop,
- factories shut down.

Now infrastructure warfare matters.

---

# The elegant architecture

Honestly, this is probably enough:

## Regions produce:

```python
biomass_rate
fuel_rate
metal_rate
```

## Regions consume:

```python
city_upkeep
troop_upkeep
industry_upkeep
```

## Excess enters regional market:

```python
surplus -> market liquidity
```

## Deficits buy automatically:

```python
market purchase -> local deficit filled
```

## Prices react:

- shortages spike prices,
- surpluses crash prices.

Simple.
Scalable.
Emergent.

---

# The REALLY important thing:

# Keep prices visible

Players LOVE:

- watching charts,
- predicting wars,
- speculating.

Price charts become:

- geopolitical intelligence.

Example:

```text
Fuel suddenly spikes 300%.
```

Players immediately infer:

> “Someone is mobilizing fleets.”

That is incredible emergent storytelling.

---

# What your game may eventually evolve into

If successful, players will naturally form:

- industrial alliances,
- shipping cartels,
- resource protectorates,
- naval coalitions,
- fuel monopolies,
- logistics empires.

And all of that emerges from:

- terrain,
- logistics,
- and resource flow.

That is exactly the kind of systemic depth that creates legendary strategy sandboxes.
