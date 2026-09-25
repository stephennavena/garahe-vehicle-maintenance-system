# Security checklist template

Copy this into your workspace `project/SECURITY-CHECKLIST.md` and fill it in
before you make your project repository public.

Every row gets one of **Yes**, **No** or **N/A**, and one line of evidence in
your own words: what you checked, where, and what you found. "N/A" is a correct
answer when it is true, but it needs its reason. A blank row scores nothing, and
a Yes your repository contradicts scores nothing either.

Replace the example evidence with your own.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | | e.g. `.gitignore` line 3, and `git ls-files` shows no `.env` |
| 2 | A `.env.example` with placeholder values only is committed | | |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | | |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | | |
| 5 | Any credential that was ever committed has been rotated | | |
| 6 | Production credentials live only in my hosting provider's environment settings | | |

## GitHub Actions

If your project has no workflows, mark every row N/A and say so once.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | | |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | | |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | | |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | | |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | | |
| 12 | Secret scanning and push protection are enabled on the repository | | |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | | e.g. all queries in `db.js` use `$1` placeholders |
| 14 | The database is not open to the whole internet, or is reachable only by the app | | |
| 15 | The database user the app connects as has only the permissions it needs | | |
| 16 | Seed and sample data is invented, not real people's data | | |
| 17 | Debug, seed and reset routes are removed before going public | | |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | | |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | | |
| 20 | If Zero Trust: tjakoen.s@gmail.com is on the access policy. If an app password: the credentials are in my private workspace `project/README.md` | | |
| 21 | The gate covers every route, including the ones that only change data | | |
| 22 | The credentials for the gate are environment variables, not in source | | |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | | |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | | |
| 25 | Error responses do not expose stack traces, file paths or connection details | | |
| 26 | CORS is not a wildcard on routes that change data | | |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | | |
| 28 | No classmate's personal data in the repository | | |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | | |
| 30 | Images, fonts and other assets are mine, licensed, or credited | | |
| 31 | Repository visibility is deliberate, and I checked it after my last push | | |

## Anything I found and fixed

Write two or three sentences. What did this checklist catch that you did not
already know about, and what did you change? If it caught nothing, say that. An
honest "nothing, and here is what I checked" is worth more than an invented
finding.
