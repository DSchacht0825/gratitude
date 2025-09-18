const fs = require('fs');
const path = require('path');

// Restore original full-stack files
const filesToRestore = [
  {
    original: 'src/App.tsx',
    backup: 'src/App.backup.tsx'
  },
  {
    original: 'src/contexts/AuthContext.tsx',
    backup: 'src/contexts/AuthContext.backup.tsx'
  },
  {
    original: 'src/components/Journal/JournalEntry.tsx',
    backup: 'src/components/Journal/JournalEntry.backup.tsx'
  }
];

console.log('Switching back to full-stack version...');

filesToRestore.forEach(({ original, backup }) => {
  try {
    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, original);
      console.log(`✓ Restored ${original} from backup`);
    }
  } catch (error) {
    console.error(`✗ Error restoring ${original}:`, error.message);
  }
});

console.log('\n🎉 Switched back to full-stack version!');
console.log('🚀 Ready for Railway deployment with backend database');