# Archived Studio history

`studio-cleanup-2026-11-08/before-cleanup.tar.gz` is a rollback snapshot of the pre-cleanup `server/`, `docs/`, `scripts/` and root package/instruction files. It contains the originals of every removed or refactored file. It contains no `.env` or runtime account/project data.

The archive is compressed deliberately: old application modules and workflow instructions are outside the active source and documentation trees. Nothing in the app imports it.

- `removed-files.json`: every path removed from the active tree, with its SHA-256.
- `module-graph.json`: current server import graph and app-runtime reachability.
- `protected-hashes.json`: Step 1 baseline for the unchanged engine, brain, example assets, core planners/QA/compiler, Autopilot and no-AI guard.

To inspect an original, extract the snapshot into a **separate temporary directory**, retaining the archived paths. Archived code is historical reference, not a runnable second application. Do not restore it over active files as part of routine development.

Current architecture and the full removal list: [CODEBASE_AUDIT.md](../docs/CODEBASE_AUDIT.md).
