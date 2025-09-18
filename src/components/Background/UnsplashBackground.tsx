import React, { useState, useEffect } from 'react';

const UnsplashBackground: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const naturalImages = [
      'https://source.unsplash.com/1920x1080/?nature,peaceful',
      'https://source.unsplash.com/1920x1080/?forest,zen',
      'https://source.unsplash.com/1920x1080/?mountains,serene',
      'https://source.unsplash.com/1920x1080/?lake,calm',
      'https://source.unsplash.com/1920x1080/?ocean,meditation',
      'https://source.unsplash.com/1920x1080/?sunrise,spiritual',
      'https://source.unsplash.com/1920x1080/?trees,contemplative',
      'https://source.unsplash.com/1920x1080/?clouds,peaceful'
    ];

    const randomImage = naturalImages[Math.floor(Math.random() * naturalImages.length)];
    setImageUrl(randomImage);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-cover bg-center transition-opacity duration-1000"
      style={{
        backgroundImage: `url(${imageUrl})`,
        opacity: 0.4,
        zIndex: -1,
      }}
    />
  );
};

export default UnsplashBackground;