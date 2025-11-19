const fs = require('fs');
const path = require('path');

const directory = 'apps/web/src';
const replacements = [
  { from: '@/lib/utils', to: '@passman/utils' },
  { from: '@/lib/security-utils', to: '@passman/utils' },
  { from: '@/lib/password-data', to: '@passman/utils' },
  { from: '@/lib/network-config', to: '@passman/utils' },
  { from: '@/lib/construct-move-call', to: '@passman/utils' },
  { from: '@/lib/walrus-client', to: '@passman/utils' },
  { from: '@/constants/config', to: '@passman/utils' },
  { from: '@/constants/source-type', to: '@passman/utils' },
];

function updateImports(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updateImports(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      replacements.forEach(rep => {
        if (content.includes(rep.from)) {
          const regex = new RegExp(`from "${rep.from}"`, 'g');
          content = content.replace(regex, `from "${rep.to}"`);
          // Also handle single quotes
           const regexSingle = new RegExp(`from '${rep.from}'`, 'g');
          content = content.replace(regexSingle, `from '${rep.to}'`);
          updated = true;
        }
      });

      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
      }
    }
  });
}

updateImports(directory);

