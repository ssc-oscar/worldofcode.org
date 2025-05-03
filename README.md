<div align="center">
  <img src="frontend/public/woc.webp" alt="World of Code" style="max-height: 100px; @media (prefers-color-scheme: dark) { filter: invert(1); }">
</div>

<div align="center"><strong>Next Generation WoC Website</strong></div>
<div align="center">
<a href="https://worldofcode.org/"><img src="https://img.shields.io/badge/Production-UTK-FF6600" alt="View Demo"></a>
<a href="https://woc-preview.osslab-pku.org/"><img src="https://img.shields.io/badge/Preview-PKU-BD1129?y" alt="View Demo"></a>
<span>
</div>

## Features

- HTTP API (finally) + Python client (WocMapsRemote in python-woc).
- Password-less user system with GitHub, Microsoft SSO integration. Email users login by navigating through a magic link in automaticlly sent email.
- IP/User based rate limit. Visitors are rate limited by IP address, and users can log in to enjoy a higher limit.
- OpenAI-style API key management. Users can create an API key on the website and pass that as a parameter to the python client.
- Real random sampling with arbitary queries.
- And more to discover!

## Contents

- `docs`: The documentation of WoC, including guides and legal documents.
- `frontend`: The frontend of the website, built with React and TypeScript.
- `backend`: The Python backend of the website.
- `deploy`: The deployment guide, scripts and configurations.
