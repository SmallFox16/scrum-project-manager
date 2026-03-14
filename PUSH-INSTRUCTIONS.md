# Push to GitHub — if login popup fails

Your branch is now **main**. Follow one of these:

---

## Option A: Use a Personal Access Token (most reliable)

1. **Create a token on GitHub**
   - Go to: https://github.com/settings/tokens
   - Click **"Generate new token (classic)"**
   - Name it (e.g. "Scrum Project Manager"), enable **repo**, then **Generate token**
   - **Copy the token** (you won’t see it again)

2. **Push using the token**
   - In terminal, run:
     ```bash
     git push -u origin main
     ```
   - When asked for **username**: enter your GitHub username (e.g. `SmallFox16`)
   - When asked for **password**: paste the **token** (not your GitHub password)

---

## Option B: Create the repo first (if you haven’t)

1. Go to **https://github.com/new**
2. Repository name: **scrum-project-manager**
3. Leave "Add a README" **unchecked**
4. Click **Create repository**
5. Then run: `git push -u origin main` and sign in when prompted

---

## Option C: Fix stored credentials (Windows)

1. Open **Control Panel** → **Credential Manager** → **Windows Credentials**
2. Under "Generic Credentials", find **git:https://github.com**
3. Remove it, then run `git push -u origin main` again and sign in when prompted
