# Optional reference images

The original test artwork, mask and comparison come from the
[PIXLS.US discussion by seasnakes](https://discuss.pixls.us/t/recreating-the-ibis-waterdrop-filter-with-gmic/48166).
They are downloaded separately and are not tracked in this repository.

From the project root, run:

```sh
npm run fetch:reference
```

This requires Python 3 and network access. The downloader verifies SHA-256 checksums,
reuses matching files and does not overwrite modified files. Normal development,
tests and the built-in demo do not require these images.

Expected files:

- `avatortest.png`: background artwork, 690 × 690.
- `mask.png`: transparent shape mask, 690 × 690.
- `contrast.png`: comparison posted in the discussion, 690 × 299.

Image rights remain with their respective owners. Fetching a reference does not
grant permission to redistribute or relicense it. If the source becomes unavailable,
the app can still use your own imported background and mask.
