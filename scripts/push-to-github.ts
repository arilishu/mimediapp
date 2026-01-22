import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'mimediapp-replit';
const REPO_DESCRIPTION = 'MiMediApp - Gestión de Salud Familiar';

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.cache',
  '.replit',
  'replit.nix',
  '.upm',
  '.config',
  'dist',
  '.expo',
  'package-lock.json',
  'scripts/push-to-github.ts',
];

function shouldIgnore(filePath: string): boolean {
  return IGNORED_PATHS.some(ignored => filePath.includes(ignored));
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (shouldIgnore(fullPath)) return;

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function main() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);

    let repo;
    try {
      const { data: existingRepo } = await octokit.repos.get({
        owner: user.login,
        repo: REPO_NAME,
      });
      repo = existingRepo;
      console.log(`Repository ${REPO_NAME} already exists`);
    } catch (e: any) {
      if (e.status === 404) {
        console.log(`Creating repository ${REPO_NAME}...`);
        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
          name: REPO_NAME,
          description: REPO_DESCRIPTION,
          private: false,
          auto_init: false,
        });
        repo = newRepo;
        console.log(`Repository created: ${newRepo.html_url}`);
      } else {
        throw e;
      }
    }

    const files = getAllFiles('.');
    console.log(`Found ${files.length} files to upload`);

    const readmeContent = `# MiMediApp

Aplicación de gestión de salud familiar desarrollada con Expo (React Native).

## Características

- Gestión de perfiles de familiares
- Registro de visitas médicas
- Calendario de vacunación
- Gestión de turnos médicos
- Registro de alergias y medicamentos
- Contactos de emergencia

## Tecnologías

- Frontend: Expo / React Native
- Backend: Express.js
- Base de datos: PostgreSQL
- Autenticación: Clerk
`;

    console.log('Creating initial commit...');
    await octokit.repos.createOrUpdateFileContents({
      owner: user.login,
      repo: REPO_NAME,
      path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from(readmeContent).toString('base64'),
    });
    console.log('Created README.md');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
    });
    const mainSha = ref.object.sha;

    const blobs: Array<{ path: string; sha: string }> = [];
    
    console.log('Uploading files...');
    for (const filePath of files) {
      const content = fs.readFileSync(filePath);
      const base64Content = content.toString('base64');
      
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: REPO_NAME,
        content: base64Content,
        encoding: 'base64',
      });
      
      blobs.push({
        path: filePath.startsWith('./') ? filePath.slice(2) : filePath,
        sha: blob.sha,
      });
      
      process.stdout.write('.');
    }
    console.log('\nAll files uploaded as blobs');

    const tree = blobs.map(blob => ({
      path: blob.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blob.sha,
    }));

    const { data: newTree } = await octokit.git.createTree({
      owner: user.login,
      repo: REPO_NAME,
      tree,
      base_tree: mainSha,
    });

    const { data: commit } = await octokit.git.createCommit({
      owner: user.login,
      repo: REPO_NAME,
      message: 'Add all project files from Replit',
      tree: newTree.sha,
      parents: [mainSha],
    });

    await octokit.git.updateRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: commit.sha,
    });

    console.log(`\nSuccess! Code pushed to: https://github.com/${user.login}/${REPO_NAME}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
