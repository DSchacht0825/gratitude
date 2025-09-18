const fs = require('fs');
const path = require('path');

// Backup original files and switch to Netlify versions
const filesToSwitch = [
  {
    original: 'src/App.tsx',
    netlify: 'src/App.netlify.tsx',
    backup: 'src/App.backup.tsx'
  },
  {
    original: 'src/contexts/AuthContext.tsx',
    netlify: 'src/contexts/AuthContext.netlify.tsx',
    backup: 'src/contexts/AuthContext.backup.tsx'
  },
  {
    original: 'src/components/Journal/JournalEntry.tsx',
    netlify: 'src/components/Journal/JournalEntry.netlify.tsx',
    backup: 'src/components/Journal/JournalEntry.backup.tsx'
  }
];

console.log('Switching to Netlify-compatible static version...');

filesToSwitch.forEach(({ original, netlify, backup }) => {
  try {
    // Backup original
    if (fs.existsSync(original)) {
      fs.copyFileSync(original, backup);
      console.log(`✓ Backed up ${original} to ${backup}`);
    }

    // Copy Netlify version to original
    if (fs.existsSync(netlify)) {
      fs.copyFileSync(netlify, original);
      console.log(`✓ Switched ${original} to Netlify version`);
    }
  } catch (error) {
    console.error(`✗ Error switching ${original}:`, error.message);
  }
});

console.log('\n🎉 Switched to Netlify static version!');
console.log('📝 To switch back, run: node switch-to-fullstack.js');
console.log('🚀 Ready to deploy to Netlify with: npm run build');