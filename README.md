# Tiktok Bulk Downloader Desktop App

A desktop application for downloading multiple TikTok videos at once.

## Download

Download the latest version from [Releases](https://github.com/minhchi1509/tiktok-bulk-downloader-desktop-app/releases).

| Platform | File                                     |
| -------- | ---------------------------------------- |
| Windows  | `tiktok-bulk-downloader-x.x.x-setup.exe` |
| macOS    | `tiktok-bulk-downloader-x.x.x.dmg`       |
| Linux    | `tiktok-bulk-downloader-x.x.x.AppImage`  |

## Installation Notes

### macOS

> ⚠️ **Important:** Since this app is not signed with an Apple Developer certificate, macOS may show a warning: **"Tiktok Bulk Downloader" is damaged and can't be opened.**

**To fix this, run the following command in Terminal after installing:**

```bash
xattr -cr /Applications/Tiktok\ Bulk\ Downloader.app
```

Or if you installed it elsewhere:

```bash
xattr -cr /path/to/Tiktok\ Bulk\ Downloader.app
```

Then open the app again.

### Linux

Make the AppImage executable before running:

```bash
chmod +x tiktok-bulk-downloader-x.x.x.AppImage
./tiktok-bulk-downloader-x.x.x.AppImage
```

---

## Development

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
