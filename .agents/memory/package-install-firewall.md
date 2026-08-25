---
name: Package install firewall
description: Replit's package firewall may block specific vulnerable tarball versions during npm install.
---

When npm installation is blocked by the package firewall, prefer a compatible newer patched release through package overrides and regenerate the lockfile rather than weakening the security policy.

**Why:** Imported dependency lockfiles can pin versions that the workspace security policy refuses, even when newer compatible releases are available.

**How to apply:** Check the blocked package's available versions, add the narrowest override needed, and verify the application after reinstalling.