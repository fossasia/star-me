# Star Me

Starring is fun and following open source projects even more so.

Star Me is a small browser based script that helps developers quickly connect with FOSSASIA projects on GitHub.
By running the script in your browser console while logged into GitHub, you can automatically star repositories and stay up to date with project activity.

This tool is primarily intended for onboarding, workshops, and community engagement. No GitHub token or API access is required.

## What does this script do

* Automatically stars FOSSASIA repositories on GitHub
* Runs entirely in your browser while you are logged in
* Does not require any installation, extensions, or authentication tokens
* Helps you discover projects and receive updates more easily

## Requirements

• A GitHub account
• You must be signed in to GitHub
• A modern browser such as Chrome or Chromium
• JavaScript enabled

## Steps

## 1. Sign in to GitHub

Make sure you are logged in to your GitHub account before proceeding.

## 2. Copy the script

Open the file `star.user.js` from the repository and copy the entire script content.

## 3. Open Developer Tools in your browser

Make sure you are on a tab with an open GitHub page.

### Linux and Windows

Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd>

### macOS

Press <kbd>⌘</kbd> + <kbd>⌥</kbd> + <kbd>I</kbd>

### Expected view

The Developer Tools window should open, similar to the screenshot below.

![This is the image where the developer tools should be but for some reason or another it is not displayed :(](./docs/chrome-dev-tools.png)

## 4. Open the Console tab

In the Developer Tools, switch to the `Console` tab and click inside the input area.

Ensure that the active browser tab is still a GitHub page.

## 5. Paste and run the script

Paste the script into the Console.

• Windows or Linux: <kbd>Ctrl</kbd> + <kbd>V</kbd>
• macOS: <kbd>⌘</kbd> + <kbd>V</kbd>

Then press <kbd>Enter</kbd>.

## 6. Wait for completion

The script will run for a few minutes depending on the number of repositories.

When finished, it prints
“Finally Over ;-)”
in blue color.

Please allow the script to run until completion.

## 7. Done. Start contributing

Once finished, the repositories will appear in your starred list on GitHub.

You can now
* Explore projects that match your interests
* Receive updates and notifications
* Start contributing to FOSSASIA open source projects

## Safety note

You are running this script manually in your browser console.
Only execute scripts that you understand and trust.

This script only interacts with GitHub pages you are currently logged into and does not send data elsewhere.

## Future improvements

Planned or proposed improvements include
* Option to star only a selected list of repositories
* Option to follow the organization itself
* Clear configuration section inside the script

Contributions and suggestions are welcome.
