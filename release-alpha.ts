#!/usr/bin/env bun

import { execSync } from 'child_process';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageJson {
  name: string;
  version: string;
}

function execCommand(command: string, cwd?: string): string {
  console.log(`🔧 Executing: ${command}`);
  return execSync(command, {
    encoding: 'utf8',
    cwd: cwd || process.cwd(),
    stdio: ['inherit', 'pipe', 'inherit']
  }).toString().trim();
}

function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '')
    .split('.')[0];
}

function discoverPackages(): string[] {
  const packagesDir = join(process.cwd(), 'packages');
  const packages = readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`📦 Discovered packages: ${packages.join(', ')}`);
  return packages;
}

function updatePackageVersion(packageName: string, newVersion: string): void {
  const packageDir = join(process.cwd(), 'packages', packageName);
  const packageJsonPath = join(packageDir, 'package.json');

  const packageJson: any = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;

  // Replace workspace dependencies with actual versions
  if (packageJson.dependencies) {
    for (const [depName, depVersion] of Object.entries(packageJson.dependencies)) {
      if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
        // Replace workspace:* with the new version for internal packages
        if (depName.startsWith('@senditly/')) {
          packageJson.dependencies[depName] = newVersion;
        }
      }
    }
  }

  if (packageJson.devDependencies) {
    for (const [depName, depVersion] of Object.entries(packageJson.devDependencies)) {
      if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
        if (depName.startsWith('@senditly/')) {
          packageJson.devDependencies[depName] = newVersion;
        }
      }
    }
  }

  if (packageJson.peerDependencies) {
    for (const [depName, depVersion] of Object.entries(packageJson.peerDependencies)) {
      if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
        if (depName.startsWith('@senditly/')) {
          packageJson.peerDependencies[depName] = newVersion;
        }
      }
    }
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`📝 Updated ${packageJson.name} version to ${newVersion}`);
}

function publishPackage(packageName: string): void {
  const packageDir = join(process.cwd(), 'packages', packageName);
  const packageJsonPath = join(packageDir, 'package.json');
  const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  console.log(`📦 Publishing ${packageJson.name}...`);
  execCommand('npm publish --access public --tag alpha', packageDir);
  console.log(`✅ ${packageJson.name} published successfully!`);
}

function createGitTag(tagVersion: string): void {
  console.log(`🏷️ Creating git tag: ${tagVersion}`);
  execCommand(`git tag "${tagVersion}"`);
  execCommand(`git push origin "${tagVersion}"`);
}

function createGitHubRelease(tagVersion: string, packages: string[], timestamp: string): void {
  console.log(`🚀 Creating GitHub release: v${tagVersion}`);

  let releaseBody = `## Canary Release v${tagVersion}

This is an automated alpha release from the main branch.

### Published Packages`;

  // Add package list
  for (const packageName of packages) {
    const packageJsonPath = join(process.cwd(), 'packages', packageName, 'package.json');
    const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    releaseBody += `\n- ${packageJson.name}@${packageJson.version}`;
  }

  releaseBody += `\n\n### Installation\n\n`;

  // Add installation commands
  for (const packageName of packages) {
    const packageJsonPath = join(process.cwd(), 'packages', packageName, 'package.json');
    const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    releaseBody += `\nnpm install ${packageJson.name}@${packageJson.version}`;
  }

  releaseBody += `\n\n\n**Commit:** ${process.env.GITHUB_SHA || 'unknown'}\n**Timestamp:** ${timestamp}`;

  const releaseCommand = `gh release create "${tagVersion}" --title "Release ${tagVersion}" --notes "${releaseBody}" --prerelease`;
  execCommand(releaseCommand);
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting alpha release process...');

    // Generate timestamp
    const timestamp = generateTimestamp();
    console.log(`⏰ Generated timestamp: ${timestamp}`);

    // Discover packages
    const packages = discoverPackages();

    // Process each package
    for (const packageName of packages) {
      // Read current version
      const packageJsonPath = join(process.cwd(), 'packages', packageName, 'package.json');
      const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const currentVersion = packageJson.version;
      const canaryVersion = `${currentVersion}-alpha-${timestamp}`;

      console.log(`\n🔨 Processing ${packageJson.name} package...`);
      console.log(`📝 Canary version for ${packageJson.name}: ${canaryVersion}`);

      // Update version
      updatePackageVersion(packageName, canaryVersion);

      // Publish package
      publishPackage(packageName);

      console.log(`✅ ${packageJson.name} package processed successfully!\n`);
    }

    // Create git tag
    const gitTagVersion = `v.alpha-${timestamp}`;
    createGitTag(gitTagVersion);

    // Create GitHub release
    createGitHubRelease(gitTagVersion, packages, timestamp);

    console.log('🎉 All packages processed successfully!');

  } catch (error) {
    console.error('❌ Error during release process:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}