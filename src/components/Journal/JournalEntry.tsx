import React, { useState, useEffect } from 'react';
import { apiEndpoints } from '../../config/api';

interface JournalEntryData {
  morningGratitude1?: string;
  morningGratitude2?: string;
  morningGratitude3?: string;
  morningIntention?: string;
  morningPrayer?: string;
  eveningReflection1?: string;
  eveningReflection2?: string;
  eveningReflection3?: string;
  eveningLearning?: string;
  eveningGratitude?: string;
}

const JournalEntry: React.FC = () => {
  const [entry, setEntry] = useState<JournalEntryData>({});
  const [currentSection, setCurrentSection] = useState<'morning' | 'evening'>('morning');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [hasEntry, setHasEntry] = useState<boolean>(false);

  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(apiEndpoints.journal.dates, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const dates = await response.json();
          setAvailableDates(dates.map((d: any) => d.date));
        }
      } catch (error) {
        console.error('Failed to load dates:', error);
      }
    };

    loadAvailableDates();
  }, []);

  useEffect(() => {
    const loadEntry = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const url = `${apiEndpoints.journal.get}?date=${currentDate}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setEntry(data || {});
          setHasEntry(!!data && !!data.id);
        }
      } catch (error) {
        console.error('Failed to load entry:', error);
      }
    };

    loadEntry();
  }, [currentDate]);

  const handleInputChange = (field: keyof JournalEntryData, value: string) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  const saveEntry = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(apiEndpoints.journal.save, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        console.log('Entry saved successfully');
        setSaveMessage('Entry saved successfully! ✓');
        setTimeout(() => setSaveMessage(''), 3000);
        setHasEntry(true);
        // Refresh available dates
        if (!availableDates.includes(currentDate)) {
          setAvailableDates(prev => [currentDate, ...prev].sort().reverse());
        }
      } else {
        console.error('Failed to save entry');
        setSaveMessage('Failed to save entry. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      setSaveMessage('Failed to save entry. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async () => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(apiEndpoints.journal.delete, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: currentDate }),
      });

      if (response.ok) {
        setSaveMessage('Entry deleted successfully');
        setTimeout(() => setSaveMessage(''), 3000);
        setEntry({});
        setHasEntry(false);
        // Remove from available dates
        setAvailableDates(prev => prev.filter(date => date !== currentDate));
      } else {
        setSaveMessage('Failed to delete entry. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      setSaveMessage('Failed to delete entry. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const morningPrompts = (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-gray-800 mb-2">Morning Contemplation</h2>
        <p className="text-gray-600 italic">
          "The best way to take care of the future is to take care of the present moment."
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What am I grateful for this morning? (1)
          </label>
          <textarea
            value={entry.morningGratitude1 || ''}
            onChange={(e) => handleInputChange('morningGratitude1', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="I am grateful for..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What am I grateful for this morning? (2)
          </label>
          <textarea
            value={entry.morningGratitude2 || ''}
            onChange={(e) => handleInputChange('morningGratitude2', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="I am grateful for..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What am I grateful for this morning? (3)
          </label>
          <textarea
            value={entry.morningGratitude3 || ''}
            onChange={(e) => handleInputChange('morningGratitude3', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="I am grateful for..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What is my intention for today?
          </label>
          <textarea
            value={entry.morningIntention || ''}
            onChange={(e) => handleInputChange('morningIntention', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Today I intend to..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            A prayer or sacred word for the day
          </label>
          <textarea
            value={entry.morningPrayer || ''}
            onChange={(e) => handleInputChange('morningPrayer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="May I... / Let me remember... / Today I hold in my heart..."
          />
        </div>
      </div>
    </div>
  );

  const eveningPrompts = (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-gray-800 mb-2">Evening Reflection</h2>
        <p className="text-gray-600 italic">
          "God comes to you disguised as your life."
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Where did I see the Divine today? (1)
          </label>
          <textarea
            value={entry.eveningReflection1 || ''}
            onChange={(e) => handleInputChange('eveningReflection1', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="I noticed the sacred in..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Where did I see the Divine today? (2)
          </label>
          <textarea
            value={entry.eveningReflection2 || ''}
            onChange={(e) => handleInputChange('eveningReflection2', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="I noticed the sacred in..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Where did I see the Divine today? (3)
          </label>
          <textarea
            value={entry.eveningReflection3 || ''}
            onChange={(e) => handleInputChange('eveningReflection3', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="I noticed the sacred in..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What did life teach me today?
          </label>
          <textarea
            value={entry.eveningLearning || ''}
            onChange={(e) => handleInputChange('eveningLearning', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Today I learned... / I was reminded that..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What am I grateful for as this day ends?
          </label>
          <textarea
            value={entry.eveningGratitude || ''}
            onChange={(e) => handleInputChange('eveningGratitude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="As this day closes, I give thanks for..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
        {/* Date Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-medium text-gray-800">
              {formatDate(currentDate)}
            </h1>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {hasEntry && (
                <button
                  onClick={deleteEntry}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {availableDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Previous entries:</span>
              {availableDates.slice(0, 5).map((date) => (
                <button
                  key={date}
                  onClick={() => setCurrentDate(date)}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    date === currentDate
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </button>
              ))}
              {availableDates.length > 5 && (
                <span className="text-xs text-gray-500">+{availableDates.length - 5} more</span>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setCurrentSection('morning')}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentSection === 'morning'
                  ? 'bg-white shadow-sm text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => setCurrentSection('evening')}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentSection === 'evening'
                  ? 'bg-white shadow-sm text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Evening
            </button>
          </div>
        </div>

        {currentSection === 'morning' ? morningPrompts : eveningPrompts}

        <div className="mt-8 text-center">
          <button
            onClick={saveEntry}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
          {saveMessage && (
            <div className={`mt-3 text-sm font-medium ${
              saveMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalEntry;