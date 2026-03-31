# ittx-mttl

Simple browser app to run a table tennis tournament:

- Creates mostly groups of **3 players** from an entered player list.
- Lets you select winners for group-stage matches.
- Ranks each group by wins (alphabetical tie-breaker).
- Sends top 2 of each group to **Level 1 knockout**.
- Sends remaining players to **Level 2 knockout**.

## Run

Open `index.html` in your browser.

## Notes

- If player count is not divisible by 3, last players are redistributed to earlier groups.
- Non-3-sized groups are marked as non-standard and do not auto-generate round-robin matches.
