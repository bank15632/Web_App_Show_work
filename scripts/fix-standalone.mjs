import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dotNext = path.join(root, ".next");
const standaloneRoot = path.join(dotNext, "standalone");
const standaloneNext = path.join(standaloneRoot, ".next");
const packageRoots = {
  next: path.join(root, "node_modules", "next"),
  "styled-jsx": path.join(root, "node_modules", "styled-jsx"),
};

function collectFiles(rootDir, currentDir = rootDir, files = []) {
  if (!fs.existsSync(currentDir)) {
    return files;
  }

  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(rootDir, absolutePath, files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    files.push(path.relative(rootDir, absolutePath).replaceAll("\\", "/"));
  }

  return files;
}

function patchTraceManifest(filename, extraFiles) {
  const manifestPath = path.join(dotNext, filename);
  if (!fs.existsSync(manifestPath)) {
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const mergedFiles = new Set(manifest.files ?? []);

  for (const file of extraFiles) {
    mergedFiles.add(file);
  }

  manifest.files = Array.from(mergedFiles).sort();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
}

if (!fs.existsSync(dotNext)) {
  process.exit(0);
}

fs.mkdirSync(standaloneNext, { recursive: true });

const entriesToCopy = [
  "server",
  "static",
  "BUILD_ID",
  "app-path-routes-manifest.json",
  "build-manifest.json",
  "images-manifest.json",
  "next-minimal-server.js.nft.json",
  "next-server.js.nft.json",
  "package.json",
  "prerender-manifest.json",
  "react-loadable-manifest.json",
  "required-server-files.js",
  "required-server-files.json",
  "routes-manifest.json",
];

if (!fs.existsSync(path.join(standaloneNext, "server/pages-manifest.json"))) {
  for (const entry of entriesToCopy) {
    const source = path.join(dotNext, entry);
    const destination = path.join(standaloneNext, entry);

    if (!fs.existsSync(source)) {
      continue;
    }

    fs.cpSync(source, destination, {
      force: true,
      recursive: true,
    });
  }
}

const rootPackageJson = path.join(root, "package.json");
if (fs.existsSync(rootPackageJson)) {
  fs.copyFileSync(rootPackageJson, path.join(standaloneRoot, "package.json"));
}

const sourceNodeModules = path.join(root, "node_modules");
const standaloneNodeModules = path.join(standaloneRoot, "node_modules");
if (fs.existsSync(sourceNodeModules) && !fs.existsSync(standaloneNodeModules)) {
  fs.symlinkSync(sourceNodeModules, standaloneNodeModules, "junction");
}

const extraTraceFiles = Object.entries(packageRoots).flatMap(([packageName, packageRoot]) => {
  const packageFiles = collectFiles(packageRoot).map(
    (file) => `../node_modules/${packageName}/${file}`,
  );

  return packageFiles;
});

patchTraceManifest("next-server.js.nft.json", extraTraceFiles);
patchTraceManifest("next-minimal-server.js.nft.json", extraTraceFiles);
