# Publish All Nighter Homie on your GitHub profile

The ZIP contains the complete project. Your API key is not included and should never be added to GitHub.

## Option 1: Upload using GitHub in your browser

1. Extract `All-Nighter-Homie.zip` on your laptop.
2. In GitHub, create a **public** repository named **All-Nighter-Homie** under **harshitCorteX**. For a clean upload, leave the initial README, license and `.gitignore` options unchecked.
3. Choose **uploading an existing file** on the empty repository page. Upload the **contents inside** the extracted `All-Nighter-Homie` folder, including `assets`, `tests`, and `.github`. Do not upload the outer folder or the ZIP itself. `index.html` must appear at the repository root.
4. Commit the files to **main**. The repository's README will appear on your profile's project page. You can pin the repository to your profile if you like.
5. Open **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
6. Open **Actions → Publish All Nighter Homie → Run workflow**, select **main**, and run it. If the initial run started before you enabled Pages, this new run is the one to use.
7. Wait for the workflow to finish successfully. The **github-pages** deployment shows the exact public URL. For this repository name it should be:

   **https://harshitcortex.github.io/All-Nighter-Homie/**

8. Open that URL and choose **Meet your study homie**. Once you see the sample lesson, send the link to anyone who wants to use it. They do not need GitHub or Node.js installed.

GitHub documents the Pages workflow and required configuration in its [official custom workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Option 2: Push with Git

Create the empty public repository first. Then open a terminal **inside the extracted project folder**:

```sh
git init -b main
git add .
git commit -m "Launch All Nighter Homie"
git remote add origin https://github.com/harshitCorteX/All-Nighter-Homie.git
git push -u origin main
```

Sign in to GitHub if Git asks. Follow steps 5–8 above to enable and publish Pages. Do not use `git init` if you are copying these files into an existing clone: use its current branch, commit the changes and push normally.

## Update your existing AI-Study-Buddy repository instead

Copy this project's files into the existing clone and replace matching application files. Keep the included `assets`, tests and workflow folders together. Commit and push to main, then enable **GitHub Actions** as the Pages source and run **Publish All Nighter Homie**.

The interface will say **All Nighter Homie**, while the Pages URL remains:

```text
https://harshitcortex.github.io/AI-Study-Buddy/
```

Changing the app name does not require renaming the repository. If you rename the repository, GitHub Pages uses the new repository name in its URL; use the deployment's shown link after publishing.

## How your friends use it

Send them a hosted link. They open it in their laptop or phone browser and can use the sample immediately. For personalised AI, each person selects **Connect AI**, enters their own Groq key, tests it and saves. The key is held only for the current tab and must be re-entered after reload.

Their notes belong to their own browser. Nobody gets your notes or key by opening the same app URL. There is no shared login or central notes database. The app's **Share** button copies its current hosted URL.

## If publishing fails

- **Pages is not enabled / 404 during configure-pages:** choose **GitHub Actions** in Settings → Pages, then rerun the publishing workflow.
- **Workflow folder missing:** ensure `.github/workflows/pages.yml` exists in the repository. Some upload tools hide folders beginning with a dot; use Git if needed.
- **Blank or unstyled app:** check that `index.html`, `styles.css`, `core.js`, `app.js` and `assets` are all in the correct root directory. Upload folder contents rather than nesting everything in another project folder.
- **New changes seem stale:** the interface uses network-first caching. Reconnect and reload; if necessary, clear site data in your browser, after exporting notes you need to keep.
- **AI cannot connect:** use **Test connection**, verify the key and model permissions in Groq, and check your quota. Public hosting does not provide free or unlimited AI inference.

Future pushes to **main** run the included checks and republish the app automatically. A failing check stops deployment so a broken update is not published.
